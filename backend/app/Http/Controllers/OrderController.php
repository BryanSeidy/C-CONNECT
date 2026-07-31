<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Frais de livraison fixe appliqué quand l'acheteur choisit la livraison
     * à domicile. Calculé côté serveur uniquement — jamais accepté depuis le
     * frontend, pour éviter qu'un montant soit falsifié côté client.
     * TODO(Backend-01/Zai) : faire varier ce montant par région/distance une
     * fois qu'un vrai barème logistique existe ; valeur plate pour l'instant.
     */
    private const FRAIS_LIVRAISON_FIXE = 1500.00;

    /**
     * List all orders scoped to the authenticated user.
     * Buyers see their purchases; sellers see their sales.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $sellerProfileId = $user->sellerProfile?->id;

        $query = Order::with(['items.product:id,nom,region,unite,stock', 'buyer:id,nom,prenom,email', 'seller.user:id,nom,prenom'])
            ->when($user->isBuyer(), fn ($q) => $q->where('buyer_id', $user->id))
            ->when($user->isSeller() && $sellerProfileId, fn ($q) => $q->where('seller_id', $sellerProfileId))
            ->latest();

        return response()->json([
            'success' => true,
            'data' => $query->get(),
            'message' => 'Commandes récupérées avec succès.',
        ]);
    }

    /**
     * Create a new order for the authenticated buyer.
     * Reserves stock atomically and computes platform commission / seller payout.
     */
    public function store(Request $request): JsonResponse
    {
        // Deux formes acceptées : l'historique mono-produit (product_id +
        // quantity, éventuellement negotiation_id), ou un panier multi-
        // articles (items[]) — utilisé par le panier frontend. Les deux
        // aboutissent à la même logique de création ci-dessous.
        $isCart = $request->has('items');

        $validated = $isCart
            ? $request->validate([
                'items' => ['required', 'array', 'min:1', 'max:50'],
                'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
                'items.*.quantity' => ['required', 'integer', 'min:1'],
                'items.*.negotiation_id' => ['nullable', 'integer', 'exists:negotiations,id'],
                'adresse_livraison' => ['nullable', 'string', 'max:500'],
                'ville_livraison' => ['nullable', 'string', 'max:100'],
                'telephone_livraison' => ['nullable', 'string', 'max:20'],
                'notes_livraison' => ['nullable', 'string', 'max:1000'],
                'livraison_demandee' => ['sometimes', 'boolean'],
            ])
            : $request->validate([
                'product_id' => ['required', 'integer', 'exists:products,id'],
                'quantity' => ['required', 'integer', 'min:1'],
                'negotiation_id' => ['nullable', 'integer', 'exists:negotiations,id'],
                'adresse_livraison' => ['nullable', 'string', 'max:500'],
                'ville_livraison' => ['nullable', 'string', 'max:100'],
                'telephone_livraison' => ['nullable', 'string', 'max:20'],
                'notes_livraison' => ['nullable', 'string', 'max:1000'],
                'livraison_demandee' => ['sometimes', 'boolean'],
            ]);

        $itemsInput = $isCart
            ? $validated['items']
            : [[
                'product_id' => $validated['product_id'],
                'quantity' => $validated['quantity'],
                'negotiation_id' => $validated['negotiation_id'] ?? null,
            ]];

        $buyer = $request->user();

        if (!$buyer->isBuyer()) {
            return response()->json(['message' => 'Seuls les acheteurs peuvent passer commande.'], 403);
        }

        try {
            $order = DB::transaction(function () use ($itemsInput, $validated, $buyer) {
                // Verrouiller les produits dans un ordre stable (tri par id)
                // pour éviter les deadlocks si deux paniers se recoupent.
                $productIds = collect($itemsInput)->pluck('product_id')->unique()->sort()->values();
                $products = Product::whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');

                $sellerId = null;
                $lineItems = [];
                $montantTotal = 0.0;

                foreach ($itemsInput as $line) {
                    $product = $products->get($line['product_id']);
                    if (!$product) {
                        throw new \DomainException('Un des produits du panier est introuvable.');
                    }
                    if ($product->statut !== 'active') {
                        throw new \DomainException("Le produit « {$product->nom} » n'est plus disponible.");
                    }
                    if ($product->stock_disponible < $line['quantity']) {
                        throw new \DomainException("Stock insuffisant pour « {$product->nom} ».");
                    }

                    if ($sellerId === null) {
                        $sellerId = $product->seller_id;
                    } elseif ($sellerId !== $product->seller_id) {
                        throw new \DomainException(
                            'Votre panier contient des produits de plusieurs fournisseurs différents. ' .
                            'Chaque commande C-Connect ne peut concerner qu\'un seul fournisseur à la fois — ' .
                            'validez vos articles fournisseur par fournisseur.'
                        );
                    }

                    // Honorer un prix négocié accepté pour cette ligne, s'il y en a un.
                    $negotiation = null;
                    $prixUnitaire = (float) $product->prix;

                    if (!empty($line['negotiation_id'])) {
                        $negotiation = \App\Models\Negotiation::lockForUpdate()
                            ->where('id', $line['negotiation_id'])
                            ->where('buyer_id', $buyer->id)
                            ->where('product_id', $product->id)
                            ->first();

                        if (!$negotiation) {
                            throw new \DomainException('Négociation introuvable pour ce produit et cet acheteur.');
                        }
                        if ($negotiation->status !== 'ACCEPTED') {
                            throw new \DomainException('Cette négociation n\'a pas été acceptée par le vendeur.');
                        }
                        if ($negotiation->order_id !== null) {
                            throw new \DomainException('Cette négociation a déjà été convertie en commande.');
                        }

                        $prixUnitaire = $negotiation->finalPrice();
                    }

                    $sousTotal = $prixUnitaire * $line['quantity'];
                    $montantTotal += $sousTotal;

                    $lineItems[] = [
                        'product' => $product,
                        'quantity' => $line['quantity'],
                        'prixUnitaire' => $prixUnitaire,
                        'sousTotal' => $sousTotal,
                        'negotiation' => $negotiation,
                    ];
                }

                $financials = Order::computeFinancials($montantTotal);
                $livraisonDemandee = (bool) ($validated['livraison_demandee'] ?? false);
                $fraisLivraison = $livraisonDemandee ? self::FRAIS_LIVRAISON_FIXE : 0.0;

                $order = Order::create([
                    'buyer_id' => $buyer->id,
                    'seller_id' => $sellerId,
                    ...$financials,
                    // Les frais de livraison vont au livreur, pas au vendeur —
                    // ajoutés au total payé par l'acheteur mais PAS à
                    // montant_vendeur/commission_plateforme (déjà calculés
                    // ci-dessus sur le seul sous-total produits).
                    'montant_total' => $financials['montant_total'] + $fraisLivraison,
                    'escrow_status' => Order::STATUS_PENDING,
                    'adresse_livraison' => $validated['adresse_livraison'] ?? null,
                    'ville_livraison' => $validated['ville_livraison'] ?? null,
                    'telephone_livraison' => $validated['telephone_livraison'] ?? null,
                    'livraison_demandee' => $livraisonDemandee,
                    'frais_livraison' => $fraisLivraison,
                ]);

                foreach ($lineItems as $line) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $line['product']->id,
                        'seller_id' => $line['product']->seller_id,
                        'quantite' => $line['quantity'],
                        'prix_unitaire' => $line['prixUnitaire'],
                        'sous_total' => $line['sousTotal'],
                    ]);

                    if ($line['negotiation']) {
                        $line['negotiation']->update(['order_id' => $order->id]);
                    }

                    $line['product']->reserverStock($line['quantity']);
                }

                return $order;
            });
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'data' => $order->load(['items.product:id,nom,region,unite', 'seller.user:id,nom,prenom', 'buyer:id,nom,prenom,email']),
            'message' => 'Commande créée avec succès. En attente de paiement en séquestre.',
        ], 201);
    }

    /**
     * Show a single order — only accessible to buyer or seller of the order.
     */
    public function show(Request $request, Order $order): JsonResponse
    {
        $this->authorizeParticipant($request, $order);

        return response()->json([
            'success' => true,
            'data' => $order->load(['items.product:id,nom,region,unite', 'buyer:id,nom,prenom,email', 'seller.user:id,nom,prenom', 'dispute']),
            'message' => 'Commande récupérée avec succès.',
        ]);
    }

    /**
     * Update order lifecycle status — restricted to participants.
     * - Livré/Complet : consomme définitivement le stock (décrémente stock + stock_reserve).
     * - Annulé : restitue uniquement le stock réservé (stock_reserve).
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $this->authorizeParticipant($request, $order);

        $validated = $request->validate([
            'escrow_status' => [
                'required',
                'string',
                'in:' . implode(',', Order::STATUSES),
            ],
        ]);

        $newStatus = $validated['escrow_status'];

        DB::transaction(function () use ($order, $newStatus): void {
            match ($newStatus) {
                Order::STATUS_ESCROW_LOCKED => $order->lockEscrow(),
                Order::STATUS_EN_PREPARATION => $order->markEnPreparation(),
                Order::STATUS_EXPEDIE => $order->markExpedie(),
                Order::STATUS_EN_TRANSIT => $order->markEnTransit(),
                Order::STATUS_LIVRE => $order->markLivre(),
                Order::STATUS_COMPLETE => $order->markComplete(),
                Order::STATUS_ANNULE => $order->cancel(),
                Order::STATUS_DISPUTE => $order->markAsDisputed(),
                default => $order->update(['escrow_status' => $newStatus]),
            };

            // Ajustement du stock selon la nature de l'état final
            foreach ($order->items as $item) {
                $product = $item->product;
                if (!$product) {
                    continue;
                }
                if (in_array($newStatus, Order::STOCK_RELEASING_STATUSES, true)) {
                    // Livraison confirmée : consommer le stock définitivement
                    $product->consommerStock($item->quantite);
                } elseif (in_array($newStatus, Order::STOCK_RESTORING_STATUSES, true)) {
                    // Annulation : restituer le stock réservé sans le consommer
                    $product->libererStock($item->quantite);
                }
            }
        });

        return response()->json([
            'success' => true,
            'data' => $order->fresh()->load('items.product:id,nom,region,unite,stock,stock_reserve'),
            'message' => 'Commande mise à jour avec succès.',
        ]);
    }

    /**
     * Cancel: only buyers can cancel orders still pending payment (before escrow lock).
     * Restores the reserved stock.
     */
    public function destroy(Request $request, Order $order): JsonResponse
    {
        if ($request->user()->id !== $order->buyer_id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Seul l\'acheteur peut annuler cette commande.'], 403);
        }

        // Annulation possible uniquement avant le verrouillage de l'escrow
        if (!in_array($order->escrow_status, [Order::STATUS_PENDING], true)) {
            return response()->json([
                'message' => 'Impossible d\'annuler une commande déjà en séquestre. Ouvrez un litige si nécessaire.',
            ], 422);
        }

        DB::transaction(function () use ($order): void {
            foreach ($order->items as $item) {
                $item->product?->libererStock($item->quantite);
            }
            $order->cancel();
        });

        return response()->json(['success' => true, 'message' => 'Commande annulée.']);
    }

    private function authorizeParticipant(Request $request, Order $order): void
    {
        $user = $request->user();
        $isParticipant = $user->id === $order->buyer_id
            || ($user->sellerProfile && $user->sellerProfile->id === $order->seller_id);

        if (!$isParticipant && !$user->isAdmin()) {
            abort(403, 'Non autorisé à accéder à cette commande.');
        }
    }
}
