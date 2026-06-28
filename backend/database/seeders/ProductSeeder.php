<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // Find or create a verified seller to attach products to
        $seller = User::firstOrCreate(
            ['email' => 'producteur@c-connect.cm'],
            [
                'name'        => 'Producteurs Certifiés C-Connect',
                'fullName'    => 'Producteurs Certifiés C-Connect',
                'companyName' => 'C-Connect Premium Producers',
                'password'    => Hash::make('SecurePass123!'),
                'role'        => 'seller',
                'country'     => 'CM-LT',
                'isVerified'  => true,
            ]
        );

        $products = [
            [
                'name'        => 'Poivre Blanc de Penja',
                'description' => 'Poivre blanc d\'appellation d\'origine Penja, réputé pour son arôme délicat et ses notes florales. Cultivé dans la région du Littoral depuis des générations, il est reconnu comme l\'un des meilleurs poivres au monde. Conditionné en vrac pour acheteurs professionnels.',
                'price'       => 18500,
                'stock'       => 500,
                'country'     => 'CM-LT',
                'category'    => 'Agroalimentaire',
                'imageUrl'    => null,
                'isActive'    => true,
            ],
            [
                'name'        => 'Sac en Cuir Artisanal de Maroua',
                'description' => 'Maroquinerie artisanale de Maroua, confectionnée par des artisans de l\'Extrême-Nord selon des techniques traditionnelles séculaires. Cuir naturel tanné, coutures à la main, finitions soignées. Disponible en commande groupée pour détaillants et exportateurs.',
                'price'       => 42000,
                'stock'       => 80,
                'country'     => 'CM-EN',
                'category'    => 'Textile',
                'imageUrl'    => null,
                'isActive'    => true,
            ],
            [
                'name'        => 'Café Arabica du Muanenguba',
                'description' => 'Café 100% Arabica cultivé sur les hauteurs du Mont Muanenguba, région Sud-Ouest. Altitude entre 1 400 et 1 900 m. Profil aromatique: notes de fruits rouges, caramel et épices douces. Torréfaction légère disponible. Certifié agriculture durable.',
                'price'       => 12900,
                'stock'       => 300,
                'country'     => 'CM-SW',
                'category'    => 'Agroalimentaire',
                'imageUrl'    => null,
                'isActive'    => true,
            ],
            [
                'name'        => 'Huile de Palme Rouge Bio de Ngaoundéré',
                'description' => 'Huile de palme rouge non raffinée, extraite à froid à partir de régimes de palme biologiques certifiés de la région de l\'Adamaoua. Riche en caroténoïdes et vitamines E. Conditionnée en bidons de 5 et 25 litres pour la restauration et l\'industrie agroalimentaire.',
                'price'       => 8750,
                'stock'       => 200,
                'country'     => 'CM-AD',
                'category'    => 'Agroalimentaire',
                'imageUrl'    => null,
                'isActive'    => true,
            ],
            [
                'name'        => 'Raphia Tressé du Centre',
                'description' => 'Fibres de raphia naturel tressées manuellement par des coopératives féminines de la région Centre. Produit phare de l\'artisanat camerounais, utilisé pour la confection de paniers, nattes et mobilier décoratif. Vente en rouleaux de 10 m ou en articles finis.',
                'price'       => 5500,
                'stock'       => 450,
                'country'     => 'CM-CE',
                'category'    => 'Textile',
                'imageUrl'    => null,
                'isActive'    => true,
            ],
            [
                'name'        => 'Cacao Fermenté de Bafoussam',
                'description' => 'Fèves de cacao fermentées et séchées, origine Bamiléké, région de l\'Ouest. Variété Trinitario à haute teneur en beurre. Taux de fermentation contrôlé, sans résidus chimiques. Idéal pour chocolatiers et transformateurs premium. Disponible en sacs de 50 kg.',
                'price'       => 9800,
                'stock'       => 600,
                'country'     => 'CM-OU',
                'category'    => 'Agroalimentaire',
                'imageUrl'    => null,
                'isActive'    => true,
            ],
        ];

        foreach ($products as $data) {
            Product::firstOrCreate(
                ['name' => $data['name'], 'producerId' => $seller->id],
                [...$data, 'producerId' => $seller->id]
            );
        }

        $this->command->info('Products seeded: ' . count($products) . ' premium C-Connect catalogue items created.');
    }
}
