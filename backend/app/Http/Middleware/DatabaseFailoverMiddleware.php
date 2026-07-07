<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * DatabaseFailoverMiddleware
 *
 * Intercepte chaque requete entrante et tente une connexion rapide au
 * cluster PostgreSQL Neon (primaire). En cas d'echec, bascule
 * dynamiquement sur SQLite local (database/local_backup.sqlite).
 *
 * Header injecte dans chaque reponse :
 *   X-Database-Mode: online  — Neon actif
 *   X-Database-Mode: offline — SQLite failover actif
 */
class DatabaseFailoverMiddleware
{
    private const HEADER = 'X-Database-Mode';
    private const MODE_ONLINE  = 'online';
    private const MODE_OFFLINE = 'offline';

    // Timeout en secondes pour la verification de connexion
    private const CONNECT_TIMEOUT = 3;

    public function handle(Request $request, Closure $next): Response
    {
        $mode = $this->resolveMode();

        /** @var Response $response */
        $response = $next($request);

        $response->headers->set(self::HEADER, $mode);

        return $response;
    }

    // ── Core ──────────────────────────────────────────────────────────────────

    private function resolveMode(): string
    {
        // Si l'application est deja en mode SQLite (ex: set par un appel precedent),
        // ne pas re-tenter la connexion Neon a chaque requete.
        if (Config::get('database.default') === 'sqlite') {
            return self::MODE_OFFLINE;
        }

        try {
            $this->pingNeon();
            return self::MODE_ONLINE;
        } catch (\Throwable $e) {
            $this->activateFailover($e);
            return self::MODE_OFFLINE;
        }
    }

    /**
     * Ping rapide vers Neon sans charger tout l'ORM.
     * Utilise un SELECT 1 avec un timeout agressif.
     */
    private function pingNeon(): void
    {
        // Forcer un PDO direct avec timeout court pour eviter de bloquer la requete
        $dsn = sprintf(
            'pgsql:host=%s;port=%s;dbname=%s;connect_timeout=%d',
            config('database.connections.pgsql.host'),
            config('database.connections.pgsql.port', 5432),
            config('database.connections.pgsql.database'),
            self::CONNECT_TIMEOUT
        );

        $pdo = new \PDO(
            $dsn,
            (string) config('database.connections.pgsql.username'),
            (string) config('database.connections.pgsql.password'),
            [\PDO::ATTR_TIMEOUT => self::CONNECT_TIMEOUT]
        );

        $pdo->query('SELECT 1');
    }

    /**
     * Bascule la configuration de base de donnees vers SQLite.
     */
    private function activateFailover(\Throwable $reason): void
    {
        Log::warning('[DatabaseFailover] Neon unreachable — activating SQLite failover', [
            'reason' => $reason->getMessage(),
        ]);

        $sqlitePath = database_path('local_backup.sqlite');

        // Creer le fichier SQLite s'il n'existe pas encore
        if (!file_exists($sqlitePath)) {
            touch($sqlitePath);
        }

        Config::set('database.default', 'sqlite');
        Config::set('database.connections.sqlite.database', $sqlitePath);

        // Purger le cache de connexions DB pour que Laravel utilise SQLite
        DB::purge('pgsql');
        DB::reconnect('sqlite');
    }
}
