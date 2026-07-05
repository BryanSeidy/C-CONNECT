<?php

namespace Database\Seeders;

use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SellerProfileSeeder extends Seeder
{
    public function run(): void
    {
        $sellers = User::where('role', 'seller')->get();

        $profiles = [
            // Femmes entrepreneures
            [
                'user_id' => $sellers->where('email', 'cecile@example.cm')->first()->id,
                'business_name' => 'Saveurs du Terroir Cécile',
                'biographie' => 'Productrice de jus naturels et confitures artisanales depuis 2015. Tous nos fruits sont cultivés dans notre verger à Bafoussam.',
                'region' => 'Ouest',
                'ville' => 'Bafoussam',
                'is_female_owned' => true,
                'is_local_producer' => true,
                'verification_status' => 'verified',
            ],
            [
                'user_id' => $sellers->where('email', 'pauline@example.cm')->first()->id,
                'business_name' => 'Pauline Cosmetics',
                'biographie' => 'Cosmétiques 100% naturels à base de beurre de karité et huiles essentielles du Nord Cameroun.',
                'region' => 'Nord',
                'ville' => 'Garoua',
                'is_female_owned' => true,
                'is_local_producer' => true,
                'verification_status' => 'verified',
            ],
            [
                'user_id' => $sellers->where('email', 'esther@example.cm')->first()->id,
                'business_name' => 'Esther Fashion Design',
                'biographie' => 'Créatrice de mode contemporaine inspirée des tissus traditionnels camerounais. Chaque pièce est unique.',
                'region' => 'Littoral',
                'ville' => 'Douala',
                'is_female_owned' => true,
                'is_local_producer' => true,
                'verification_status' => 'verified',
            ],
            // Producteurs locaux
            [
                'user_id' => $sellers->where('email', 'jean@example.cm')->first()->id,
                'business_name' => 'Coopérative Tchinda et Frères',
                'biographie' => 'Coopérative de producteurs de cacao et café des régions du Centre et Sud. Commerce équitable.',
                'region' => 'Centre',
                'ville' => 'Yaoundé',
                'is_female_owned' => false,
                'is_local_producer' => true,
                'is_cooperative' => true,
                'verification_status' => 'verified',
            ],
            [
                'user_id' => $sellers->where('email', 'pierre@example.cm')->first()->id,
                'business_name' => 'Artisanat Kamga',
                'biographie' => 'Sculptures, masques et objets d\'art traditionnel bamiléké. Atelier familial depuis 3 générations.',
                'region' => 'Ouest',
                'ville' => 'Bafoussam',
                'is_female_owned' => false,
                'is_local_producer' => true,
                'verification_status' => 'verified',
            ],
        ];

        foreach ($profiles as $profile) {
            SellerProfile::create(array_merge($profile, [
                'slug' => Str::slug($profile['business_name']) . '-' . Str::random(4),
            ]));
        }
    }
}
