<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EscrowController;
use App\Http\Controllers\Api\GamificationController;
use App\Http\Controllers\Api\PaymentWebhookController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/webhooks/payments', PaymentWebhookController::class);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/orders/{order}/release-funds', [EscrowController::class, 'releaseFunds']);
    Route::get('/gamification/me', [GamificationController::class, 'show']);

    Route::middleware('seller')->prefix('seller')->group(function (): void {
        Route::get('/gamification', [GamificationController::class, 'show']);
    });
});
