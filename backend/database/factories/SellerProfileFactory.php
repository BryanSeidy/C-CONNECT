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
        $businessName = fake()->company();

        return [
            'user_id' => User::factory()->seller(),
            'business_name' => $businessName,
            'slug' => Str::slug($businessName) . '-' . Str::random(6),
            'biographie' => fake()->paragraph(),
            'region' => fake()->randomElement(['Centre', 'Littoral', 'Ouest', 'Nord-Ouest', 'Sud-Ouest']),
            'ville' => fake()->city(),
            'adresse' => fake()->streetAddress(),
            'telephone_boutique' => fake()->phoneNumber(),
            'is_female_owned' => fake()->boolean(30),
            'is_local_producer' => fake()->boolean(60),
            'is_cooperative' => fake()->boolean(20),
            'verification_status' => 'verified',
            'verified_at' => now(),
        ];
    }
}
