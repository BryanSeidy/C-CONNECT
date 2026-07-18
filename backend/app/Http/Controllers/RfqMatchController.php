<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Rfq;
use App\Services\AiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Classement IA des appels d'offres (RFQ) ouverts par pertinence pour le
 * catalogue d'un vendeur — évite qu'un fournisseur passe à côté d'une
 * opportunité pertinente noyée dans la liste brute des RFQ actives.
 *
 * Réutilise App\Services\AiClient (construit initialement pour la recherche
 * marketplace en langage naturel) plutôt que d'ajouter un nouveau client
 * HTTP Anthropic.
 *
 * Fonctionnalité IA "plus" — jamais un prérequis : la liste brute des RFQ
 * (RfqController::index, déjà utilisée par le frontend) continue de
 * fonctionner intégralement sans ceci. Si l'IA n'est pas configurée ou
 * échoue, on renvoie une liste de correspondances vide — le vendeur voit
 * simplement la liste RFQ habituelle, sans section "recommandé pour vous".
 */
class RfqMatchController extends Controller
{
    private const MAX_RFQS_CONSIDERED = 25;
    private const MAX_MATCHES_RETURNED = 5;

    public function forSeller(Request $request, AiClient $ai): JsonResponse
    {
        $user = $request->user();

        if (!$user->isSeller() || !$user->sellerProfile) {
            return response()->json(['success' => false, 'data' => ['matches' => []]]);
        }

        $products = $user->sellerProfile->products()
            ->where('statut', 'active')
            ->limit(30)
            ->get(['nom', 'category_id'])
            ->load('category:id,nom');

        if ($products->isEmpty() || !$ai->isConfigured()) {
            return response()->json(['success' => true, 'data' => ['matches' => []]]);
        }

        $rfqs = Rfq::active()
            ->latest()
            ->limit(self::MAX_RFQS_CONSIDERED)
            ->get(['id', 'titre', 'description', 'quantite', 'unite', 'category_id'])
            ->load('category:id,nom');

        if ($rfqs->isEmpty()) {
            return response()->json(['success' => true, 'data' => ['matches' => []]]);
        }

        $catalogueSummary = $products
            ->map(fn ($p) => "- {$p->nom}" . ($p->category ? " ({$p->category->nom})" : ''))
            ->unique()
            ->implode("\n");

        $rfqSummary = $rfqs
            ->map(fn ($r) => sprintf(
                "ID %d | %s | Catégorie : %s | Quantité : %s %s | %s",
                $r->id,
                $r->titre,
                $r->category->nom ?? 'non précisée',
                $r->quantite,
                $r->unite,
                str($r->description)->limit(150)
            ))
            ->implode("\n");

        $system = <<<SYS
Tu aides un fournisseur du marketplace B2B C-Connect (Cameroun) à repérer
les appels d'offres (RFQ) les plus pertinents pour ce qu'il vend.

Réponds STRICTEMENT avec ce schéma JSON :
{
  "matches": [
    {"rfq_id": <entier, doit être un des ID fournis>, "score": <1 à 5>, "reason": "<raison courte en français, une phrase>"}
  ]
}

Ne retiens QUE les RFQ dont la catégorie ou la description correspond
clairement à un des produits du catalogue du vendeur — score 1 = correspondance
faible, 5 = correspondance forte et évidente. N'inclus jamais un RFQ sans lien
réel avec le catalogue plutôt que de forcer une correspondance. Maximum 5
résultats, triés du score le plus élevé au plus faible.
SYS;

        $userMessage = "Catalogue du vendeur :\n{$catalogueSummary}\n\nAppels d'offres ouverts :\n{$rfqSummary}";

        $result = $ai->completeJson($system, $userMessage, 700);

        if ($result === null || !isset($result['matches']) || !is_array($result['matches'])) {
            return response()->json(['success' => true, 'data' => ['matches' => []]]);
        }

        $validRfqIds = $rfqs->pluck('id')->all();

        $matches = collect($result['matches'])
            ->filter(fn ($m) => is_array($m) && in_array($m['rfq_id'] ?? null, $validRfqIds, true))
            ->map(fn ($m) => [
                'rfqId' => (int) $m['rfq_id'],
                'score' => max(1, min(5, (int) ($m['score'] ?? 1))),
                'reason' => is_string($m['reason'] ?? null) ? substr($m['reason'], 0, 200) : '',
            ])
            ->sortByDesc('score')
            ->take(self::MAX_MATCHES_RETURNED)
            ->values();

        return response()->json(['success' => true, 'data' => ['matches' => $matches]]);
    }
}
