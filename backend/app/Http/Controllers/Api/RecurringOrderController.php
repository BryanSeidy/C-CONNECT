<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\RecurringOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RecurringOrderController extends Controller
{
    /**
     * List recurring orders scoped to the authenticated user (buyer or seller).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = RecurringOrder::with(['product:id,nom,prix,unite,image_url', 'buyer:id,fullName,companyName', 'seller.user:id,fullName,companyName'])
            ->when($user->isBuyer(), fn ($q) => $q->where('buyer_id', $user->id))
            ->when($user->isSeller() && $user->sellerProfile, fn ($q) => $q->where('seller_id', $user->sellerProfile->id))
            ->latest();

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    /**
     * Create a recurring order schedule — buyers only.
     */
    public function store(Request $request): JsonResponse
    {
        if (!$request->user()->isBuyer()) {
            return response()->json(['message' => 'Seuls les acheteurs peuvent planifier des commandes récurrentes.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'quantite' => ['required', 'numeric', 'min:0.01'],
            'frequence' => ['required', 'string', 'in:hebdomadaire,bimensuelle,mensuelle'],
            'jour_semaine' => ['nullable', 'integer', 'min:0', 'max:6'],
            'jour_mois' => ['nullable', 'integer', 'min:1', 'max:28'],
            'date_fin' => ['nullable', 'date', 'after:today'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $product = Product::findOrFail($validator->validated()['product_id']);

        $recurringOrder = RecurringOrder::create([
            ...$validator->validated(),
            'buyer_id' => $request->user()->id,
            'seller_id' => $product->seller_id,
            'unite' => $product->unite ?? 'kg',
            'prochaine_livraison' => now()->addWeek()->toDateString(),
            'statut' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'data' => $recurringOrder->load('product:id,nom,prix,unite'),
            'message' => 'Commande récurrente planifiée avec succès.',
        ], 201);
    }

    /**
     * Pause, resume or cancel a recurring order.
     */
    public function updateStatus(Request $request, RecurringOrder $recurringOrder): JsonResponse
    {
        $user = $request->user();
        $isOwner = $user->id === $recurringOrder->buyer_id
            || ($user->sellerProfile && $user->sellerProfile->id === $recurringOrder->seller_id);

        if (!$isOwner) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'statut' => ['required', 'string', 'in:active,en_pause,annulee'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $recurringOrder->update($validator->validated());

        return response()->json([
            'success' => true,
            'data' => $recurringOrder->fresh(),
            'message' => 'Planification mise à jour.',
        ]);
    }
}
