<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\DisputeController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\EscrowController;
use App\Http\Controllers\Api\GamificationController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Api\RecurringOrderController;
use App\Http\Controllers\Api\RfqController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SellerProfileController;
use Illuminate\Support\Facades\Route;

// --- Routes publiques (lecture seule) ---
Route::apiResource('categories', CategoryController::class)->only(['index', 'show']);
Route::apiResource('products', ProductController::class)->only(['index', 'show']);
Route::apiResource('companies', CompanyController::class)->only(['index', 'show']);
Route::get('/rfqs', [RfqController::class, 'index']);
Route::get('/rfqs/{rfq}', [RfqController::class, 'show']);

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

    // Entreprises (profils B2B)
    Route::post('/companies', [CompanyController::class, 'store']);
    Route::put('/companies/{company}', [CompanyController::class, 'update']);
    Route::patch('/companies/{company}/badges', [CompanyController::class, 'updateBadges']);

    // RFQ — Demandes de devis
    Route::get('/rfqs/mine/list', [RfqController::class, 'mine']);
    Route::post('/rfqs', [RfqController::class, 'store']);
    Route::delete('/rfqs/{rfq}', [RfqController::class, 'destroy']);
    Route::post('/rfqs/{rfq}/bids', [RfqController::class, 'storeBid']);
    Route::post('/rfqs/{rfq}/bids/{bid}/accept', [RfqController::class, 'acceptBid']);
    Route::post('/rfqs/{rfq}/bids/{bid}/reject', [RfqController::class, 'rejectBid']);

    // Commandes récurrentes
    Route::get('/recurring-orders', [RecurringOrderController::class, 'index']);
    Route::post('/recurring-orders', [RecurringOrderController::class, 'store']);
    Route::patch('/recurring-orders/{recurringOrder}/status', [RecurringOrderController::class, 'updateStatus']);

    // Litiges
    Route::get('/disputes', [DisputeController::class, 'index']);
    Route::post('/disputes', [DisputeController::class, 'store']);
    Route::get('/disputes/{dispute}', [DisputeController::class, 'show']);
    Route::post('/disputes/{dispute}/resolve', [DisputeController::class, 'resolve']);

    // Documents commerciaux (PO, Facture, Bon de livraison)
    Route::get('/orders/{order}/documents/{type}', [DocumentController::class, 'show']);

    // Routes réservées aux vendeurs
    Route::middleware('seller')->prefix('seller')->group(function (): void {
        Route::get('/gamification', [GamificationController::class, 'show']);
        // Ajoutez ici d'autres endpoints spécifiques vendeur
    });
});
