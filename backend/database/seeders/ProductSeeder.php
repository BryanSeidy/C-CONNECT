<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\SellerProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $sellers = SellerProfile::with('user')->get();
        $categories = Category::all();

        $productsData = [
            // Saveurs du Terroir Cécile
            [
                'seller_email' => 'cecile@example.cm',
                'category' => 'Agroalimentaire',
                'products' => [
                    ['nom' => 'Jus de Gingembre Naturel 1L', 'description' => 'Jus de gingembre 100% naturel, sans conservateur. Produit à Bafoussam.', 'prix' => 2500, 'stock' => 50, 'region' => 'Ouest'],
                    ['nom' => 'Confiture de Mangue Sauvage', 'description' => 'Confiture artisanale aux mangues sauvages du pays bamiléké.', 'prix' => 3000, 'stock' => 30, 'region' => 'Ouest'],
                    ['nom' => 'Miel Pur de Montagne', 'description' => 'Miel récolté dans les montagnes de l\'Ouest Cameroun. Non pasteurisé.', 'prix' => 4500, 'stock' => 20, 'region' => 'Ouest'],
                ]
            ],
            // Pauline Cosmetics
            [
                'seller_email' => 'pauline@example.cm',
                'category' => 'Cosmétique & Bien-être',
                'products' => [
                    ['nom' => 'Beurre de Karité Brut 250g', 'description' => 'Beurre de karité non raffiné du Nord Cameroun. Hydratant intense.', 'prix' => 3500, 'stock' => 100, 'region' => 'Nord'],
                    ['nom' => 'Savon Noir Africain', 'description' => 'Savon noir traditionnel à base de cendres de plantain et huile de coco.', 'prix' => 1500, 'stock' => 200, 'region' => 'Nord'],
                ]
            ],
            // Esther Fashion Design
            [
                'seller_email' => 'esther@example.cm',
                'category' => 'Mode & Textile',
                'products' => [
                    ['nom' => 'Robe Toghu Moderne', 'description' => 'Robe contemporaine en tissu Toghu brodé main. Pièce unique.', 'prix' => 45000, 'stock' => 3, 'region' => 'Littoral'],
                    ['nom' => 'Ensemble Pagne Ndop', 'description' => 'Ensemble femme en authentique Ndop de l\'Ouest. Sur mesure.', 'prix' => 35000, 'stock' => 5, 'region' => 'Littoral'],
                ]
            ],
            // Coopérative Tchinda
            [
                'seller_email' => 'jean@example.cm',
                'category' => 'Épicerie fine',
                'products' => [
                    ['nom' => 'Cacao en Poudre 500g', 'description' => 'Cacao camerounais 100% pur, torréfié artisanalement.', 'prix' => 4000, 'stock' => 80, 'region' => 'Centre'],
                    ['nom' => 'Café Robusta 250g', 'description' => 'Café robusta des plateaux de l\'Ouest. Torréfaction traditionnelle.', 'prix' => 3000, 'stock' => 60, 'region' => 'Centre'],
                ]
            ],
            // Artisanat Kamga
            [
                'seller_email' => 'pierre@example.cm',
                'category' => 'Artisanat',
                'products' => [
                    ['nom' => 'Masque Bamileke Authentique', 'description' => 'Masque cérémoniel sculpté main. Bois d\'ébène. Collection.', 'prix' => 85000, 'stock' => 2, 'region' => 'Ouest'],
                    ['nom' => 'Statue Reine Mère', 'description' => 'Statuette en bronze représentant une reine mère. H 30cm.', 'prix' => 65000, 'stock' => 4, 'region' => 'Ouest'],
                ]
            ],
        ];

        foreach ($productsData as $sellerData) {
            $seller = $sellers->first(fn($s) => $s->user->email === $sellerData['seller_email']);
            $category = $categories->first(fn($c) => $c->nom === $sellerData['category']);

            foreach ($sellerData['products'] as $p) {
                Product::create([
                    'seller_id' => $seller->id,
                    'category_id' => $category->id,
                    'nom' => $p['nom'],
                    'slug' => Str::slug($p['nom']) . '-' . Str::random(4),
                    'description' => $p['description'],
                    'prix' => $p['prix'],
                    'stock' => $p['stock'],
                    'region' => $p['region'],
                    'statut' => 'active',
                    'quality_rating' => fake()->randomFloat(2, 3.5, 5.0),
                    'reviews_count' => fake()->numberBetween(0, 50),
                    'sales_count' => fake()->numberBetween(0, 200),
                ]);
            }
        }
    }
}