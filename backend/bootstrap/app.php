<?php

declare(strict_types=1);

use App\Http\Middleware\EnsureUserIsSeller;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        /*
         * statefulApi() enregistre automatiquement le pipeline Sanctum :
         *   EncryptCookies → AddQueuedCookiesToResponse → StartSession
         *   → AuthenticateSession → ShareErrorsFromSession → VerifyCsrfToken
         *
         * IMPORTANT : il doit être appelé AVANT tout alias, sans appel
         * concurrent à appendToGroup('api', ...) pour éviter les doublons.
         */
        $middleware->statefulApi();

        /*
         * Autoriser les requêtes OPTIONS (preflight CORS) sans CSRF check.
         * Laravel >= 11 le fait automatiquement via HandleCors, mais on
         * le confirme explicitement ici.
         */
        $middleware->trustHosts(at: ['localhost', '127.0.0.1']);

        $middleware->alias([
            'seller' => EnsureUserIsSeller::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Toujours répondre en JSON pour les routes /api/*
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })
    ->create();
