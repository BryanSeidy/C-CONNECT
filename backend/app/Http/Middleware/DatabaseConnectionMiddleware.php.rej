<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use App\Services\DatabaseFallbackService;
use Symfony\Component\HttpFoundation\Response;

class DatabaseConnectionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        DatabaseFallbackService::connect();
        $response = $next($request);

        if(method_exists($response, 'header')) {
            $currentDb = Config::get('database.default');
            $response->header('X-Database-Mode', $currentDb === 'sqlite_local' ? 'offline' : 'Online');
        }

        return $response;
    }
}
