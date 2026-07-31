<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Company;
use App\Models\DeliveryPartner;
use App\Models\DeliveryRequest;
use App\Models\Dispute;
use App\Models\GamificationStat;
use App\Models\Negotiation;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentEvent;
use App\Models\Product;
use App\Models\RecurringOrder;
use App\Models\Review;
use App\Models\Rfq;
use App\Models\RfqBid;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Ordre méticuleux respectant l'intégrité référentielle PostgreSQL.
     */
    public function run(): void
    {
        $this->command->info('🚀 Début du Seeding Master B2B C-Connect (Laravel 12 / PostgreSQL)...');

        // ---------------------------------------------------------------------
        // STEP 1: Tables Indépendantes de Base (Catégories)
        // ---------------------------------------------------------------------
        $this->command->info('1/9 Chargement des Catégories...');
        $this->call(CategorySeeder::class);
        $categories = Category::all();

        // ---------------------------------------------------------------------
        // STEP 2: Entreprises & Partenaires de Livraison
        // ---------------------------------------------------------------------
        $this->command->info('2/9 Création des Entreprises B2B et Partenaires de Livraison...');

        $companies = Company::factory()->count(10)->create();

        $deliveryPartners = [
            DeliveryPartner::create(['nom' => 'Campost Express', 'telephone' => '+237699001122', 'email' => 'contact@campost.cm', 'region' => 'Centre', 'actif' => true, 'livraisons_en_cours' => 2]),
            DeliveryPartner::create(['nom' => 'Boulangerie & Fret Express', 'telephone' => '+237677112233', 'email' => 'fret@bfexpress.cm', 'region' => 'Littoral', 'actif' => true, 'livraisons_en_cours' => 4]),
            DeliveryPartner::create(['nom' => 'Trans-Cameroon Logistics', 'telephone' => '+237655223344', 'email' => 'dispatch@transcam.cm', 'region' => 'Ouest', 'actif' => true, 'livraisons_en_cours' => 1]),
            DeliveryPartner::create(['nom' => 'Sahel Logistics Garoua', 'telephone' => '+237691445566', 'email' => 'logistics@sahel.cm', 'region' => 'Nord', 'actif' => true, 'livraisons_en_cours' => 0]),
        ];

        // ---------------------------------------------------------------------
        // STEP 3: Utilisateurs Core (Admin, Vendeurs, Acheteurs)
        // ---------------------------------------------------------------------
        $this->command->info('3/9 Création des Utilisateurs de démonstration et rôles...');

        // 1 Admin Principal
        $admin = User::firstOrCreate(
            ['email' => 'admin@cconnect.cm'],
            [
                'nom' => 'Admin',
                'prenom' => 'System',
                'telephone' => '+237690000000',
                'email_verified_at' => now(),
                'password' => Hash::make('Admin@2026!'),
                'role' => 'admin',
                'synced' => true,
                'sync_ref' => Str::uuid()->toString(),
            ]
        );

        // Utilisateurs de test spécifiques (Seeders existants)
        $this->call(UserSeeder::class);

        // Acheteurs (Buyers) supplémentaires
        $buyers = User::factory()->client()->count(15)->create();
        $allBuyers = User::where('role', 'buyer')->get();

        // ---------------------------------------------------------------------
        // STEP 4: Profils Vendeurs (SellerProfiles)
        // ---------------------------------------------------------------------
        $this->command->info('4/9 Création des Profils Vendeurs et Boutiques...');
        $this->call(SellerProfileSeeder::class);

        $sellers = User::where('role', 'seller')->get();
        foreach ($sellers as $sellerUser) {
            if (! $sellerUser->sellerProfile) {
                SellerProfile::factory()->create([
                    'user_id' => $sellerUser->id,
                    'company_id' => $companies->random()->id,
                ]);
            }
        }
        $sellerProfiles = SellerProfile::all();

        // ---------------------------------------------------------------------
        // STEP 5: Produits & Catalogue Marketplace
        // ---------------------------------------------------------------------
        $this->command->info('5/9 Population du Catalogue de Produits...');
        $this->call(ProductSeeder::class);

        // Générer des produits supplémentaires via Factory
        foreach ($sellerProfiles as $profile) {
            Product::factory()->count(4)->create([
                'seller_id' => $profile->id,
                'category_id' => $categories->random()->id,
                'region' => $profile->region ?? 'Littoral',
            ]);
        }
        $products = Product::all();

        // ---------------------------------------------------------------------
        // STEP 6: Demandes de Prix (RFQ) & Offres (RFQ Bids)
        // ---------------------------------------------------------------------
        $this->command->info('6/9 Génération des Demandes de Prix (RFQs) et Offres Vendeurs...');

        // Générer 20 RFQs liées exclusivement à des acheteurs
        foreach ($allBuyers->take(10) as $buyer) {
            $rfq = Rfq::factory()->create([
                'buyer_id' => $buyer->id,
                'category_id' => $categories->random()->id,
                'statut' => 'active',
            ]);

            // 2 à 4 offres par RFQ
            $biddingSellers = $sellerProfiles->random(rand(2, min(4, $sellerProfiles->count())));
            foreach ($biddingSellers as $biddingSeller) {
                RfqBid::create([
                    'rfq_id' => $rfq->id,
                    'seller_id' => $biddingSeller->id,
                    'prix_unitaire_propose' => rand(2000, 45000),
                    'quantite_disponible' => rand(50, 500),
                    'date_livraison_proposee' => now()->addDays(rand(3, 14)),
                    'message' => 'Nous pouvons fournir cette quantité avec certification de qualité.',
                    'conditions' => 'Paiement 50% à la commande, 50% à la livraison',
                    'statut' => 'en_attente',
                ]);
                $rfq->incrementNombreOffres();
            }
        }

        // RFQs validées/fermées
        $validatedRfqs = Rfq::factory()->validated()->count(5)->create([
            'buyer_id' => $allBuyers->random()->id,
            'category_id' => $categories->random()->id,
        ]);

        // ---------------------------------------------------------------------
        // STEP 7: Commandes, OrderItems & Escrow Lifecycle
        // ---------------------------------------------------------------------
        $this->command->info('7/9 Génération des Commandes B2B et Cycle d\'Escrow...');

        $escrowStatuses = ['pending', 'escrow_locked', 'en_preparation', 'expedie', 'en_transit', 'livre', 'complete', 'annule'];

        for ($i = 0; $i < 25; $i++) {
            $buyer = $allBuyers->random();
            $seller = $sellerProfiles->random();
            $sellerProducts = Product::where('seller_id', $seller->id)->get();

            if ($sellerProducts->isEmpty()) {
                $sellerProducts = collect([$products->random()]);
            }

            $status = $escrowStatuses[array_rand($escrowStatuses)];
            $montantTotal = 0;

            $order = Order::create([
                'buyer_id' => $buyer->id,
                'seller_id' => $seller->id,
                'montant_total' => 0, // Mis à jour ci-dessous
                'commission_plateforme' => 0,
                'montant_vendeur' => 0,
                'escrow_status' => $status,
                'payment_provider' => rand(0, 1) ? 'orange_money' : 'campay',
                'payment_reference' => 'REF-' . Str::upper(Str::random(8)),
                'transaction_reference' => 'TRX-' . Str::upper(Str::random(12)),
                'pay_token' => Str::random(32),
                'payment_status' => in_array($status, ['pending', 'annule']) ? 'PENDING' : 'SUCCESS',
                'adresse_livraison' => 'Marché Central, Stand ' . rand(10, 150),
                'ville_livraison' => $seller->ville ?? 'Douala',
                'telephone_livraison' => $buyer->telephone ?? '+237699112233',
                'livraison_demandee' => true,
                'frais_livraison' => 3500.00,
                'paid_at' => in_array($status, ['pending']) ? null : now()->subDays(rand(5, 20)),
                'confirmed_at' => in_array($status, ['pending']) ? null : now()->subDays(rand(4, 19)),
                'shipped_at' => in_array($status, ['expedie', 'en_transit', 'livre', 'complete']) ? now()->subDays(rand(2, 5)) : null,
                'delivered_at' => in_array($status, ['livre', 'complete']) ? now()->subDays(rand(1, 2)) : null,
                'released_at' => $status === 'complete' ? now()->subHours(12) : null,
                'cancelled_at' => $status === 'annule' ? now()->subDays(1) : null,
                'synced' => true,
                'sync_ref' => Str::uuid()->toString(),
            ]);

            // Ajouter items
            foreach ($sellerProducts->take(rand(1, 3)) as $prod) {
                $qty = rand(2, 20);
                $unitPrice = $prod->prix;
                $subtotal = $qty * $unitPrice;
                $montantTotal += $subtotal;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $prod->id,
                    'seller_id' => $seller->id,
                    'quantite' => $qty,
                    'prix_unitaire' => $unitPrice,
                    'sous_total' => $subtotal,
                ]);
            }

            // Mettre à jour financiers
            $commission = $montantTotal * 0.10; // 10%
            $vendeurNet = $montantTotal - $commission;

            $order->update([
                'montant_total' => $montantTotal + 3500.00, // avec livraison
                'commission_plateforme' => $commission,
                'montant_vendeur' => $vendeurNet,
            ]);

            // Événement de paiement
            PaymentEvent::create([
                'order_id' => $order->id,
                'event_type' => 'webhook_processed',
                'transaction_reference' => $order->transaction_reference,
                'provider' => $order->payment_provider,
                'payment_method' => 'mobile_money',
                'amount' => $order->montant_total,
                'status' => 'SUCCESS',
                'payload_snapshot' => json_encode(['status' => 'SUCCESS', 'ref' => $order->payment_reference]),
                'source_ip' => '127.0.0.1',
                'success' => true,
            ]);

            // Avis / Reviews si la commande est livrée ou complétée
            if (in_array($status, ['livre', 'complete'])) {
                $firstItem = $order->items->first();
                if ($firstItem) {
                    Review::firstOrCreate(
                        ['buyer_id' => $buyer->id, 'product_id' => $firstItem->product_id],
                        [
                            'order_id' => $order->id,
                            'note' => rand(4, 5),
                            'commentaire' => 'Excellente qualité de marchandise et livraison rapide.',
                            'is_verified_purchase' => true,
                        ]
                    );
                }
            }
        }

        // ---------------------------------------------------------------------
        // STEP 8: Livraisons & Disputes
        // ---------------------------------------------------------------------
        $this->command->info('8/9 Création des Bons de Livraison et Litiges...');

        $shippedOrders = Order::whereIn('escrow_status', ['expedie', 'en_transit', 'livre', 'complete'])->get();
        foreach ($shippedOrders->take(10) as $shippedOrder) {
            DeliveryRequest::create([
                'order_id' => $shippedOrder->id,
                'delivery_partner_id' => $deliveryPartners[array_rand($deliveryPartners)]->id,
                'frais_livraison' => $shippedOrder->frais_livraison ?? 3500.00,
                'ville_livraison' => $shippedOrder->ville_livraison ?? 'Douala',
                'adresse_livraison' => $shippedOrder->adresse_livraison,
                'telephone_livraison' => $shippedOrder->telephone_livraison,
                'statut' => $shippedOrder->escrow_status === 'complete' ? 'livree' : 'en_transit',
                'token_reponse' => Str::random(48),
                'assignee_le' => now()->subDays(2),
                'repondue_le' => now()->subDays(2),
                'livree_le' => $shippedOrder->escrow_status === 'complete' ? now()->subDay() : null,
            ]);
        }

        // 2 Litiges de test
        $disputeOrder = Order::where('escrow_status', 'complete')->first();
        if ($disputeOrder) {
            Dispute::create([
                'order_id' => $disputeOrder->id,
                'initiateur_id' => $disputeOrder->buyer_id,
                'raison' => 'qualite_non_conforme',
                'description' => 'Un sac de maïs présentait de l\'humidité à la réception.',
                'statut' => 'ouvert',
                'synced' => true,
                'sync_ref' => Str::uuid()->toString(),
            ]);
        }

        // ---------------------------------------------------------------------
        // STEP 9: Gamification & Commandes Récurrentes
        // ---------------------------------------------------------------------
        $this->command->info('9/9 Initialisation des Stats de Gamification...');

        foreach ($sellers as $seller) {
            GamificationStat::updateOrCreate(
                ['user_id' => $seller->id],
                [
                    'points' => rand(500, 5000),
                    'lifetime_points' => rand(5000, 20000),
                    'tier' => 'gold',
                    'total_sales_count' => rand(10, 100),
                    'total_sales_amount' => rand(1000000, 10000000),
                    'volume_ventes' => rand(1000000, 10000000),
                    'average_rating' => 4.85,
                    'total_reviews_count' => rand(5, 50),
                    'badges_unlocked' => ['verifie', 'top_vendeur', 'pionnier_local'],
                    'total_orders_count' => rand(10, 100),
                    'total_reviews_written' => 0,
                    'referrals_count' => rand(1, 5),
                    'synced' => true,
                    'sync_ref' => Str::uuid()->toString(),
                ]
            );
        }

        $this->command->info('✅ SEEDING MASTER C-CONNECT TERMINÉ AVEC SUCCÈS !');
    }
}
