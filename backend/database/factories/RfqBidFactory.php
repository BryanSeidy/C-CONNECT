<?php

namespace Database\Factories;

use App\Models\Rfq;
use App\Models\RfqBid;
use App\Models\SellerProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RfqBid>
 */
class RfqBidFactory extends Factory
{
    public function definition(): array
    {
        $prix = fake()->randomFloat(2, 500, 10000);

        return [
            'rfq_id' => Rfq::factory(),
            'seller_id' => SellerProfile::factory(),
            'prix_unitaire_propose' => $prix,
            'quantite_disponible' => fake()->numberBetween(50, 1000),
            'message' => fake()->sentence(),
            'statut' => 'en_attente',
        ];
    }
}
