<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Events\OrderPlaced;
use App\Models\Order;
use App\Services\OrangeMoneyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * PaymentController — Simulation Mobile Money (MTN, et Orange hors OMAPI).
 *
 * Quand Orange Money est configuré (clés consumer + X-AUTH-TOKEN), le flux
 * réel passe par PaymentWebhookController::initiate + polling /status.
 * Ce contrôleur reste pour les tests et le fallback simulation.
 */
class PaymentController extends Controller
{
    public function __construct(
        private readonly OrangeMoneyService $orangeMoney,
    ) {}

    /**
     * Simule un paiement Mobile Money MTN/Orange.
     * Refuse Orange si OMAPI est actif (éviter double confirmation).
     */
    public function processMobileMoney(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'integer', 'exists:orders,id'],
            'phone' => ['required', 'string', 'max:20'],
            'provider' => ['required', 'string', 'in:MTN,Orange'],
        ]);

        if (
            $validated['provider'] === 'Orange'
            && (bool) config('services.orange_money.enabled', true)
            && $this->orangeMoney->isConfigured()
        ) {
            return response()->json([
                'message' => 'Orange Money est configure via OMAPI. Utilisez /payments/mobile-money/initiate puis pollez /status.',
            ], 422);
        }

        $order = Order::findOrFail($validated['order_id']);

        if ($request->user()->id !== $order->buyer_id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Non autorisé à payer cette commande.'], 403);
        }

        if ($order->escrow_status !== Order::STATUS_PENDING) {
            return response()->json([
                'message' => 'Cette commande a déjà été payée ou est dans un état non payable.',
            ], 422);
        }

        $transactionRef = $order->transaction_reference
            ?: ('SIM-'.strtoupper(substr(md5(uniqid((string) mt_rand(), true)), 0, 12)));

        $order->update([
            'escrow_status' => Order::STATUS_ESCROW_LOCKED,
            'payment_provider' => strtolower($validated['provider']) === 'orange' ? 'orange_money' : 'mtn_momo',
            'payment_reference' => $transactionRef,
            'transaction_reference' => $transactionRef,
            'payment_status' => 'paid',
            'paid_at' => now(),
        ]);

        Log::info('[Payment] Simulation Mobile Money', [
            'order_id' => $order->id,
            'provider' => $validated['provider'],
            'reference' => $transactionRef,
            'amount' => $order->montant_total,
        ]);

        event(new OrderPlaced($order));

        return response()->json([
            'success' => true,
            'message' => "Transaction simulée avec succès via {$validated['provider']}",
            'data' => [
                'order' => $order->fresh()->load('items.product:id,nom,region,unite'),
            ],
        ]);
    }
}
