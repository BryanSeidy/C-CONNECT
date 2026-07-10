<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Rfq;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Rfq>
 */
class RfqFactory extends Factory
{
    public function definition(): array
    {
        return [
            'buyer_id' => User::factory()->buyer(),
            'category_id' => Category::factory(),
            'titre' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'quantite' => fake()->numberBetween(50, 1000),
            'unite' => fake()->randomElement(['kg', 'tonnes', 'sacs', 'litres']),
            'budget_max' => fake()->randomFloat(2, 100000, 5000000),
            'region_livraison' => fake()->randomElement(['Centre', 'Littoral', 'Ouest']),
            'ville_livraison' => fake()->city(),
            'statut' => 'active',
            'nombre_offres' => 0,
        ];
    }
}
