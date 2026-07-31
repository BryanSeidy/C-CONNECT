<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    public function definition(): array
    {
        $nom = fake()->unique()->words(2, true);

        return [
            'nom' => ucfirst($nom),
            'slug' => Str::slug($nom),
            'description' => fake()->sentence(),
            'icone' => fake()->randomElement(['agriculture', 'textile', 'agroalimentaire', 'artisanat']),
            'is_active' => true,
            'order' => 0,
        ];
    }
}
