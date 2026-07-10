<?php

namespace Database\Factories;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Company>
 */
class CompanyFactory extends Factory
{
    public function definition(): array
    {
        $nom = fake()->company();

        return [
            'nom' => $nom,
            'slug' => Str::slug($nom) . '-' . Str::random(6),
            'type_entreprise' => fake()->randomElement(['cooperative', 'producteur', 'fabricant', 'pme', 'grossiste']),
            'region' => fake()->randomElement(['Centre', 'Littoral', 'Ouest', 'Nord-Ouest']),
            'ville' => fake()->city(),
            'quartier' => fake()->streetName(),
            'telephone' => fake()->phoneNumber(),
            'email_professionnel' => fake()->companyEmail(),
            'description' => fake()->paragraph(),
            'statut_verification' => 'non_verifie',
            'trust_score' => 50,
        ];
    }

    public function verified(): static
    {
        return $this->state(fn (array $attributes) => [
            'statut_verification' => 'verifie',
            'badge_entreprise_verifiee' => true,
        ]);
    }
}
