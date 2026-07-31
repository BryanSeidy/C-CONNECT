<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nom' => $this->faker->lastName(),
            'prenom' => $this->faker->firstName(),
            'email' => $this->faker->unique()->safeEmail(),
            'telephone' => '+2376' . $this->faker->numberBetween(50000000, 99999999),
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'role' => 'buyer',
            'company_id' => null,
            'remember_token' => Str::random(10),
            'synced' => true,
            'sync_ref' => Str::uuid()->toString(),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * State pour le rôle Client / Buyer
     */
    public function client(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'buyer',
        ]);
    }

    /**
     * State pour le rôle Client / Buyer (Alias)
     */
    public function buyer(): static
    {
        return $this->client();
    }

    /**
     * State pour le rôle Fournisseur / Seller
     */
    public function fournisseur(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'seller',
        ]);
    }

    /**
     * State pour le rôle Fournisseur / Seller (Alias)
     */
    public function seller(): static
    {
        return $this->fournisseur();
    }

    /**
     * State pour le rôle Admin
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'admin',
        ]);
    }
}
