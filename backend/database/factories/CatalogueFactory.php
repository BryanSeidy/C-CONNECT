<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use App\Models\SellerProfile;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * CatalogueFactory / ProductFactory pour les articles du catalogue marketplace
 *
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class CatalogueFactory extends Factory
{
    protected $model = Product::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $nom = $this->faker->unique()->words(3, true);
        $regions = ['Littoral', 'Centre', 'Ouest', 'Nord', 'Sud-Ouest', 'Adamaoua'];
        $unites = ['kg', 'sac_50kg', 'carton', 'litre', 'unite', 'tonne'];

        return [
            'seller_id' => SellerProfile::factory(),
            'category_id' => Category::factory(),
            'nom' => ucfirst($nom),
            'slug' => Str::slug($nom) . '-' . Str::random(5),
            'description' => $this->faker->paragraph(4),
            'prix' => $this->faker->randomFloat(2, 500, 250000),
            'prix_minimum_commande' => $this->faker->randomFloat(2, 500, 50000),
            'quantite_minimum' => $this->faker->randomFloat(2, 1, 10),
            'stock' => $this->faker->numberBetween(10, 2000),
            'stock_reserve' => 0,
            'stock_minimum' => 5,
            'unite' => $this->faker->randomElement($unites),
            'region' => $this->faker->randomElement($regions),
            'image_url' => 'https://picsum.photos/600/400?random=' . $this->faker->numberBetween(1, 1000),
            'quality_rating' => $this->faker->randomFloat(2, 3.5, 5.0),
            'reviews_count' => $this->faker->numberBetween(0, 50),
            'sales_count' => $this->faker->numberBetween(0, 200),
            'statut' => 'active',
            'disponible' => true,
            'synced' => true,
            'sync_ref' => Str::uuid()->toString(),
        ];
    }
}
