<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\AiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Recherche marketplace en langage naturel : "je cherche du manioc frais
 * pas cher autour de Douala en grande quantité" -> filtres structurés
 * (catégorie, région, tri) appliqués automatiquement côté frontend.
 *
 * Fonctionnalité IA "plus" — jamais un prérequis pour chercher des produits
 * (la recherche/filtrage classique de ProductController::index continue de
 * fonctionner intégralement sans elle). Si AiClient n'est pas configuré ou
 * échoue, on répond success:false avec un message clair ; le frontend
 * retombe sur une recherche texte classique avec la requête brute.
 */
class SmartSearchController extends Controller
{
    /** Catégories réellement proposées au filtre marketplace (voir frontend CATEGORIES). */
    private const CATEGORIES = ['Agroalimentaire', 'Transformation', 'Élevage', 'Pêche', 'Textile', 'Industrie'];

    /** Régions administratives du Cameroun, codes utilisés par le frontend (lib/regions.ts). */
    private const REGIONS = [
        'AD' => 'Adamaoua', 'CE' => 'Centre', 'ES' => 'Est', 'EN' => 'Extrême-Nord',
        'LT' => 'Littoral', 'NO' => 'Nord', 'NW' => 'Nord-Ouest', 'OU' => 'Ouest',
        'SU' => 'Sud', 'SW' => 'Sud-Ouest',
    ];

    public function parse(Request $request, AiClient $ai): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['required', 'string', 'min:3', 'max:300'],
        ]);

        if (!$ai->isConfigured()) {
            return response()->json([
                'success' => false,
                'message' => 'Recherche intelligente momentanément indisponible.',
            ]);
        }

        $categoriesList = implode(', ', self::CATEGORIES);
        $regionsList = collect(self::REGIONS)->map(fn ($label, $code) => "$code ($label)")->implode(', ');

        $system = <<<SYS
Tu es l'assistant de recherche du marketplace B2B C-Connect au Cameroun.
Un acheteur professionnel décrit ce qu'il cherche en langage naturel. Tu dois
extraire des filtres structurés à partir de sa phrase, en respectant
STRICTEMENT ce schéma JSON :

{
  "category": une valeur parmi [$categoriesList] ou null si aucune ne correspond clairement,
  "region": un code parmi [$regionsList] ou null si aucune région n'est mentionnée,
  "sort": "price_asc" si l'acheteur cherche le moins cher, "price_desc" si le plus cher/premium, sinon null,
  "keywords": les mots-clés produit résiduels utiles pour une recherche texte (nom du produit, variété), ou null,
  "summary": une reformulation courte et naturelle en français de ce que tu as compris, pour confirmer à l'utilisateur (une phrase, pas de guillemets)
}

Ne devine jamais une catégorie ou une région qui ne serait pas clairement
sous-entendue par la phrase — mets null plutôt que de forcer une correspondance.
SYS;

        $result = $ai->completeJson($system, $validated['query']);

        if ($result === null) {
            return response()->json([
                'success' => false,
                'message' => 'Recherche intelligente momentanément indisponible.',
            ]);
        }

        // Ne jamais faire confiance aveuglément à la sortie du modèle : on
        // ne retient une catégorie/région que si elle appartient bien à
        // l'ensemble fermé connu du catalogue.
        $category = in_array($result['category'] ?? null, self::CATEGORIES, true) ? $result['category'] : null;
        $region = array_key_exists($result['region'] ?? null, self::REGIONS) ? $result['region'] : null;
        $sort = in_array($result['sort'] ?? null, ['price_asc', 'price_desc'], true) ? $result['sort'] : null;

        return response()->json([
            'success' => true,
            'data' => [
                'category' => $category,
                'region' => $region,
                'sort' => $sort,
                'keywords' => is_string($result['keywords'] ?? null) ? substr($result['keywords'], 0, 100) : null,
                'summary' => is_string($result['summary'] ?? null) ? substr($result['summary'], 0, 200) : null,
            ],
        ]);
    }
}
