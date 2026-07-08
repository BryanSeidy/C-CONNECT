<?php

declare(strict_types=1);

/**
 * CORS — Cross-Origin Resource Sharing
 *
 * Authentification par Bearer token (Sanctum personal access token) — aucun
 * cookie de session n'est en jeu, donc `supports_credentials` est à false et
 * `allowed_origins` pourrait même être '*' sans risque. On garde une liste
 * explicite par prudence (moins de surface pour un CORS mal configuré en
 * prod), mais ce n'est plus une contrainte de sécurité liée aux cookies.
 */
return [

    'paths' => [
        'api/*',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Requested-With',
        'X-Database-Mode',
        'x-database-mode',
    ],

    'exposed_headers' => [
        'X-Database-Mode'
    ],

    'max_age' => 0,

    'supports_credentials' => false,

];
