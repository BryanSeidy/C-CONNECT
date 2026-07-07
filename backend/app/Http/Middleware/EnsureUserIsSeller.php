<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsSeller
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isSeller()) {
            return response()->json(['message' => 'Seller role required.'], 403);
        }

        return $next($request);
    }
}
