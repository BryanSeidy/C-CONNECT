<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Negotiation;
use App\Models\Order;
use App\Models\Product;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Teste le flux critique négociation → commande où le prix négocié
 * doit être honoré (voir ISSUES-LOG 2026-07-11 — Claude2).
 */
class NegotiationOrderTest extends TestCase
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
        $this->sellerProfile = SellerProfile::factory()->for($seller)->create();
        $category = Category::factory()->create();

        $this->product = Product::factory()->create([
            'seller_id' => $this->sellerProfile->id,
            'category_id' => $category->id,
            'prix' => 5000, // prix catalogue
            'stock' => 100,
            'statut' => 'active',
        ]);
    }

    public function test_order_honors_negotiated_price_when_counter_price_exists(): void
    {
        // Négociation acceptée avec contre-offre du vendeur à 4000 (au lieu de 5000 catalogue)
        $negotiation = Negotiation::factory()->create([
            'product_id' => $this->product->id,
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->sellerProfile->id,
            'quantity' => 10,
            'proposed_price' => 3500,
            'counter_price' => 4000, // le vendeur a contre-proposé 4000
            'status' => 'ACCEPTED',
            'order_id' => null,
        ]);

        $response = $this->actingAs($this->buyer, 'sanctum')->postJson('/api/orders', [
            'product_id' => $this->product->id,
            'quantity' => 10,
            'negotiation_id' => $negotiation->id,
        ]);

        $response->assertCreated();

        // Le montant total doit être 4000 * 10 = 40000 (pas 5000 * 10 = 50000)
        $order = Order::find($response->json('data.id'));
        $this->assertSame('40000.00', (string) $order->montant_total);
        $this->assertSame('4000.00', (string) $order->items[0]->prix_unitaire);

        // Commission = 40000 * 10% = 4000, vendeur = 36000
        $this->assertSame('4000.00', (string) $order->commission_plateforme);
        $this->assertSame('36000.00', (string) $order->montant_vendeur);

        // La négociation doit être marquée comme convertie
        $negotiation->refresh();
        $this->assertNotNull($negotiation->order_id);
        $this->assertSame($order->id, $negotiation->order_id);
    }

    public function test_order_honors_proposed_price_when_no_counter(): void
    {
        // Négociation acceptée sans contre-offre : prix proposé = 4500
        $negotiation = Negotiation::factory()->create([
            'product_id' => $this->product->id,
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->sellerProfile->id,
            'quantity' => 5,
            'proposed_price' => 4500,
            'counter_price' => null,
            'status' => 'ACCEPTED',
            'order_id' => null,
        ]);

        $response = $this->actingAs($this->buyer, 'sanctum')->postJson('/api/orders', [
            'product_id' => $this->product->id,
            'quantity' => 5,
            'negotiation_id' => $negotiation->id,
        ]);

        $response->assertCreated();

        $order = Order::find($response->json('data.id'));
        $this->assertSame('22500.00', (string) $order->montant_total); // 4500 * 5
    }

    public function test_order_without_negotiation_uses_catalog_price(): void
    {
        $response = $this->actingAs($this->buyer, 'sanctum')->postJson('/api/orders', [
            'product_id' => $this->product->id,
            'quantity' => 10,
        ]);

        $response->assertCreated();

        $order = Order::find($response->json('data.id'));
        $this->assertSame('50000.00', (string) $order->montant_total); // 5000 * 10 (prix catalogue)
    }

    public function test_cannot_use_non_accepted_negotiation(): void
    {
        $negotiation = Negotiation::factory()->create([
            'product_id' => $this->product->id,
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->sellerProfile->id,
            'status' => 'PENDING',
            'order_id' => null,
        ]);

        $this->actingAs($this->buyer, 'sanctum')->postJson('/api/orders', [
            'product_id' => $this->product->id,
            'quantity' => 10,
            'negotiation_id' => $negotiation->id,
        ])->assertStatus(422);
    }

    public function test_cannot_reuse_already_converted_negotiation(): void
    {
        $existingOrder = Order::factory()->create(['buyer_id' => $this->buyer->id]);

        $negotiation = Negotiation::factory()->create([
            'product_id' => $this->product->id,
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->sellerProfile->id,
            'status' => 'ACCEPTED',
            'order_id' => $existingOrder->id, // déjà convertie
        ]);

        $this->actingAs($this->buyer, 'sanctum')->postJson('/api/orders', [
            'product_id' => $this->product->id,
            'quantity' => 10,
            'negotiation_id' => $negotiation->id,
        ])->assertStatus(422);
    }

    public function test_cannot_use_other_buyers_negotiation(): void
    {
        $otherBuyer = User::factory()->buyer()->create();

        $negotiation = Negotiation::factory()->create([
            'product_id' => $this->product->id,
            'buyer_id' => $otherBuyer->id, // appartient à un autre acheteur
            'seller_id' => $this->sellerProfile->id,
            'status' => 'ACCEPTED',
            'order_id' => null,
        ]);

        $this->actingAs($this->buyer, 'sanctum')->postJson('/api/orders', [
            'product_id' => $this->product->id,
            'quantity' => 10,
            'negotiation_id' => $negotiation->id,
        ])->assertStatus(422);
    }
}
