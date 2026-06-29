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

// --- Routes publiques (lecture seule) ---
Route::apiResource('categories', CategoryController::class)->only(['index', 'show']);
Route::apiResource('products', ProductController::class)->only(['index', 'show']);

// --- Authentification publique ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// --- Webhooks (publics) ---
Route::post('/webhooks/payments', PaymentWebhookController::class);

// --- Routes protégées ---
Route::middleware('auth:sanctum')->group(function (): void {
    // Profil utilisateur
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Escrow
    Route::post('/orders/{order}/release-funds', [EscrowController::class, 'releaseFunds']);

    // Gamification
    Route::get('/gamification/me', [GamificationController::class, 'show']);

    // Commandes
    Route::apiResource('orders', OrderController::class);

    // Paiements
    Route::post('/payment/mobile-money', [PaymentController::class, 'processMobileMoney']);

    // Gestion des produits par les vendeurs
    Route::apiResource('products', ProductController::class)->except(['index', 'show']);

    // Profils vendeurs
    Route::apiResource('seller-profiles', SellerProfileController::class);

    // Gestion des catégories (admin)
    Route::apiResource('categories', CategoryController::class)->except(['index', 'show']);

    // Routes réservées aux vendeurs
    Route::middleware('seller')->prefix('seller')->group(function (): void {
        Route::get('/gamification', [GamificationController::class, 'show']);
        // Ajoutez ici d'autres endpoints spécifiques vendeur
    });
});
