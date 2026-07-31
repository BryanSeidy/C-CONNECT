<?php

namespace Database\Factories;

use App\Models\DeliveryPartner;
use App\Models\DeliveryRequest;
use App\Models\Order;
use App\Models\Rfq;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DeliveryRequest>
 */
class LivraisonFactory extends Factory
{
    protected $model = DeliveryRequest::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $villes = ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Kribi'];
        $statuts = ['en_attente_assignation', 'assignee', 'acceptee', 'en_transit', 'livree'];

        // Une livraison ne peut être associée qu'à un RFQ / Commande validée ou fermée
        $rfqValide = Rfq::whereIn('statut', ['satisfaite', 'en_negociation', 'expiree', 'annulee'])->inRandomOrder()->first();

        if (! $rfqValide) {
            $rfqValide = Rfq::factory()->validated()->create();
        }

        // Trouver ou créer une commande liée aux statuts validés/livrés/complétés
        $order = Order::whereIn('escrow_status', ['expedie', 'en_transit', 'livre', 'complete'])->inRandomOrder()->first();

        if (! $order) {
            $buyer = User::where('role', 'buyer')->inRandomOrder()->first() ?? User::factory()->client()->create();
            $seller = SellerProfile::inRandomOrder()->first() ?? SellerProfile::factory()->create();

            $order = Order::create([
                'buyer_id' => $buyer->id,
                'seller_id' => $seller->id,
                'montant_total' => 150000.00,
                'commission_plateforme' => 15000.00,
                'montant_vendeur' => 135000.00,
                'escrow_status' => 'livre',
                'payment_provider' => 'orange_money',
                'payment_reference' => 'OM-' . Str::upper(Str::random(10)),
                'transaction_reference' => 'TRX-' . Str::upper(Str::random(12)),
                'payment_status' => 'SUCCESS',
                'adresse_livraison' => $this->faker->streetAddress(),
                'ville_livraison' => $this->faker->randomElement($villes),
                'telephone_livraison' => '+2376' . $this->faker->numberBetween(50000000, 99999999),
                'livraison_demandee' => true,
                'frais_livraison' => 5000.00,
                'paid_at' => now()->subDays(5),
                'confirmed_at' => now()->subDays(4),
                'shipped_at' => now()->subDays(2),
                'delivered_at' => now()->subDay(),
                'synced' => true,
                'sync_ref' => Str::uuid()->toString(),
            ]);
        }

        $partner = DeliveryPartner::inRandomOrder()->first() ?? DeliveryPartner::factory()->create();

        return [
            'order_id' => $order->id,
            'delivery_partner_id' => $partner->id,
            'frais_livraison' => $this->faker->randomFloat(2, 2500, 25000),
            'ville_livraison' => $order->ville_livraison ?? $this->faker->randomElement($villes),
            'adresse_livraison' => $order->adresse_livraison ?? $this->faker->streetAddress(),
            'telephone_livraison' => $order->telephone_livraison ?? '+2376' . $this->faker->numberBetween(50000000, 99999999),
            'statut' => $this->faker->randomElement($statuts),
            'token_reponse' => Str::random(48),
            'assignee_le' => now()->subDays(3),
            'repondue_le' => now()->subDays(2),
            'livree_le' => now()->subDay(),
        ];
    }
}
