<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        $montantTotal = fake()->randomFloat(2, 1000, 100000);
        $commission = round($montantTotal * 0.10, 2);

        return [
            'buyer_id' => User::factory()->buyer(),
            'seller_id' => SellerProfile::factory(),
            'montant_total' => $montantTotal,
            'commission_plateforme' => $commission,
            'montant_vendeur' => round($montantTotal - $commission, 2),
            'escrow_status' => Order::STATUS_PENDING,
            'adresse_livraison' => fake()->streetAddress(),
            'ville_livraison' => fake()->city(),
            'telephone_livraison' => fake()->phoneNumber(),
        ];
    }
}
