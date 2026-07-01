<?php

declare(strict_types=1);

/**
 * CORS — Cross-Origin Resource Sharing
 *
 * Clés de la config :
 *  - supports_credentials DOIT être true pour que les cookies Sanctum
 *    traversent le boundary localhost:3000 → localhost:8000.
 *  - allowed_origins ne peut PAS être ['*'] quand supports_credentials=true
 *    (le navigateur bloque la réponse avec une erreur CORS).
 *  - La route 'sanctum/csrf-cookie' doit être dans paths pour que le
 *    handshake CSRF soit accessible cross-origin.
 */
return [

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
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
        'X-XSRF-TOKEN',
    ],

    'exposed_headers' => [],

    'max_age' => 0,

    /*
     * CRITIQUE : doit être true pour transmettre les cookies de session
     * et le cookie XSRF-TOKEN au frontend.
     */
    'supports_credentials' => true,

];
