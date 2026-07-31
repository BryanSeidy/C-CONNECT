<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DocumentController extends Controller
{
    private const TYPES = [
        'purchase_order' => 'Bon de commande',
        'invoice' => 'Facture',
        'delivery_note' => 'Bon de livraison',
    ];

    /**
     * Génère un lien signé temporaire (10 min) vers le document — appelé en
     * requête authentifiée (Bearer) depuis le frontend, qui ouvre ensuite ce
     * lien dans un nouvel onglet. Vérifie ici que l'utilisateur est bien
     * partie prenante de la commande ; `show()` ci-dessous ne pourra plus le
     * revérifier (pas de session utilisateur sur une navigation d'onglet),
     * la signature elle-même devient l'autorisation.
     */
    public function signedLink(Request $request, Order $order, string $type): \Illuminate\Http\JsonResponse
    {
        if (!array_key_exists($type, self::TYPES)) {
            return response()->json(['message' => 'Type de document invalide.'], 404);
        }

        $user = $request->user();
        $isParticipant = $user->id === $order->buyer_id
            || ($user->sellerProfile && $user->sellerProfile->id === $order->seller_id);

        if (!$isParticipant && !$user->isAdmin()) {
            abort(403, 'Non autorisé à consulter ce document.');
        }

        $url = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'orders.documents.show',
            now()->addMinutes(10),
            ['order' => $order->id, 'type' => $type]
        );

        return response()->json(['success' => true, 'data' => ['url' => $url]]);
    }

    /**
     * Render a print-ready business document for an order.
     * Accessible via lien signé uniquement (voir signedLink() ci-dessus) —
     * pas de vérification $request->user() ici, la route est hors du groupe
     * auth:sanctum et protégée par le middleware `signed` à la place.
     */
    public function show(Request $request, Order $order, string $type): View|\Illuminate\Http\JsonResponse
    {
        if (!array_key_exists($type, self::TYPES)) {
            return response()->json(['message' => 'Type de document invalide.'], 404);
        }

        $order->load(['buyer', 'seller', 'items.product']);

        return view('documents.order-document', [
            'order' => $order,
            'documentType' => $type,
            'documentTitle' => self::TYPES[$type],
        ]);
    }
}
