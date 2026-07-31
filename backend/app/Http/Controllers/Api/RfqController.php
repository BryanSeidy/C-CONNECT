<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rfq;
use App\Models\RfqBid;
use App\Services\AiClient;
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
        $query = Rfq::with(['buyer:id,nom,prenom,company_id', 'category:id,nom,slug'])
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
        $rfqs = Rfq::with(['category:id,nom,slug', 'bids.seller.user:id,nom,prenom'])
            ->where('buyer_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['success' => true, 'data' => $rfqs]);
    }

    public function show(Rfq $rfq): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $rfq->load(['buyer:id,nom,prenom', 'category:id,nom,slug', 'bids.seller.user:id,nom,prenom']),
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
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
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
     * Comparaison assistée par IA des offres reçues sur un RFQ — aide
     * l'acheteur à trancher rapidement entre plusieurs offres (prix,
     * fournisseur vérifié, quantité, délai), sans jamais décider à sa place :
     * l'IA met en évidence les compromis, l'acheteur reste seul décisionnaire
     * (accept/reject restent des actions manuelles distinctes).
     *
     * Fonctionnalité IA "plus" — se dégrade proprement si AiClient n'est pas
     * configuré ; la comparaison manuelle (liste des offres déjà affichée)
     * reste pleinement fonctionnelle sans elle.
     */
    public function compareBids(Request $request, Rfq $rfq, AiClient $ai): JsonResponse
    {
        if ($request->user()->id !== $rfq->buyer_id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $bids = $rfq->bids()->where('statut', 'en_attente')->with('seller.user:id,nom,prenom,companyName')->get();

        if ($bids->count() < 2) {
            return response()->json([
                'success' => false,
                'message' => 'Au moins deux offres en attente sont nécessaires pour une comparaison.',
            ]);
        }

        if (!$ai->isConfigured()) {
            return response()->json([
                'success' => false,
                'message' => 'Comparaison assistée momentanément indisponible.',
            ]);
        }

        $bidsList = $bids->map(function (RfqBid $bid, int $i) {
            $sellerName = $bid->seller?->user?->companyName ?? $bid->seller?->business_name ?? 'Fournisseur ' . ($i + 1);
            $verified = ($bid->seller?->user?->isVerified ?? false) ? 'vérifié' : 'non vérifié';
            return sprintf(
                "Offre %d — %s (%s) : %s XAF/unité, %s %s disponibles, livraison proposée le %s.%s",
                $i + 1,
                $sellerName,
                $verified,
                number_format((float) $bid->prix_unitaire_propose, 0, ',', ' '),
                $bid->quantite_disponible,
                $rfq->unite,
                $bid->date_livraison_proposee?->format('d/m/Y') ?? 'non précisée',
                $bid->message ? ' Message du fournisseur : ' . $bid->message : ''
            );
        })->implode("\n");

        $system = <<<SYS
Tu es un assistant d'achat B2B pour C-Connect, un marketplace camerounais.
Un acheteur professionnel a reçu plusieurs offres pour un même besoin
d'approvisionnement et doit choisir laquelle accepter.

Rédige une comparaison courte (4 à 6 phrases, en français) qui :
- met en évidence les compromis entre les offres (prix, fiabilité du
  fournisseur, quantité, délai de livraison)
- ne recommande JAMAIS explicitement "choisissez l'offre X" — l'acheteur
  décide seul ; tu informes, tu ne décides pas
- reste strictement factuelle sur les informations fournies, n'invente rien
- ton neutre et professionnel, pas de superlatifs

Réponds uniquement avec le texte de la comparaison, sans titre, sans liste à
puces, sans markdown.
SYS;

        $user = "Besoin : {$rfq->titre} — quantité recherchée : {$rfq->quantite} {$rfq->unite}"
            . ($rfq->budget_max ? ", budget max indicatif : " . number_format((float) $rfq->budget_max, 0, ',', ' ') . " XAF/unité" : '')
            . ".\n\nOffres reçues :\n{$bidsList}";

        $comparison = $ai->complete($system, $user, 400);

        if ($comparison === null) {
            return response()->json([
                'success' => false,
                'message' => 'Comparaison assistée momentanément indisponible.',
            ]);
        }

        return response()->json(['success' => true, 'data' => ['comparison' => trim($comparison)]]);
    }
}
