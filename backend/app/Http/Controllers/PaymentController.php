<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Events\OrderPlaced;
use App\Models\Order;
use App\Services\DeliveryDispatchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * PaymentController — Simulation de paiement Mobile Money.
 *
 * En production, le vrai flux est :
 *   1. POST /api/payments/mobile-money/initiate → PaymentWebhookController::initiate
 *   2. Le provider appelle POST /api/webhooks/payments → PaymentWebhookController::__invoke
 *
 * Ce contrôleur est conservé pour les tests et la simulation front-end.
 */
class PaymentController extends Controller
{
    public function __construct(private readonly DeliveryDispatchService $deliveryDispatch) {}

    /**
     * Simule un paiement Mobile Money MTN/Orange.
     * Vérifie la propriété de la commande, simule le verrouillage de l'escrow.
     */
    public function processMobileMoney(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'integer', 'exists:orders,id'],
            'phone' => ['required', 'string', 'max:20'],
            'provider' => ['required', 'string', 'in:MTN,Orange'],
        ]);

        $order = Order::findOrFail($validated['order_id']);

        // Vérifier que l'acheteur est bien le propriétaire
        if ($request->user()->id !== $order->buyer_id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Non autorisé à payer cette commande.'], 403);
        }

        if ($order->escrow_status !== Order::STATUS_PENDING) {
            return response()->json([
                'message' => 'Cette commande a déjà été payée ou est dans un état non payable.',
            ], 422);
        }

        // Simuler un paiement réussi
        $transactionRef = 'SIM-' . strtoupper(substr(md5(uniqid((string) mt_rand(), true)), 0, 12));

        $order->update([
            'escrow_status' => Order::STATUS_ESCROW_LOCKED,
            'payment_provider' => strtolower($validated['provider']),
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

        // L'acheteur a validé sa commande (paiement confirmé) et choisi la
        // livraison à domicile → on contacte automatiquement un livreur
        // sous-traitant disponible. Ne bloque jamais la confirmation du
        // paiement en cas d'échec (log seulement) — le client a déjà payé,
        // un souci de dispatch ne doit pas se traduire par une erreur pour lui.
        if ($order->livraison_demandee) {
            try {
                $this->deliveryDispatch->dispatch($order, (float) $order->frais_livraison);
            } catch (\Throwable $e) {
                Log::error('[Payment] Échec du dispatch livraison automatique', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Transaction simulée avec succès via {$validated['provider']}",
            'data' => [
                'order' => $order->fresh()->load('items.product:id,nom,region,unite'),
            ],
        ]);
    }
}
