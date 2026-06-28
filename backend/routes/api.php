<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EscrowController;
use App\Http\Controllers\Api\GamificationController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\SellerProfileController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;

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


        // Route::prefix('auth')->group(function () {
        //     Route::post('/register', [AuthController::class, 'register']);
        //     Route::post('/login', [AuthController::class, 'login']);
    });

    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('orders', OrderController::class);
    Route::apiResource('seller-profiles', SellerProfileController::class);

    Route::post('/payment/mobile-money', [\App\Http\Controllers\PaymentController::class, 'processMobileMoney']);

    // Route::middleware('auth:sanctum')->group(function () {
    //     Route::get('/user', function (Request $request) {
    //         return $request->user();
    //     });
    //     Route::post('/logout', function (Request $request) {
    //         $request->user()->currentAccessToken()->delete();
    //         return response()->json(['message' => 'Logged out successfully']);
    //     });
});
