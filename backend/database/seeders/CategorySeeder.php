<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['nom' => 'Agroalimentaire', 'description' => 'Produits agricoles et alimentaires transformés au Cameroun', 'icone' => '🌾'],
            ['nom' => 'Artisanat', 'description' => 'Artisanat traditionnel et contemporain camerounais', 'icone' => '🎨'],
            ['nom' => 'Mode & Textile', 'description' => 'Vêtements, tissus et accessoires made in Cameroon', 'icone' => '👗'],
            ['nom' => 'Cosmétique & Bien-être', 'description' => 'Produits cosmétiques naturels et soins du corps', 'icone' => '✨'],
            ['nom' => 'High-Tech & Électronique', 'description' => 'Innovations technologiques et électroniques locales', 'icone' => '💻'],
            ['nom' => 'Maison & Décoration', 'description' => 'Meubles, décoration et ameublement', 'icone' => '🏠'],
            ['nom' => 'Épicerie fine', 'description' => 'Épices, sauces et condiments du terroir', 'icone' => '🌶️'],
            ['nom' => 'Bijoux & Accessoires', 'description' => 'Bijoux artisanaux et accessoires de mode', 'icone' => '💍'],
        ];

        foreach ($categories as $index => $cat) {
            Category::create([
                'nom' => $cat['nom'],
                'slug' => Str::slug($cat['nom']),
                'description' => $cat['description'],
                'icone' => $cat['icone'],
                'order' => $index + 1,
                'is_active' => true,
            ]);
        }
    }
}
