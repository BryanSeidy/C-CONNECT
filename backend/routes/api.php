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

// -------------------------------------------------------------------------
// Public routes — no authentication required
// -------------------------------------------------------------------------
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/webhooks/payments', PaymentWebhookController::class);

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Public catalogue — guest browsing with zero token requirements
Route::apiResource('categories', CategoryController::class)->only(['index', 'show']);
Route::apiResource('products', ProductController::class)->only(['index', 'show']);

// -------------------------------------------------------------------------
// Protected routes — Sanctum cookie or bearer token
// -------------------------------------------------------------------------
Route::middleware('auth:sanctum')->group(function (): void {

    // Auth profile
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/auth/profile', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Escrow management
    Route::post('/orders/{order}/release-funds', [EscrowController::class, 'releaseFunds']);

    // Gamification
    Route::get('/gamification/me', [GamificationController::class, 'show']);

    // Seller-only routes
    Route::middleware('seller')->prefix('seller')->group(function (): void {
        Route::get('/gamification', [GamificationController::class, 'show']);
    });

    // Authenticated product mutations (seller creates/updates/deletes)
    Route::apiResource('products', ProductController::class)->except(['index', 'show']);

    // Orders — scoped to authenticated user in controller
    Route::apiResource('orders', OrderController::class);

    // Categories (admin management)
    Route::apiResource('categories', CategoryController::class)->except(['index', 'show']);

    // Seller profiles
    Route::apiResource('seller-profiles', SellerProfileController::class);

    // Payments
    Route::post('/payment/mobile-money', [PaymentController::class, 'processMobileMoney']);
});
