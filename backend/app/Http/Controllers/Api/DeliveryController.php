<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryPartner;
use App\Models\DeliveryRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DeliveryController extends Controller
{
    /**
     * Admin : liste des livreurs sous-traitants.
     */
    public function indexPartners(): JsonResponse
    {
        $partners = DeliveryPartner::withCount('deliveryRequests')->orderBy('nom')->get();

        return response()->json(['success' => true, 'data' => $partners]);
    }

    /**
     * Admin : enregistrer un nouveau livreur sous-traitant.
     */
    public function storePartner(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => ['required', 'string', 'max:255'],
            'telephone' => ['required', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'region' => ['required', 'string', 'max:100'],
            'actif' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $partner = DeliveryPartner::create($validator->validated());

        return response()->json(['success' => true, 'data' => $partner], 201);
    }

    /**
     * Admin : activer/désactiver ou modifier un livreur.
     */
    public function updatePartner(Request $request, DeliveryPartner $deliveryPartner): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => ['sometimes', 'string', 'max:255'],
            'telephone' => ['sometimes', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'region' => ['sometimes', 'string', 'max:100'],
            'actif' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $deliveryPartner->update($validator->validated());

        return response()->json(['success' => true, 'data' => $deliveryPartner]);
    }

    /**
     * Admin : suivi des demandes de livraison en cours.
     */
    public function indexRequests(): JsonResponse
    {
        $requests = DeliveryRequest::with(['order:id,buyer_id,montant_total', 'deliveryPartner:id,nom,telephone'])
            ->latest()
            ->paginate(30);

        return response()->json(['success' => true, 'data' => $requests]);
    }

    /**
     * Lien public (signé par token, pas d'authentification requise) utilisé
     * par le livreur pour voir et répondre à une demande depuis son email —
     * les livreurs sous-traitants n'ont pas de compte sur la plateforme.
     */
    public function showByToken(string $token): JsonResponse
    {
        $deliveryRequest = DeliveryRequest::with(['order.items.product:id,nom', 'deliveryPartner'])
            ->where('token_reponse', $token)
            ->firstOrFail();

        return response()->json(['success' => true, 'data' => $deliveryRequest]);
    }

    public function respond(Request $request, string $token): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:accepter,refuser'],
        ]);

        $deliveryRequest = DeliveryRequest::where('token_reponse', $token)->firstOrFail();

        if (!in_array($deliveryRequest->statut, ['assignee', 'en_attente_assignation'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Cette demande de livraison a déjà reçu une réponse.',
            ], 422);
        }

        if ($validated['action'] === 'accepter') {
            $deliveryRequest->update(['statut' => 'acceptee', 'repondue_le' => now()]);
        } else {
            $deliveryRequest->update(['statut' => 'refusee', 'repondue_le' => now()]);

            if ($deliveryRequest->delivery_partner_id) {
                $deliveryRequest->deliveryPartner?->decrement('livraisons_en_cours');
            }
            // TODO(Backend-01/Zai) : ré-assigner automatiquement à un autre
            // livreur disponible en cas de refus — pour l'instant, l'admin
            // doit réassigner manuellement depuis le tableau de bord.
        }

        return response()->json(['success' => true, 'data' => $deliveryRequest->fresh()]);
    }
}
