<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Assistant IA C-Connect.
 *
 * Deux usages :
 *  - Chat contextuel (widget flottant du dashboard) : POST /assistant/chat
 *  - Amélioration de texte (description produit/RFQ) : POST /assistant/improve-text
 *
 * Le rôle et la page courante de l'utilisateur sont envoyés par le frontend
 * pour contextualiser les réponses (un acheteur et un vendeur n'ont pas les
 * mêmes questions typiques).
 *
 * Appels Anthropic délégués à App\Services\AiClient (partagé avec
 * SmartSearchController) — voir AiClient pour la dégradation gracieuse sans
 * clé configurée.
 */
class AssistantController extends Controller
{
    private const MAX_HISTORY_MESSAGES = 12;
    private const MAX_MESSAGE_LENGTH = 2000;

    public function __construct(private readonly AiClient $ai) {}

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:' . self::MAX_MESSAGE_LENGTH],
            'context' => ['sometimes', 'nullable', 'string', 'max:200'],
            'history' => ['sometimes', 'array', 'max:' . self::MAX_HISTORY_MESSAGES],
            'history.*.role' => ['required_with:history', 'string', 'in:user,assistant'],
            'history.*.content' => ['required_with:history', 'string', 'max:' . self::MAX_MESSAGE_LENGTH],
        ]);

        $user = $request->user();
        $systemPrompt = $this->buildSystemPrompt($user?->role, $validated['context'] ?? null);

        $messages = array_map(
            static fn (array $m) => ['role' => $m['role'], 'content' => $m['content']],
            $validated['history'] ?? []
        );
        $messages[] = ['role' => 'user', 'content' => $validated['message']];

        $reply = $this->ai->completeConversation($systemPrompt, $messages, 600)
            ?? $this->unavailableMessage();

        return response()->json(['data' => ['reply' => $reply]]);
    }

    /**
     * Réécrit/améliore un texte court (description produit, besoin RFQ...)
     * à partir de quelques mots-clés ou d'un brouillon — pensé pour des
     * utilisateurs peu à l'aise à l'écrit, conformément au public cible du
     * produit (littératie numérique limitée, cf. HUMAN_CENTERED_UX.md).
     */
    public function improveText(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => ['required', 'string', 'max:' . self::MAX_MESSAGE_LENGTH],
            'kind' => ['required', 'string', 'in:product_description,rfq_requirements'],
        ]);

        $instructions = match ($validated['kind']) {
            'product_description' => "Tu es un rédacteur commercial expert pour une marketplace B2B camerounaise. "
                . "Réécris la description produit suivante pour qu'elle soit professionnelle, claire et vendeuse, "
                . "en 2 à 4 phrases courtes. Garde toutes les informations factuelles (quantités, qualité, origine) "
                . "données par le vendeur — n'invente aucun fait, aucun chiffre, aucune certification. "
                . "Réponds uniquement avec le texte amélioré, sans commentaire ni guillemets.",
            'rfq_requirements' => "Tu es un assistant d'achat B2B expert. Réécris ce besoin d'approvisionnement "
                . "pour qu'il soit précis et complet pour des fournisseurs (quantité, qualité attendue, délai si "
                . "mentionné). Garde toutes les informations factuelles données — n'invente rien. Réponds "
                . "uniquement avec le texte amélioré, sans commentaire ni guillemets.",
        };

        $improved = $this->ai->complete($instructions, $validated['text'], 300)
            ?? $validated['text'];

        return response()->json(['data' => ['improved' => trim($improved)]]);
    }

    private function unavailableMessage(): string
    {
        return $this->ai->isConfigured()
            ? "Désolé, l'assistant IA rencontre un problème temporaire. Réessayez dans un instant."
            : "L'assistant IA n'est pas encore configuré sur cet environnement "
                . "(clé ANTHROPIC_API_KEY manquante côté serveur). Contactez l'équipe technique.";
    }

    private function buildSystemPrompt(?string $role, ?string $context): string
    {
        $roleContext = match ($role) {
            'seller' => "L'utilisateur est un VENDEUR (producteur, coopérative, fabricant, PME) sur C-Connect.",
            'buyer' => "L'utilisateur est un ACHETEUR B2B (restaurant, hôtel, supermarché, grossiste...) sur C-Connect.",
            'admin' => "L'utilisateur est un ADMINISTRATEUR de la plateforme C-Connect.",
            default => "L'utilisateur découvre C-Connect.",
        };

        $pageContext = $context ? "Page actuelle : {$context}." : '';

        $registrationGuideContext = '';
        if ($context && str_contains($context, 'registration-guide')) {
            $registrationGuideContext = <<<GUIDE

L'utilisateur est actuellement sur le guide d'immatriculation RCCM. Les étapes qu'il voit sont :
1. Rassembler les pièces (CNI, plan de localisation, 2 photos d'identité, justificatif d'occupation du local).
2. Retirer et remplir le formulaire de déclaration (greffe du Tribunal de Première Instance ou GUCE).
3. Déposer le dossier au greffe ou au GUCE (le Guichet Unique permet en principe d'obtenir RCCM + NIU + CNPS en une seule démarche).
4. Régler les frais d'immatriculation (variable selon entreprise individuelle vs société).
5. Récupérer le numéro RCCM et le renseigner dans le profil C-Connect au format RC/VILLE/ANNÉE/TYPE/NUMÉRO.

Aide-le à comprendre ces étapes concrètement, mais rappelle que C-Connect ne peut pas effectuer la
démarche à sa place — c'est une procédure officielle auprès du greffe/GUCE.
GUIDE;
        }

        return <<<PROMPT
Tu es l'Assistant C-Connect, l'assistant intégré de C-Connect — une plateforme B2B de sourcing et
d'approvisionnement professionnel qui connecte producteurs, coopératives et fabricants camerounais avec
des restaurants, hôtels, supermarchés et autres acheteurs professionnels.

Fonctionnalités clés de la plateforme que tu peux expliquer : profils entreprise vérifiés (RCCM/NIU),
paiement en séquestre (l'argent n'est libéré au vendeur qu'après confirmation de réception par l'acheteur),
appels d'offres (RFQ), négociation de prix, commandes récurrentes, gestion de litiges, Mobile Money
(Orange Money / MTN MoMo), livraison à domicile via des livreurs sous-traitants.

{$roleContext} {$pageContext}
{$registrationGuideContext}

Règles :
- Réponds en français, de façon concise (3-5 phrases maximum sauf si on te demande plus de détails).
- Sois concret et pratique — évite le jargon technique inutile, le public cible a une littératie
  numérique parfois limitée.
- Si la question ne concerne pas C-Connect ou le commerce B2B, recentre poliment la conversation.
- Ne donne jamais de conseil financier, juridique ou fiscal définitif — oriente vers un professionnel
  pour ces sujets.
- N'invente jamais de fonctionnalité qui n'existe pas sur la plateforme.
PROMPT;
    }

}
