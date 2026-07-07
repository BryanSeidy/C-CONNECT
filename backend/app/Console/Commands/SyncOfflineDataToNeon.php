<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * SyncOfflineDataToNeon
 *
 * php artisan db:sync-neon
 *
 * Parcourt la base SQLite locale, extrait les enregistrements ou
 * synced = false (mutations offline), les pousse vers Neon via
 * updateOrInsert keye sur sync_ref, puis marque synced = true.
 *
 * Tables reconciliees dans l'ordre de dependance FK :
 *   users → seller_profiles → products → orders → companies → rfqs
 *   → rfq_bids → disputes → gamification_stats
 */
class SyncOfflineDataToNeon extends Command
{
    protected $signature   = 'db:sync-neon {--dry-run : Affiche les enregistrements sans les envoyer}';
    protected $description = 'Reconcilie les mutations offline (SQLite) vers le cluster Neon PostgreSQL.';

    // Tables reconciliees dans l'ordre topologique (respect des FK)
    private const SYNC_TABLES = [
        'users',
        'seller_profiles',
        'categories',
        'products',
        'orders',
        'order_items',
        'companies',
        'rfqs',
        'rfq_bids',
        'disputes',
        'recurring_orders',
        'gamification_stats',
    ];

    // Nombre de lignes traitees par batch
    private const BATCH_SIZE = 50;

    public function handle(): int
    {
        $isDryRun = (bool) $this->option('dry-run');

        $this->info('[db:sync-neon] Demarrage de la reconciliation SQLite -> Neon');

        // Verifier que Neon est accessible avant de commencer
        if (!$this->isNeonReachable()) {
            $this->warn('[db:sync-neon] Neon inaccessible — synchronisation reportee.');
            return Command::FAILURE;
        }

        $sqlitePath = database_path('local_backup.sqlite');

        if (!file_exists($sqlitePath)) {
            $this->info('[db:sync-neon] Aucun fichier SQLite local trouve. Rien a synchroniser.');
            return Command::SUCCESS;
        }

        // Connexion SQLite source
        Config::set('database.connections.sqlite_sync.driver',   'sqlite');
        Config::set('database.connections.sqlite_sync.database', $sqlitePath);
        Config::set('database.connections.sqlite_sync.foreign_key_constraints', false);

        $totalSynced = 0;
        $totalErrors = 0;

        foreach (self::SYNC_TABLES as $table) {
            [$synced, $errors] = $this->syncTable($table, $isDryRun);
            $totalSynced += $synced;
            $totalErrors += $errors;
        }

        // Nettoyage de la connexion temporaire
        DB::purge('sqlite_sync');

        $this->line('');
        $this->info(sprintf(
            '[db:sync-neon] Terminé — %d enregistrement(s) reconcilie(s), %d erreur(s)',
            $totalSynced,
            $totalErrors
        ));

        return $totalErrors === 0 ? Command::SUCCESS : Command::FAILURE;
    }

    /**
     * Synchronise une table depuis SQLite vers Neon.
     *
     * @return array{int, int} [synced_count, error_count]
     */
    private function syncTable(string $table, bool $isDryRun): array
    {
        // Verifier que la table existe dans le SQLite local
        $exists = DB::connection('sqlite_sync')
            ->select("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [$table]);

        if (empty($exists)) {
            return [0, 0];
        }

        $synced = 0;
        $errors = 0;

        DB::connection('sqlite_sync')
            ->table($table)
            ->whereRaw("(synced = 0 OR synced = 'false')")
            ->orderBy('created_at')
            ->chunk(self::BATCH_SIZE, function ($rows) use ($table, $isDryRun, &$synced, &$errors): void {
                foreach ($rows as $row) {
                    $data = (array) $row;

                    if (empty($data['sync_ref'])) {
                        $this->warn("  [SKIP] {$table} — sync_ref manquant pour l'enregistrement.");
                        continue;
                    }

                    if ($isDryRun) {
                        $this->line("  [DRY] {$table}:{$data['sync_ref']} — serait synchronise");
                        $synced++;
                        continue;
                    }

                    try {
                        // Retirer les colonnes non presentes dans Neon (SQLite-only)
                        unset($data['synced'], $data['rowid']);

                        DB::connection('pgsql')->table($table)->updateOrInsert(
                            ['sync_ref' => $data['sync_ref']],
                            $data
                        );

                        // Marquer comme reconcilie dans SQLite
                        DB::connection('sqlite_sync')
                            ->table($table)
                            ->where('sync_ref', $data['sync_ref'])
                            ->update(['synced' => true]);

                        $synced++;
                        $this->line("  [OK]   {$table}:{$data['sync_ref']}");

                    } catch (\Throwable $e) {
                        $errors++;
                        Log::error('[db:sync-neon] Echec de sync', [
                            'table'    => $table,
                            'sync_ref' => $data['sync_ref'] ?? 'unknown',
                            'error'    => $e->getMessage(),
                        ]);
                        $this->error("  [ERR]  {$table}:{$data['sync_ref']} — {$e->getMessage()}");
                    }
                }
            });

        if ($synced > 0) {
            $this->info("  {$table}: {$synced} enregistrement(s) reconcilie(s)");
        }

        return [$synced, $errors];
    }

    /**
     * Teste rapidement la connectivite Neon avant de synchroniser.
     */
    private function isNeonReachable(): bool
    {
        try {
            DB::connection('pgsql')->select('SELECT 1');
            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
