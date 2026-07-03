<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Exception;

class DatabaseFallbackService
{
public static function connect()
{
try {
// Tente de se connecter à Neon avec un timeout court
DB::connection('neon')->getPdo();

// Si réussi, utilise Neon par défaut
Config::set('database.default', 'neon');
} catch (Exception $e) {
// En cas d'échec de connexion, bascule sur SQLite
Config::set('database.default', 'sqlite_local');

// Optionnel : Enregistrer l'erreur dans les logs
logger()->warning('Connexion Neon échouée. Passage en mode SQLite local.');
}
}
}