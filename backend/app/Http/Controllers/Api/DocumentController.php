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
     * Render a print-ready business document for an order.
     * Accessible to the buyer, the seller, or an admin.
     */
    public function show(Request $request, Order $order, string $type): View|\Illuminate\Http\JsonResponse
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

        $order->load(['buyer', 'seller', 'items.product']);

        return view('documents.order-document', [
            'order' => $order,
            'documentType' => $type,
            'documentTitle' => self::TYPES[$type],
        ]);
    }
}
