<?php

namespace Database\Factories;

use App\Models\Dispute;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Dispute>
 */
class DisputeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'initiateur_id' => User::factory()->buyer(),
            'raison' => fake()->randomElement([
                'marchandise_non_recue',
                'qualite_non_conforme',
                'quantite_incorrecte',
                'produit_endommage',
                'retard_livraison',
                'autre',
            ]),
            'description' => fake()->paragraph(),
            'preuves_urls' => null,
            'statut' => 'ouvert',
            'notes_resolution' => null,
            'resolu_par' => null,
            'resolu_le' => null,
        ];
    }
}
