<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $seller;
    private SellerProfile $sellerProfile;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seller = User::factory()->seller()->create();
        $this->sellerProfile = SellerProfile::factory()->for($this->seller)->create([
            'verification_status' => 'verified',
        ]);
        $this->category = Category::factory()->create();
    }

    public function test_public_can_list_active_products(): void
    {
        Product::factory()->count(3)->create([
            'seller_id' => $this->sellerProfile->id,
            'category_id' => $this->category->id,
            'statut' => 'active',
        ]);
        Product::factory()->inactive()->create([
            'seller_id' => $this->sellerProfile->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->getJson('/api/catalogue/products');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.meta.total', 3);
    }

    public function test_seller_can_create_product(): void
    {
        $response = $this->actingAs($this->seller, 'sanctum')->postJson('/api/products', [
            'name' => 'Cacao Premium',
            'description' => 'Fèves de cacao de qualité supérieure',
            'price' => 2500,
            'stock' => 200,
            'country' => 'Centre',
            'category' => $this->category->nom,
            'unite' => 'kg',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nom', 'Cacao Premium')
            ->assertJsonPath('data.statut', 'active');

        $this->assertDatabaseHas('products', [
            'nom' => 'Cacao Premium',
            'seller_id' => $this->sellerProfile->id,
            'prix' => 2500,
        ]);
    }

    public function test_user_without_seller_profile_cannot_create_product(): void
    {
        $buyer = User::factory()->buyer()->create();

        $response = $this->actingAs($buyer, 'sanctum')->postJson('/api/products', [
            'name' => 'Test Product',
            'description' => 'desc',
            'price' => 1000,
            'stock' => 10,
            'country' => 'Centre',
            'category' => $this->category->nom,
        ]);

        $response->assertForbidden();
    }

    public function test_seller_can_update_own_product(): void
    {
        $product = Product::factory()->create([
            'seller_id' => $this->sellerProfile->id,
            'category_id' => $this->category->id,
            'nom' => 'Original',
        ]);

        $this->actingAs($this->seller, 'sanctum')
            ->putJson("/api/products/{$product->id}", [
                'name' => 'Updated Name',
                'price' => 5000,
            ])
            ->assertOk()
            ->assertJsonPath('data.nom', 'Updated Name')
            ->assertJsonPath('data.prix', '5000.00');
    }

    public function test_other_seller_cannot_update_product(): void
    {
        $product = Product::factory()->create([
            'seller_id' => $this->sellerProfile->id,
            'category_id' => $this->category->id,
        ]);

        $otherSeller = User::factory()->seller()->create();
        $otherProfile = SellerProfile::factory()->for($otherSeller)->create();

        $this->actingAs($otherSeller, 'sanctum')
            ->putJson("/api/products/{$product->id}", ['name' => 'Hacked'])
            ->assertForbidden();
    }

    public function test_seller_can_delete_own_product(): void
    {
        $product = Product::factory()->create([
            'seller_id' => $this->sellerProfile->id,
            'category_id' => $this->category->id,
        ]);

        $this->actingAs($this->seller, 'sanctum')
            ->deleteJson("/api/products/{$product->id}")
            ->assertOk();

        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    public function test_seller_can_list_own_products(): void
    {
        Product::factory()->count(2)->create([
            'seller_id' => $this->sellerProfile->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')->getJson('/api/products/me');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data');
    }

    public function test_unauthenticated_user_cannot_create_product(): void
    {
        $this->postJson('/api/products', [
            'name' => 'Test',
            'description' => 'desc',
            'price' => 100,
            'stock' => 1,
            'country' => 'Centre',
            'category' => $this->category->nom,
        ])->assertUnauthorized();
    }
}
