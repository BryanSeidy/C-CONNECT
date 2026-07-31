<?php

declare(strict_types=1);

/**
 * Sanctum — configuration pour l'authentification par token Bearer.
 *
 * On n'utilise plus le mode stateful (cookie SPA) : 'stateful' est vide,
 * donc EnsureFrontendRequestsAreStateful ne s'applique à aucun domaine et
 * toute requête passe par la vérification du token API personnel envoyé
 * dans l'en-tête Authorization: Bearer <token>.
 */
return [

    'stateful' => [],

    'guard' => ['web'],

    'expiration' => 1440, // 24h — les tokens doivent être renouvelés via un nouveau login

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies'      => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token'  => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],

];
