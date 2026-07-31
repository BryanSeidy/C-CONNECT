<?php

namespace Database\Factories;

use App\Models\Negotiation;
use App\Models\Product;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Negotiation>
 */
class NegotiationFactory extends Factory
{
    public function definition(): array
    {
        $quantity = fake()->numberBetween(10, 100);
        $proposedPrice = fake()->randomFloat(2, 500, 5000);

        return [
            'product_id' => Product::factory(),
            'buyer_id' => User::factory()->buyer(),
            'seller_id' => SellerProfile::factory(),
            'quantity' => $quantity,
            'proposed_price' => $proposedPrice,
            'counter_price' => null,
            'message' => fake()->sentence(),
            'status' => 'PENDING',
            'order_id' => null,
        ];
    }

    public function accepted(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'ACCEPTED']);
    }
}
