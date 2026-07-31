<?php

namespace Database\Factories;

use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<SellerProfile>
 */
class SellerProfileFactory extends Factory
{
    public function definition(): array
    {
        $businessName = $this->faker->company();

        return [
            'user_id' => User::factory()->seller(),
            'business_name' => $businessName,
            'slug' => Str::slug($businessName) . '-' . Str::random(6),
            'biographie' => $this->faker->paragraph(),
            'region' => $this->faker->randomElement(['Centre', 'Littoral', 'Ouest', 'Nord-Ouest', 'Sud-Ouest']),
            'ville' => $this->faker->city(),
            'adresse' => $this->faker->streetAddress(),
            'telephone_boutique' => $this->faker->phoneNumber(),
            'is_female_owned' => $this->faker->boolean(30),
            'is_local_producer' => $this->faker->boolean(60),
            'is_cooperative' => $this->faker->boolean(20),
            'verification_status' => 'verified',
            'verified_at' => now(),
        ];
    }
}
