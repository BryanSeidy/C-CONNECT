<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\DisputeController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\EscrowController;
use App\Http\Controllers\Api\GamificationController;
use App\Http\Controllers\Api\NegotiationController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Api\RecurringOrderController;
use App\Http\Controllers\Api\RfqController;
use App\Http\Controllers\Api\SocialAuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AssistantController;
use App\Http\Controllers\Api\DeliveryController;
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

    // Recherche marketplace en langage naturel (IA) — publique, comme le
    // reste du catalogue. Se dégrade proprement si l'IA n'est pas configurée.
    // Throttle : chaque appel coûte un appel API IA réel, endpoint public.
    Route::post('search/smart', [\App\Http\Controllers\SmartSearchController::class, 'parse'])
        ->middleware('throttle:20,1')
        ->name('search.smart');

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
    // Contrainte numérique impérative : sans elle, cette route générique
    // intercepterait /rfqs/matches/for-seller (route authentifiée définie
    // plus bas) en essayant de résoudre un Rfq #"matches".
    Route::get('/{rfq}', [RfqController::class, 'show'])->where('rfq', '[0-9]+')->name('show');
});

// --- Authentification ---
Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware('signed')
    ->name('verification.verify');

Route::prefix('auth')->name('auth.')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register'])
        ->middleware('throttle:6,1')
        ->name('register');
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:6,1')
        ->name('login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
        ->middleware('throttle:6,1')
        ->name('password.email');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])
        ->middleware('throttle:6,1')
        ->name('password.update');
    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware('signed')
        ->name('verification.verify');

    // OAuth Social — hors middleware auth, callback depuis le provider
    Route::get('/social/{provider}/redirect', [SocialAuthController::class, 'redirect'])->name('social.redirect');
    Route::get('/social/{provider}/callback', [SocialAuthController::class, 'callback'])->name('social.callback');
});

// --- Webhooks (callbacks externes) ---
Route::prefix('webhooks')->name('webhooks.')->group(function (): void {
    Route::post('/payments', PaymentWebhookController::class)->name('payments');
    // Callback notifUrl OMAPI Orange Money (sans signature HMAC C-Connect)
    Route::post('/payments/orange', [PaymentWebhookController::class, 'orangeNotify'])
        ->name('payments.orange');
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
        Route::post('/email/verification-notification', [AuthController::class, 'resendVerificationEmail'])
            ->middleware('throttle:6,1')
            ->name('verification.send');
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
        // Simulation MTN (et Orange si cles OMAPI absentes)
        Route::post('/mobile-money', [PaymentController::class, 'processMobileMoney'])
            ->name('mobile-money');
        Route::post('/mobile-money/initiate', [PaymentWebhookController::class, 'initiate'])
            ->name('mobile-money.initiate');
        Route::get('/mobile-money/status', [PaymentWebhookController::class, 'status'])
            ->name('mobile-money.status');
    });

    // --- Gestion des produits (vendeurs uniquement) ---
    Route::prefix('products')->name('products.')->group(function (): void {
        Route::get('/me', [ProductController::class, 'myProducts'])->name('my-products');
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
        Route::post('/verify-rccm', [CompanyController::class, 'verifyRccm'])->name('verify-rccm');
    });

    // --- Demandes de devis (RFQ) ---
    Route::prefix('rfqs')->name('rfqs.')->group(function (): void {
        Route::get('/mine/list', [RfqController::class, 'mine'])->name('mine');
        Route::get('/matches/for-seller', [\App\Http\Controllers\RfqMatchController::class, 'forSeller'])
            ->middleware('throttle:15,1')
            ->name('matches.for-seller');
        Route::post('/', [RfqController::class, 'store'])->name('store');
        Route::delete('/{rfq}', [RfqController::class, 'destroy'])->name('destroy');

        // Gestion des offres sur les RFQ
        Route::prefix('{rfq}/bids')->name('bids.')->group(function (): void {
            Route::post('/', [RfqController::class, 'storeBid'])->name('store');
            Route::post('/{bid}/accept', [RfqController::class, 'acceptBid'])->name('accept');
            Route::post('/{bid}/reject', [RfqController::class, 'rejectBid'])->name('reject');
            Route::post('/compare', [RfqController::class, 'compareBids'])
                ->middleware('throttle:15,1')
                ->name('compare');
        });
    });

    // --- Négociations B2B (offre/contre-offre sur un produit) ---
    Route::prefix('negotiations')->name('negotiations.')->group(function (): void {
        Route::get('/', [NegotiationController::class, 'index'])->name('index');
        Route::post('/', [NegotiationController::class, 'store'])->name('store');
        Route::patch('/{negotiation}', [NegotiationController::class, 'updateStatus'])->name('update-status');
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
    // La génération du lien signé reste protégée par Bearer token (vérifie
    // que l'utilisateur est bien partie prenante de la commande) ; la
    // consultation du document elle-même est déplacée hors de ce groupe car
    // une simple navigation <a href target="_blank"> ne transmet jamais le
    // header Authorization — voir la route `signed-link` + le middleware
    // `signed` plus bas dans ce fichier.
    Route::prefix('orders')->name('orders.')->group(function (): void {
        Route::get('/{order}/documents/{type}/signed-link', [DocumentController::class, 'signedLink'])
            ->name('documents.signed-link')
            ->where('type', 'purchase_order|invoice|delivery_note');
    });

    // --- Routes réservées aux vendeurs ---
    Route::prefix('seller')->name('seller.')->middleware('seller')->group(function (): void {
        Route::get('/gamification', [GamificationController::class, 'show'])->name('gamification');
    });

    // --- Assistant IA (chat contextuel + amélioration de texte) ---
    // Throttle dédié : appels payants côté Anthropic, à maîtriser indépendamment
    // du throttle générique des autres routes.
    Route::prefix('assistant')->name('assistant.')->middleware('throttle:20,1')->group(function (): void {
        Route::post('/chat', [AssistantController::class, 'chat'])->name('chat');
        Route::post('/improve-text', [AssistantController::class, 'improveText'])->name('improve-text');
    });

    // --- Routes réservées aux administrateurs ---
    Route::prefix('admin')->name('admin.')->middleware('admin')->group(function (): void {
        Route::get('/stats', [AdminController::class, 'stats'])->name('stats');
        Route::get('/users', [AdminController::class, 'users'])->name('users');
        Route::get('/disputes', [AdminController::class, 'disputes'])->name('disputes');
        Route::get('/companies', [AdminController::class, 'companies'])->name('companies');
        Route::get('/health', [AdminController::class, 'health'])->name('health');

        // --- Livreurs sous-traitants (dispatch de livraison) ---
        Route::get('/delivery-partners', [DeliveryController::class, 'indexPartners'])->name('delivery-partners.index');
        Route::post('/delivery-partners', [DeliveryController::class, 'storePartner'])->name('delivery-partners.store');
        Route::patch('/delivery-partners/{deliveryPartner}', [DeliveryController::class, 'updatePartner'])->name('delivery-partners.update');
        Route::get('/delivery-requests', [DeliveryController::class, 'indexRequests'])->name('delivery-requests.index');
    });

}); // Fin des routes protégées

// --- Réponse livreur (public, lien signé par token — pas de compte livreur) ---
Route::prefix('livraison')->name('delivery.')->group(function (): void {
    Route::get('/reponse/{token}', [DeliveryController::class, 'showByToken'])->name('show');
    Route::post('/reponse/{token}', [DeliveryController::class, 'respond'])->name('respond');
});

// --- Consultation de document commercial via lien signé temporaire ---
// Hors du groupe auth:sanctum : ouvert depuis un nouvel onglet du navigateur
// (target="_blank"), qui ne transmet jamais le header Authorization d'un
// token Bearer. L'autorisation est ici la signature elle-même (générée
// uniquement pour un participant réel de la commande, expire après 10 min)
// plutôt qu'une session utilisateur.
Route::get('/orders/{order}/documents/{type}', [DocumentController::class, 'show'])
    ->name('orders.documents.show')
    ->middleware('signed')
    ->where('type', 'purchase_order|invoice|delivery_note');

// }); // Fin du groupe v1