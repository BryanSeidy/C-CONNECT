<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Support\Facades\DB;
use Illuminate\Console\Command;
use Exception;

#[Signature('app:sync-local-data-to-neon')]
#[Description('Command description')]
class SyncLocalDataToNeon extends Command
{
    protected $signature = 'db:sync-neon';
    protected $description = 'Pousse les données SQLite locales vers la base de données principale Neon.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // 1. Tester si Neon est accessible
        try {
            DB::connection('neon')->getPdo();
        } catch (Exception $e) {
            $this->error('Neon est toujours inac\cessible. Abandon de la synchronisation.');
            return 1;
        }

        $this->info('Connexion à Neon établie. Début de la synchronisation...');

        // 2. Exemple pour une table "orders" (adapter selon vos tables)
        // Récupérer les données non synchronisées depuis SQLite
        $localOrders = DB::connection('sqlite_local')
            ->table('orders')
            ->where('synced', false)
            ->get();

        foreach ($localOrders as $order) {
            try {
                // Convertir l'objet en tableau et retirer la colonne interne synced si nécessaire
                $data = (array) $order;
                unset($data['synced']);

                // Insérer ou mettre à jour dans Neon (utilisation de updateOrInsert pour éviter les doublons)
                DB::connection('neon')
                    ->table('orders')
                    ->updateOrInsert(['id' => $order->id], $data);

                // Marquer comme synchronisé localement
                DB::connection('sqlite_local')
                    ->table('orders')
                    ->where('id', $order->id)
                    ->update(['synced' => true]);

                $this->info("Commande ID {$order->id} synchronisée.");
            } catch (Exception $e) {
                $this->error("Erreur de synchronisation pour l'ID {$order->id} : " . $e->getMessage());
            }
        }

        $this->info('Synchronisation terminée.');
        return 0;
    }
}
