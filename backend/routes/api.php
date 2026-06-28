<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EscrowController;
use App\Http\Controllers\Api\GamificationController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SellerProfileController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/webhooks/payments', PaymentWebhookController::class);

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::apiResource('categories', CategoryController::class)->only(['index', 'show']);
Route::apiResource('products', ProductController::class)->only(['index', 'show']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/auth/profile', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::post('/orders/{order}/release-funds', [EscrowController::class, 'releaseFunds']);
    Route::get('/gamification/me', [GamificationController::class, 'show']);

    Route::middleware('seller')->prefix('seller')->group(function (): void {
        Route::get('/gamification', [GamificationController::class, 'show']);
    });

    Route::apiResource('categories', CategoryController::class)->except(['index', 'show']);
    Route::apiResource('products', ProductController::class)->except(['index', 'show']);
    Route::apiResource('orders', OrderController::class);
    Route::apiResource('seller-profiles', SellerProfileController::class);

    Route::post('/payment/mobile-money', [PaymentController::class, 'processMobileMoney']);
});
