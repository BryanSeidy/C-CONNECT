<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Negotiation;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class NegotiationController extends Controller
{
    /**
     * List negotiations scoped to the authenticated user (buyer or seller).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Negotiation::with([
            'product:id,nom,prix,unite,category_id',
            'product.category:id,nom,slug',
            'buyer:id,fullName,companyName,country',
            'seller.user:id,fullName,companyName,country',
        ])
            ->when($user->isBuyer(), fn ($q) => $q->where('buyer_id', $user->id))
            ->when($user->isSeller() && $user->sellerProfile, fn ($q) => $q->where('seller_id', $user->sellerProfile->id))
            ->latest();

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    /**
     * Buyer opens a negotiation on a product (proposes a quantity + unit price).
     */
    public function store(Request $request): JsonResponse
    {
        if (!$request->user()->isBuyer()) {
            return response()->json(['message' => 'Seuls les acheteurs peuvent initier une négociation.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'proposed_price' => ['required', 'numeric', 'min:0.01'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();
        $product = Product::findOrFail($validated['product_id']);

        $negotiation = Negotiation::create([
            ...$validated,
            'buyer_id' => $request->user()->id,
            'seller_id' => $product->seller_id,
            'status' => 'PENDING',
        ]);

        return response()->json([
            'success' => true,
            'data' => $negotiation->load(['product:id,nom,prix,unite', 'buyer:id,fullName,companyName']),
            'message' => 'Négociation initiée avec succès.',
        ], 201);
    }

    /**
     * Seller accepts/declines, or either party counters, an open negotiation.
     */
    public function updateStatus(Request $request, Negotiation $negotiation): JsonResponse
    {
        $user = $request->user();
        $isBuyer = $user->id === $negotiation->buyer_id;
        $isSeller = $user->sellerProfile && $user->sellerProfile->id === $negotiation->seller_id;

        if (!$isBuyer && !$isSeller) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => ['required', 'string', 'in:ACCEPTED,DECLINED,COUNTERED'],
            'counterPrice' => ['required_if:status,COUNTERED', 'nullable', 'numeric', 'min:0.01'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();

        // Only the seller can accept/decline/counter the buyer's original
        // offer; a buyer may only accept/decline a seller's counter-offer.
        if ($validated['status'] === 'COUNTERED' && !$isSeller) {
            return response()->json(['message' => 'Seul le vendeur peut formuler une contre-proposition.'], 403);
        }

        $negotiation->update([
            'status' => $validated['status'],
            'counter_price' => $validated['counterPrice'] ?? $negotiation->counter_price,
            'message' => $validated['message'] ?? $negotiation->message,
        ]);

        return response()->json([
            'success' => true,
            'data' => $negotiation->fresh()->load(['product:id,nom,prix,unite', 'buyer:id,fullName,companyName', 'seller.user:id,fullName,companyName']),
            'message' => 'Négociation mise à jour.',
        ]);
    }
}
