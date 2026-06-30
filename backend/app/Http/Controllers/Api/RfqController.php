<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rfq;
use App\Models\RfqBid;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RfqController extends Controller
{
    /**
     * Public feed of active RFQs — suppliers browse to find buyers.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Rfq::with(['buyer:id,fullName,companyName,company_id', 'category:id,nom,slug'])
            ->active()
            ->when($request->filled('region'), fn ($q) => $q->byRegion($request->input('region')))
            ->when($request->filled('category'), fn ($q) => $q->where('category_id', $request->input('category')))
            ->latest()
            ->paginate(min((int) $request->input('pageSize', 12), 50));

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $query->items(),
                'meta' => [
                    'total' => $query->total(),
                    'page' => $query->currentPage(),
                    'pageSize' => $query->perPage(),
                    'totalPages' => $query->lastPage(),
                ],
            ],
        ]);
    }

    /**
     * Buyer's own RFQs (any status), including bid counts.
     */
    public function mine(Request $request): JsonResponse
    {
        $rfqs = Rfq::with(['category:id,nom,slug', 'bids.seller.user:id,fullName,companyName'])
            ->where('buyer_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['success' => true, 'data' => $rfqs]);
    }

    public function show(Rfq $rfq): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $rfq->load(['buyer:id,fullName,companyName', 'category:id,nom,slug', 'bids.seller.user:id,fullName,companyName']),
        ]);
    }

    /**
     * Create an RFQ — buyers only.
     */
    public function store(Request $request): JsonResponse
    {
        if (!$request->user()->isBuyer()) {
            return response()->json(['message' => 'Seuls les acheteurs peuvent publier une demande de devis.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'titre' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:2000'],
            'category_id' => ['nullable', 'uuid', 'exists:categories,id'],
            'quantite' => ['required', 'numeric', 'min:0.01'],
            'unite' => ['required', 'string', 'in:kg,tonnes,sacs,caisses,litres,unites'],
            'budget_max' => ['nullable', 'numeric', 'min:0'],
            'region_livraison' => ['nullable', 'string', 'max:100'],
            'ville_livraison' => ['nullable', 'string', 'max:100'],
            'delai_livraison' => ['nullable', 'date', 'after_or_equal:today'],
            'expire_le' => ['nullable', 'date', 'after:today'],
            'vendeur_verifie_requis' => ['boolean'],
            'cooperative_uniquement' => ['boolean'],
            'femmes_entrepreneures_prefere' => ['boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $rfq = Rfq::create([
            ...$validator->validated(),
            'buyer_id' => $request->user()->id,
            'statut' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'data' => $rfq,
            'message' => 'Demande de devis publiée avec succès.',
        ], 201);
    }

    /**
     * Cancel an RFQ — buyer only.
     */
    public function destroy(Request $request, Rfq $rfq): JsonResponse
    {
        if ($request->user()->id !== $rfq->buyer_id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $rfq->update(['statut' => 'annulee']);

        return response()->json(['success' => true, 'message' => 'Demande annulée.']);
    }

    /**
     * Submit a bid on an RFQ — sellers only, one bid per RFQ.
     */
    public function storeBid(Request $request, Rfq $rfq): JsonResponse
    {
        $user = $request->user();
        $sellerProfile = $user->sellerProfile;

        if (!$user->isSeller() || !$sellerProfile) {
            return response()->json(['message' => 'Seuls les fournisseurs disposant d\'un profil peuvent proposer une offre.'], 403);
        }

        if ($rfq->statut !== 'active') {
            return response()->json(['message' => 'Cette demande de devis n\'accepte plus d\'offres.'], 422);
        }

        if ($rfq->isExpired()) {
            return response()->json(['message' => 'Cette demande de devis a expiré.'], 422);
        }

        $existing = RfqBid::where('rfq_id', $rfq->id)->where('seller_id', $sellerProfile->id)->first();
        if ($existing) {
            return response()->json(['message' => 'Vous avez déjà soumis une offre pour cette demande.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'prix_unitaire_propose' => ['required', 'numeric', 'min:1'],
            'quantite_disponible' => ['required', 'numeric', 'min:0.01'],
            'date_livraison_proposee' => ['nullable', 'date', 'after_or_equal:today'],
            'message' => ['nullable', 'string', 'max:1000'],
            'conditions' => ['nullable', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $bid = RfqBid::create([
            ...$validator->validated(),
            'rfq_id' => $rfq->id,
            'seller_id' => $sellerProfile->id,
            'statut' => 'en_attente',
        ]);

        $rfq->incrementNombreOffres();

        return response()->json([
            'success' => true,
            'data' => $bid,
            'message' => 'Offre soumise avec succès.',
        ], 201);
    }

    /**
     * Accept a bid — buyer only. Declines all other pending bids.
     */
    public function acceptBid(Request $request, Rfq $rfq, RfqBid $bid): JsonResponse
    {
        if ($request->user()->id !== $rfq->buyer_id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if ($bid->rfq_id !== $rfq->id) {
            return response()->json(['message' => 'Offre invalide pour cette demande.'], 422);
        }

        $bid->accept();

        return response()->json([
            'success' => true,
            'data' => $bid->fresh(),
            'message' => 'Offre acceptée. Vous pouvez maintenant finaliser la commande.',
        ]);
    }

    /**
     * Reject a bid — buyer only.
     */
    public function rejectBid(Request $request, Rfq $rfq, RfqBid $bid): JsonResponse
    {
        if ($request->user()->id !== $rfq->buyer_id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $bid->reject();

        return response()->json(['success' => true, 'data' => $bid->fresh(), 'message' => 'Offre refusée.']);
    }
}
