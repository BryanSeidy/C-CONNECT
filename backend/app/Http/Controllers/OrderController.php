<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * List all orders scoped to the authenticated user.
     * Buyers see their purchases; sellers see their sales.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $sellerProfileId = $user->sellerProfile?->id;

        $query = Order::with(['items.product:id,nom,region,unite,stock', 'buyer:id,fullName,companyName,email', 'seller.user:id,fullName,companyName'])
            ->when($user->isBuyer(), fn ($q) => $q->where('buyer_id', $user->id))
            ->when($user->isSeller() && $sellerProfileId, fn ($q) => $q->where('seller_id', $sellerProfileId))
            ->latest();

        return response()->json([
            'success' => true,
            'data' => $query->get(),
            'message' => 'Commandes récupérées avec succès.',
        ]);
    }

    /**
     * Create a new order for the authenticated buyer.
     * Reserves stock and computes platform commission / seller payout automatically.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'adresse_livraison' => ['nullable', 'string', 'max:500'],
            'ville_livraison' => ['nullable', 'string', 'max:100'],
            'telephone_livraison' => ['nullable', 'string', 'max:20'],
        ]);

        $product = Product::findOrFail($validated['product_id']);

        if ($product->statut !== 'active' || $product->stock_disponible < $validated['quantity']) {
            return response()->json([
                'message' => 'Produit indisponible ou stock insuffisant pour la quantité demandée.',
            ], 422);
        }

        $order = DB::transaction(function () use ($product, $validated, $request) {
            $montantTotal = (float) $product->prix * $validated['quantity'];
            $financials = Order::computeFinancials($montantTotal);

            $order = Order::create([
                'buyer_id' => $request->user()->id,
                'seller_id' => $product->seller_id,
                ...$financials,
                'escrow_status' => 'pending',
                'adresse_livraison' => $validated['adresse_livraison'] ?? null,
                'ville_livraison' => $validated['ville_livraison'] ?? null,
                'telephone_livraison' => $validated['telephone_livraison'] ?? null,
            ]);

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'seller_id' => $product->seller_id,
                'quantite' => $validated['quantity'],
                'prix_unitaire' => $product->prix,
                'sous_total' => $montantTotal,
            ]);

            $product->reserverStock($validated['quantity']);

            return $order;
        });

        return response()->json([
            'success' => true,
            'data' => $order->load(['items.product:id,nom,region,unite', 'seller.user:id,fullName,companyName']),
            'message' => 'Commande créée avec succès. En attente de paiement en séquestre.',
        ], 201);
    }

    /**
     * Show a single order — only accessible to buyer or seller of the order.
     */
    public function show(Request $request, Order $order): JsonResponse
    {
        $this->authorizeParticipant($request, $order);

        return response()->json([
            'success' => true,
            'data' => $order->load(['items.product:id,nom,region,unite', 'buyer:id,fullName,email,companyName', 'seller.user:id,fullName,companyName', 'dispute']),
            'message' => 'Commande récupérée avec succès.',
        ]);
    }

    /**
     * Update order lifecycle status — restricted to participants.
     * Releases reserved stock when an order is delivered/completed or cancelled.
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $this->authorizeParticipant($request, $order);

        $validated = $request->validate([
            'escrow_status' => [
                'required',
                'string',
                'in:pending,escrow_locked,en_preparation,expedie,en_transit,livre,complete,annule,dispute',
            ],
        ]);

        $newStatus = $validated['escrow_status'];

        match ($newStatus) {
            'escrow_locked' => $order->lockEscrow(),
            'en_preparation' => $order->markEnPreparation(),
            'expedie' => $order->markExpedie(),
            'en_transit' => $order->markEnTransit(),
            'livre' => $order->markLivre(),
            'complete' => $order->markComplete(),
            'annule' => $order->cancel(),
            'dispute' => $order->markAsDisputed(),
            default => $order->update(['escrow_status' => $newStatus]),
        };

        if (in_array($newStatus, ['livre', 'complete', 'annule'], true)) {
            foreach ($order->items as $item) {
                $item->product?->libererStock($item->quantite);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $order->fresh()->load('items.product:id,nom,region,unite'),
            'message' => 'Commande mise à jour avec succès.',
        ]);
    }

    /**
     * Cancel: only buyers can cancel orders still pending payment.
     */
    public function destroy(Request $request, Order $order): JsonResponse
    {
        if ($request->user()->id !== $order->buyer_id) {
            return response()->json(['message' => 'Seul l\'acheteur peut annuler cette commande.'], 403);
        }

        if ($order->escrow_status !== 'pending') {
            return response()->json(['message' => 'Impossible d\'annuler une commande déjà en séquestre.'], 422);
        }

        foreach ($order->items as $item) {
            $item->product?->libererStock($item->quantite);
        }

        $order->cancel();

        return response()->json(['success' => true, 'message' => 'Commande annulée.']);
    }

    private function authorizeParticipant(Request $request, Order $order): void
    {
        $user = $request->user();
        $isParticipant = $user->id === $order->buyer_id
            || ($user->sellerProfile && $user->sellerProfile->id === $order->seller_id);

        if (!$isParticipant && !$user->isAdmin()) {
            abort(403, 'Non autorisé à accéder à cette commande.');
        }
    }
}
