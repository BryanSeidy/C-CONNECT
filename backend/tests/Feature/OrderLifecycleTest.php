<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private User $buyer;
    private SellerProfile $sellerProfile;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->buyer = User::factory()->buyer()->create();
        $seller = User::factory()->seller()->create();
        $this->sellerProfile = SellerProfile::factory()->for($seller)->create([
            'verification_status' => 'verified',
        ]);
        $category = Category::factory()->create();

        $this->product = Product::factory()->create([
            'seller_id' => $this->sellerProfile->id,
            'category_id' => $category->id,
            'stock' => 100,
            'stock_reserve' => 0,
            'statut' => 'active',
        ]);
    }

    public function test_buyer_can_create_order_and_stock_is_reserved(): void
    {
        $response = $this->actingAs($this->buyer, 'sanctum')->postJson('/api/orders', [
            'product_id' => $this->product->id,
            'quantity' => 10,
            'adresse_livraison' => '123 Marché Central',
            'ville_livraison' => 'Yaoundé',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.escrow_status', Order::STATUS_PENDING);

        // Le stock réservé doit avoir augmenté
        $this->product->refresh();
        $this->assertSame(10, (int) $this->product->stock_reserve);
        $this->assertSame(100, (int) $this->product->stock); // stock réel inchangé
        $this->assertSame(90, $this->product->stock_disponible);
    }

    public function test_order_creation_fails_with_insufficient_stock(): void
    {
        $response = $this->actingAs($this->buyer, 'sanctum')->postJson('/api/orders', [
            'product_id' => $this->product->id,
            'quantity' => 150, // > stock de 100
        ]);

        $response->assertStatus(422);

        $this->product->refresh();
        $this->assertSame(0, (int) $this->product->stock_reserve);
    }

    public function test_order_creation_fails_for_inactive_product(): void
    {
        $this->product->update(['statut' => 'disabled']);

        $response = $this->actingAs($this->buyer, 'sanctum')->postJson('/api/orders', [
            'product_id' => $this->product->id,
            'quantity' => 5,
        ]);

        $response->assertStatus(422);
    }

    public function test_full_escrow_lifecycle_lock_to_complete_consumes_stock(): void
    {
        $order = Order::factory()->create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->sellerProfile->id,
            'escrow_status' => Order::STATUS_PENDING,
        ]);
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'seller_id' => $this->sellerProfile->id,
            'quantite' => 10,
            'prix_unitaire' => $this->product->prix,
            'sous_total' => $this->product->prix * 10,
        ]);
        $this->product->reserverStock(10);

        $seller = $this->sellerProfile->user;

        // Verrouillage escrow
        $this->actingAs($seller, 'sanctum')
            ->putJson("/api/orders/{$order->id}", ['escrow_status' => Order::STATUS_ESCROW_LOCKED])
            ->assertOk()
            ->assertJsonPath('data.escrow_status', Order::STATUS_ESCROW_LOCKED);

        // En préparation
        $this->actingAs($seller, 'sanctum')
            ->putJson("/api/orders/{$order->id}", ['escrow_status' => Order::STATUS_EN_PREPARATION])
            ->assertOk();

        // Livré — doit consommer le stock
        $this->actingAs($seller, 'sanctum')
            ->putJson("/api/orders/{$order->id}", ['escrow_status' => Order::STATUS_LIVRE])
            ->assertOk()
            ->assertJsonPath('data.escrow_status', Order::STATUS_LIVRE);

        $this->product->refresh();
        $this->assertSame(90, (int) $this->product->stock, 'Le stock réel doit être décrémenté');
        $this->assertSame(0, (int) $this->product->stock_reserve, 'Le stock réservé doit être libéré');
    }

    public function test_cancelled_order_restores_reserved_stock(): void
    {
        $order = Order::factory()->create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->sellerProfile->id,
            'escrow_status' => Order::STATUS_PENDING,
        ]);
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'seller_id' => $this->sellerProfile->id,
            'quantite' => 15,
        ]);
        $this->product->reserverStock(15);
        $this->assertSame(15, (int) $this->product->fresh()->stock_reserve);

        $this->actingAs($this->buyer, 'sanctum')
            ->deleteJson("/api/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->product->refresh();
        $this->assertSame(0, (int) $this->product->stock_reserve, 'Stock réservé restauré');
        $this->assertSame(100, (int) $this->product->stock, 'Stock réel intact');
        $this->assertSame(Order::STATUS_ANNULE, $order->fresh()->escrow_status);
    }

    public function test_non_participant_cannot_view_order(): void
    {
        $order = Order::factory()->create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->sellerProfile->id,
        ]);

        $intruder = User::factory()->buyer()->create();

        $this->actingAs($intruder, 'sanctum')
            ->getJson("/api/orders/{$order->id}")
            ->assertForbidden();
    }

    public function test_unauthenticated_user_cannot_create_order(): void
    {
        $this->postJson('/api/orders', [
            'product_id' => $this->product->id,
            'quantity' => 1,
        ])->assertUnauthorized();
    }
}
