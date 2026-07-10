<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use App\Models\SellerProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'seller_id' => SellerProfile::factory(),
            'category_id' => Category::factory(),
            'nom' => fake()->words(3, true),
            'description' => fake()->paragraph(),
            'prix' => fake()->randomFloat(2, 500, 50000),
            'stock' => fake()->numberBetween(10, 500),
            'stock_reserve' => 0,
            'stock_minimum' => 5,
            'unite' => fake()->randomElement(['kg', 'tonnes', 'sacs', 'caisses', 'litres']),
            'region' => fake()->randomElement(['Centre', 'Littoral', 'Ouest']),
            'statut' => 'active',
            'disponible' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => ['statut' => 'disabled', 'disponible' => false]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => ['stock' => 0, 'disponible' => false]);
    }
}
