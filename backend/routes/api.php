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

/*
|--------------------------------------------------------------------------
| API Routes - C-Connect Marketplace
|--------------------------------------------------------------------------
|
| Architecture RESTful avec groupes nommés pour une meilleure maintenabilité.
| Routes organisées par domaine fonctionnel et niveau d'accès.
|
*/

// =========================================================================
// ROUTES PUBLIQUES - Sans authentification
// =========================================================================
// Route::prefix('v1')->name('api.v1.')->group(function (): void {

    // --- Catalogue public ---
    Route::prefix('catalogue')->name('catalogue.')->group(function (): void {
        Route::apiResource('categories', CategoryController::class)
            ->only(['index', 'show'])
            ->names([
                'index' => 'categories.index',
                'show'  => 'categories.show',
            ]);

        Route::apiResource('products', ProductController::class)
            ->only(['index', 'show'])
            ->names([
                'index' => 'products.index',
                'show'  => 'products.show',
            ]);

        Route::apiResource('companies', CompanyController::class)
            ->only(['index', 'show'])
            ->names([
                'index' => 'companies.index',
                'show'  => 'companies.show',
            ]);
    });

    // --- Demandes de devis (RFQ) publiques ---
    Route::prefix('rfqs')->name('rfqs.')->group(function (): void {
        Route::get('/', [RfqController::class, 'index'])->name('index');
        Route::get('/{rfq}', [RfqController::class, 'show'])->name('show');
    });

    // --- Authentification ---
    Route::prefix('auth')->name('auth.')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register'])->name('register');
        Route::post('/login', [AuthController::class, 'login'])->name('login');
    });

    // --- Webhooks (callbacks externes) ---
    Route::prefix('webhooks')->name('webhooks.')->group(function (): void {
        Route::post('/payments', PaymentWebhookController::class)->name('payments');
    });

    // =========================================================================
    // ROUTES PROTÉGÉES - Authentification Sanctum requise
    // =========================================================================
    Route::middleware('auth:sanctum')->group(function (): void {

        // --- Profil utilisateur ---
        Route::prefix('auth')->name('auth.')->group(function (): void {
            Route::get('/me', [AuthController::class, 'me'])->name('me');
            Route::put('/me', [AuthController::class, 'updateProfile'])->name('update-profile');
            Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
        });

        // --- Gamification ---
        Route::prefix('gamification')->name('gamification.')->group(function (): void {
            Route::get('/me', [GamificationController::class, 'show'])->name('me');
        });

        // --- Commandes ---
        Route::prefix('orders')->name('orders.')->group(function (): void {
            Route::apiResource('/', OrderController::class)->parameters(['' => 'order'])->names([
                'index'   => 'index',
                'store'   => 'store',
                'show'    => 'show',
                'update'  => 'update',
                'destroy' => 'destroy',
            ]);

            // Escrow - Libération des fonds
            Route::post('/{order}/release-funds', [EscrowController::class, 'releaseFunds'])
                ->name('release-funds');
        });

        // --- Paiements ---
        Route::prefix('payments')->name('payments.')->group(function (): void {
            Route::post('/mobile-money', [PaymentController::class, 'processMobileMoney'])
                ->name('mobile-money');
        });

        // --- Gestion des produits (vendeurs uniquement) ---
        Route::prefix('products')->name('products.')->group(function (): void {
            Route::apiResource('/', ProductController::class)
                ->except(['index', 'show'])
                ->parameters(['' => 'product'])
                ->names([
                    'store'   => 'store',
                    'update'  => 'update',
                    'destroy' => 'destroy',
                ]);
        });

        // --- Profils vendeurs ---
        Route::prefix('seller-profiles')->name('seller-profiles.')->group(function (): void {
            Route::apiResource('/', SellerProfileController::class)
                ->parameters(['' => 'sellerProfile'])
                ->names([
                    'index'   => 'index',
                    'store'   => 'store',
                    'show'    => 'show',
                    'update'  => 'update',
                    'destroy' => 'destroy',
                ]);
        });

        // --- Gestion des catégories (admin uniquement) ---
        Route::prefix('categories')->name('categories.')->group(function (): void {
            Route::apiResource('/', CategoryController::class)
                ->except(['index', 'show'])
                ->parameters(['' => 'category'])
                ->names([
                    'store'   => 'store',
                    'update'  => 'update',
                    'destroy' => 'destroy',
                ]);
        });

        // --- Entreprises (profils B2B) ---
        Route::prefix('companies')->name('companies.')->group(function (): void {
            Route::post('/', [CompanyController::class, 'store'])->name('store');
            Route::put('/{company}', [CompanyController::class, 'update'])->name('update');
            Route::patch('/{company}/badges', [CompanyController::class, 'updateBadges'])->name('update-badges');
        });

        // --- Demandes de devis (RFQ) ---
        Route::prefix('rfqs')->name('rfqs.')->group(function (): void {
            Route::get('/mine/list', [RfqController::class, 'mine'])->name('mine');
            Route::post('/', [RfqController::class, 'store'])->name('store');
            Route::delete('/{rfq}', [RfqController::class, 'destroy'])->name('destroy');

            // Gestion des offres sur les RFQ
            Route::prefix('{rfq}/bids')->name('bids.')->group(function (): void {
                Route::post('/', [RfqController::class, 'storeBid'])->name('store');
                Route::post('/{bid}/accept', [RfqController::class, 'acceptBid'])->name('accept');
                Route::post('/{bid}/reject', [RfqController::class, 'rejectBid'])->name('reject');
            });
        });

        // --- Commandes récurrentes ---
        Route::prefix('recurring-orders')->name('recurring-orders.')->group(function (): void {
            Route::get('/', [RecurringOrderController::class, 'index'])->name('index');
            Route::post('/', [RecurringOrderController::class, 'store'])->name('store');
            Route::patch('/{recurringOrder}/status', [RecurringOrderController::class, 'updateStatus'])
                ->name('update-status');
        });

        // --- Litiges ---
        Route::prefix('disputes')->name('disputes.')->group(function (): void {
            Route::get('/', [DisputeController::class, 'index'])->name('index');
            Route::post('/', [DisputeController::class, 'store'])->name('store');
            Route::get('/{dispute}', [DisputeController::class, 'show'])->name('show');
            Route::post('/{dispute}/resolve', [DisputeController::class, 'resolve'])->name('resolve');
        });

        // --- Documents commerciaux ---
        Route::prefix('orders')->name('orders.')->group(function (): void {
            Route::get('/{order}/documents/{type}', [DocumentController::class, 'show'])
                ->name('documents.show')
                ->where('type', 'po|invoice|delivery');
        });

        // --- Routes réservées aux vendeurs ---
        Route::prefix('seller')->name('seller.')->middleware('seller')->group(function (): void {
            Route::get('/gamification', [GamificationController::class, 'show'])->name('gamification');
            // Ajouter ici d'autres endpoints vendeur
        });
    }); // Fin des routes protégées

// }); // Fin du groupe v1