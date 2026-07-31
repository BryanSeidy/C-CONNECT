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
        // Force la résolution propre du générateur de fausses données pour Laravel 12
        $fakerInstance = app(\Faker\Generator::class);
        $nom = $fakerInstance->company();

        return [
            'nom' => $nom,
            'slug' => Str::slug($nom) . '-' . Str::random(6),
            'type_entreprise' => $fakerInstance->randomElement(['cooperative', 'producteur', 'fabricant', 'pme', 'grossiste']),
            'region' => $fakerInstance->randomElement(['Centre', 'Littoral', 'Ouest', 'Nord-Ouest']),
            'ville' => $fakerInstance->city(),
            'quartier' => $fakerInstance->streetName(),
            'telephone' => $fakerInstance->phoneNumber(),
            'email_professionnel' => $fakerInstance->companyEmail(),
            'description' => $fakerInstance->paragraph(),
            'statut_verification' => 'non_verifie',
            'trust_score' => 50,
        ];
    }

    public function verified(): static
    {
        return $this->state(fn(array $attributes) => [
            'statut_verification' => 'verifie',
            'badge_entreprise_verifiee' => true,
        ]);
    }
}
