<?php

declare(strict_types=1);

use App\Http\Middleware\DatabaseFailoverMiddleware;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\EnsureUserIsSeller;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {

        // ---------------------------------------------------------------------
        // CORS — Laravel 12 standard (via config/cors.php + middleware fluent)
        // ---------------------------------------------------------------------
        // L'authentification repose exclusivement sur un Bearer token Sanctum.
        // Aucun cookie de session n'est en jeu côté API, donc :
        //   • supports_credentials = false (pas de cookie cross-origin)
        //   • allowed_origins = dynamique via FRONTEND_URL
        //   • allowed_headers = explicites pour Bearer auth
        // La config réelle est lue depuis config/cors.php (ci-dessous on
        // s'assure que le middleware HandleCors est bien actif sur les routes API).

        // Proxies de confiance : Hostinger / Vercel / CloudFlare / Neon.
        // En mutualisé, on fait confiance au reverse-proxy de l'hébergeur.
        $middleware->trustProxies(
            at: '*',
            headers: \Illuminate\Http\Request::HEADER_X_FORWARDED_FOR
                   | \Illuminate\Http\Request::HEADER_X_FORWARDED_HOST
                   | \Illuminate\Http\Request::HEADER_X_FORWARDED_PORT
                   | \Illuminate\Http\Request::HEADER_X_FORWARDED_PROTO,
        );

        // Hôtes de confiance — en prod, remplacés dynamiquement par APP_URL.
        $middleware->trustHosts(at: [
            'localhost',
            '127.0.0.1',
            fn () => parse_url(config('app.url'), PHP_URL_HOST),
        ]);

        // Alias de middleware pour les routes protégées par rôle.
        $middleware->alias([
            'seller' => EnsureUserIsSeller::class,
            'admin'  => EnsureUserIsAdmin::class,
        ]);

        // Failover global sur toutes les requêtes API (bascule PostgreSQL → SQLite).
        $middleware->appendToGroup('api', DatabaseFailoverMiddleware::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })
    ->create();
