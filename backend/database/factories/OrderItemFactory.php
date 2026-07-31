<?php

namespace Database\Factories;

use App\Models\OrderItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\SellerProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    public function definition(): array
    {
        $quantite = fake()->numberBetween(1, 20);
        $prixUnitaire = fake()->randomFloat(2, 500, 20000);

        return [
            'order_id' => Order::factory(),
            'product_id' => Product::factory(),
            'seller_id' => SellerProfile::factory(),
            'quantite' => $quantite,
            'prix_unitaire' => $prixUnitaire,
            'sous_total' => $quantite * $prixUnitaire,
        ];
    }
}
