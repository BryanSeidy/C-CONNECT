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

        // Auth par token Bearer (Sanctum) uniquement — plus de mode SPA cookie.
        // statefulApi() posait laravel_session/XSRF-TOKEN sur toute requête
        // stateful (même anonyme), ce qui a causé un bug de boucle de
        // redirection sur le frontend (voir commit "Fix critical redirect
        // loop"). Le Bearer token est plus simple à déboguer, universel côté
        // mobile, et n'a pas besoin de config CORS/CSRF/SameSite.
        $middleware->trustHosts(at: ['localhost', '127.0.0.1']);
        $middleware->appendToGroup('api', DatabaseFailoverMiddleware::class); // Failover global sur toutes les requetes API
    $middleware->alias([
            'seller' => EnsureUserIsSeller::class,
            'admin'  => EnsureUserIsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn(Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })
    ->create();
