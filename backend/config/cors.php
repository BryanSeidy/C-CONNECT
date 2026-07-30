<?php

declare(strict_types=1);

/**
 * CORS — Cross-Origin Resource Sharing (Laravel 12 / Framework 13.x)
 *
 * Configuration adaptée pour l'architecture C-Connect :
 *   • Frontend Next.js hébergé sur Vercel (production + preview deploys)
 *   • Backend API Laravel avec authentification Bearer Token (Sanctum)
 *   • Aucun cookie cross-origin — supports_credentials = false
 *
 * L'origin du frontend est résolue dynamiquement via FRONTEND_URL.
 * Les déploiements de preview Vercel (*.vercel.app) sont autorisés
 * via allowed_origins_patterns pour le développement et la CI/CD.
 */
return [

    /*
    |--------------------------------------------------------------------------
    | CORS Paths
    |--------------------------------------------------------------------------
    |
    | Routes soumises au middleware HandleCors. On couvre toute l'API
    | et le endpoint de santé.
    |
    */
    'paths' => [
        'api/*',
        'up',
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed Methods
    |--------------------------------------------------------------------------
    */
    'allowed_methods' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins (explicites)
    |--------------------------------------------------------------------------
    |
    | L'URL principale du frontend en production (depuis FRONTEND_URL)
    | + les origines de développement local.
    |
    */
    'allowed_origins' => array_filter([
        env('FRONTEND_URL', 'http://localhost:3000'),
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]),

    /*
    |--------------------------------------------------------------------------
    | Allowed Origins Patterns (Vercel Preview Deploys)
    |--------------------------------------------------------------------------
    |
    | Chaque push / PR sur Vercel génère un sous-domaine unique :
    |   c-connect-*.vercel.app
    | On autorise le pattern pour éviter de lister chaque URL à la main.
    |
    */
    'allowed_origins_patterns' => [
        '#^https://c-connect(-[a-z0-9]+)?\.vercel\.app$#',
    ],

    /*
    |--------------------------------------------------------------------------
    | Allowed Headers
    |--------------------------------------------------------------------------
    |
    | Headers requis pour l'authentification Bearer token et les requêtes
    | standard AJAX. X-Database-Mode est un header custom pour le failover.
    |
    */
    'allowed_headers' => [
        'Authorization',
        'Content-Type',
        'Accept',
        'X-Requested-With',
        'X-Database-Mode',
        'x-database-mode',
        'Origin',
    ],

    /*
    |--------------------------------------------------------------------------
    | Exposed Headers
    |--------------------------------------------------------------------------
    |
    | Headers que le navigateur peut lire dans la réponse cross-origin.
    |
    */
    'exposed_headers' => [
        'X-Database-Mode',
    ],

    /*
    |--------------------------------------------------------------------------
    | Max Age (secondes)
    |--------------------------------------------------------------------------
    |
    | Durée de cache du preflight OPTIONS par le navigateur.
    | 7200 = 2h — réduit le nombre de requêtes preflight en production.
    | 0 = pas de cache (utile en dev, géré par le navigateur).
    |
    */
    'max_age' => (int) env('CORS_MAX_AGE', 7200),

    /*
    |--------------------------------------------------------------------------
    | Supports Credentials
    |--------------------------------------------------------------------------
    |
    | false — on n'envoie JAMAIS de cookie cross-origin.
    | L'auth est exclusivement Bearer token dans le header Authorization.
    |
    */
    'supports_credentials' => false,

];
