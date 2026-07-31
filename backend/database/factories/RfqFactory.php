<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Rfq;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Rfq>
 */
class RfqFactory extends Factory
{
    protected $model = Rfq::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $regions = ['Littoral', 'Centre', 'Ouest', 'Nord', 'Sud-Ouest', 'Adamaoua'];
        $villes = ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Limbe', 'Ngaoundéré'];
        $unites = ['kg', 'tonne', 'sac_50kg', 'carton', 'litre'];
        $statuts = ['active', 'en_negociation', 'satisfaite', 'expiree', 'annulee'];

        return [
            'buyer_id' => User::factory()->client(),
            'category_id' => Category::factory(),
            'titre' => 'Besoin urgent de ' . $this->faker->words(3, true),
            'description' => $this->faker->paragraph(3),
            'quantite' => $this->faker->randomFloat(2, 50, 5000),
            'unite' => $this->faker->randomElement($unites),
            'budget_max' => $this->faker->randomFloat(2, 100000, 10000000),
            'region_livraison' => $this->faker->randomElement($regions),
            'ville_livraison' => $this->faker->randomElement($villes),
            'delai_livraison' => $this->faker->dateTimeBetween('+3 days', '+1 month')->format('Y-m-d'),
            'expire_le' => $this->faker->dateTimeBetween('+1 week', '+2 months')->format('Y-m-d'),
            'vendeur_verifie_requis' => $this->faker->boolean(40),
            'cooperative_uniquement' => $this->faker->boolean(20),
            'femmes_entrepreneures_prefere' => $this->faker->boolean(30),
            'statut' => $this->faker->randomElement($statuts),
            'nombre_offres' => 0,
            'synced' => true,
            'sync_ref' => Str::uuid()->toString(),
        ];
    }

    /**
     * State: RFQ active
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'statut' => 'active',
        ]);
    }

    /**
     * State: RFQ validée / satisfaite
     */
    public function validated(): static
    {
        return $this->state(fn (array $attributes) => [
            'statut' => 'satisfaite',
        ]);
    }

    /**
     * State: RFQ fermée / expirée
     */
    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'statut' => $this->faker->randomElement(['satisfaite', 'expiree', 'annulee']),
        ]);
    }
}
