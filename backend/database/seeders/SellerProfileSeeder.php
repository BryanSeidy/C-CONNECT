<?php

namespace Database\Seeders;

use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;

class SellerProfileSeeder extends Seeder
{
    /**
     * Seed the seller_profiles table with a realistic profile.
     */
    public function run(): void
    {
        $seller = User::where('email', 'seller@cconnect.cm')->first();

        if ($seller) {
            SellerProfile::firstOrCreate(
                ['user_id' => $seller->id],
                [
                    'company_name'     => 'Coopérative des Femmes de Foumban',
                    'bio'              => 'Production artisanale de paniers et de tissus traditionnels faits à la main par les femmes de la région de l\'Ouest.',
                    'is_female_owned'  => true,
                    'is_local_producer' => true,
                    'region'           => 'Ouest',
                    'points'           => 150,
                    'badges_unlocked'  => json_encode(['woman_pioneer']),
                ]
            );
        }
    }
}
