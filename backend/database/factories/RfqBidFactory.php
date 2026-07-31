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
        $prix = $this->faker->randomFloat(2, 500, 10000);

        return [
            'rfq_id' => Rfq::factory(),
            'seller_id' => SellerProfile::factory(),
            'prix_unitaire_propose' => $prix,
            'quantite_disponible' => $this->faker->numberBetween(50, 1000),
            'message' => $this->faker->sentence(),
            'statut' => 'en_attente',
        ];
    }
}
