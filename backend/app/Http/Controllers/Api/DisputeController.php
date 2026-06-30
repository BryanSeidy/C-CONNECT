<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dispute;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DisputeController extends Controller
{
    /**
     * List disputes scoped to the authenticated user, or all for admins.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Dispute::with(['order.buyer:id,fullName,companyName', 'order.seller.user:id,fullName,companyName', 'initiateur:id,fullName'])
            ->when(!$user->isAdmin(), fn ($q) => $q->whereHas('order', function ($oq) use ($user): void {
                $oq->where('buyer_id', $user->id)
                   ->orWhere('seller_id', $user->sellerProfile?->id);
            }))
            ->latest();

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    /**
     * File a dispute on an order — blocks escrow release until resolved.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'order_id' => ['required', 'uuid', 'exists:orders,id'],
            'raison' => ['required', 'string', 'in:marchandise_non_recue,qualite_non_conforme,quantite_incorrecte,produit_endommage,retard_livraison,autre'],
            'description' => ['required', 'string', 'max:2000'],
            'preuves_urls' => ['nullable', 'array'],
            'preuves_urls.*' => ['url'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $order = Order::findOrFail($validator->validated()['order_id']);
        $user = $request->user();

        $isParticipant = $user->id === $order->buyer_id
            || ($user->sellerProfile && $user->sellerProfile->id === $order->seller_id);

        if (!$isParticipant) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if (in_array($order->escrow_status, ['complete', 'annule'], true)) {
            return response()->json(['message' => 'Impossible d\'ouvrir un litige sur une commande déjà clôturée.'], 422);
        }

        if ($order->dispute()->exists()) {
            return response()->json(['message' => 'Un litige est déjà ouvert pour cette commande.'], 422);
        }

        $dispute = Dispute::create([
            ...$validator->validated(),
            'initiateur_id' => $user->id,
            'statut' => 'ouvert',
        ]);

        $order->markAsDisputed();

        return response()->json([
            'success' => true,
            'data' => $dispute,
            'message' => 'Litige ouvert. Les fonds restent bloqués en séquestre jusqu\'à résolution.',
        ], 201);
    }

    public function show(Request $request, Dispute $dispute): JsonResponse
    {
        $user = $request->user();
        $order = $dispute->order;
        $isParticipant = $user->id === $order->buyer_id
            || ($user->sellerProfile && $user->sellerProfile->id === $order->seller_id);

        if (!$isParticipant && !$user->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $dispute->load(['order', 'initiateur:id,fullName', 'resolvedBy:id,fullName']),
        ]);
    }

    /**
     * Resolve a dispute — administrators only.
     */
    public function resolve(Request $request, Dispute $dispute): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Résolution réservée aux administrateurs.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'decision' => ['required', 'string', 'in:rembourser,liberer,demander_informations'],
            'notes_resolution' => ['required', 'string', 'max:2000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $admin = $request->user();
        $notes = $validator->validated()['notes_resolution'];

        match ($validator->validated()['decision']) {
            'rembourser' => $dispute->resolveWithRefund($admin, $notes),
            'liberer' => $dispute->resolveWithRelease($admin, $notes),
            'demander_informations' => $dispute->update(['statut' => 'en_instruction', 'notes_resolution' => $notes]),
        };

        return response()->json([
            'success' => true,
            'data' => $dispute->fresh(),
            'message' => 'Litige traité.',
        ]);
    }
}
