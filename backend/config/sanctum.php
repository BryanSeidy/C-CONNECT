<?php

declare(strict_types=1);

use Laravel\Sanctum\Sanctum;

/**
 * Sanctum — configuration pour le mode stateful (cookie SPA)
 *
 * SANCTUM_STATEFUL_DOMAINS liste les domaines dont les requêtes doivent
 * être traitées comme "stateful" (session cookie plutôt que token).
 * En local : localhost:3000. En production : votre domaine sans https://.
 *
 * Note : Sanctum lit aussi FRONTEND_URL comme fallback. En définissant
 * les deux, on couvre localhost ET 127.0.0.1 sans ambiguïté.
 */
return [

    'stateful' => explode(',', env(
        'SANCTUM_STATEFUL_DOMAINS',
        sprintf(
            '%s%s',
            'localhost,localhost:3000,127.0.0.1,127.0.0.1:3000,::1',
            Sanctum::currentApplicationUrlWithPort()
                ? ',' . Sanctum::currentApplicationUrlWithPort()
                : ''
        )
    )),

    'guard' => ['web'],

    'expiration' => null,   // null = les tokens ne périment pas (stateful SPA)

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies'      => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token'  => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],

];
