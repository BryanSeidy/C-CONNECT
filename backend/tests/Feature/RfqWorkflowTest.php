<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Rfq;
use App\Models\RfqBid;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RfqWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $buyer;
    private User $seller;
    private SellerProfile $sellerProfile;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->buyer = User::factory()->buyer()->create();
        $this->seller = User::factory()->seller()->create();
        $this->sellerProfile = SellerProfile::factory()->for($this->seller)->create();
        $this->category = Category::factory()->create();
    }

    public function test_buyer_can_create_rfq(): void
    {
        $response = $this->actingAs($this->buyer, 'sanctum')->postJson('/api/rfqs', [
            'titre' => 'Achat de 500kg de café',
            'description' => 'Recherche café arabica de qualité export',
            'category_id' => $this->category->id,
            'quantite' => 500,
            'unite' => 'kg',
            'budget_max' => 1500000,
            'region_livraison' => 'Littoral',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.statut', 'active');

        $this->assertDatabaseHas('rfqs', [
            'titre' => 'Achat de 500kg de café',
            'buyer_id' => $this->buyer->id,
        ]);
    }

    public function test_seller_cannot_create_rfq(): void
    {
        $response = $this->actingAs($this->seller, 'sanctum')->postJson('/api/rfqs', [
            'titre' => 'Test',
            'description' => 'desc',
            'quantite' => 100,
            'unite' => 'kg',
        ]);

        $response->assertForbidden();
    }

    public function test_seller_can_bid_on_rfq(): void
    {
        $rfq = Rfq::factory()->create([
            'buyer_id' => $this->buyer->id,
            'category_id' => $this->category->id,
            'statut' => 'active',
        ]);

        $response = $this->actingAs($this->seller, 'sanctum')
            ->postJson("/api/rfqs/{$rfq->id}/bids", [
                'prix_unitaire_propose' => 3000,
                'quantite_disponible' => 500,
                'message' => 'Stock disponible immédiatement',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.statut', 'en_attente');

        $rfq->refresh();
        $this->assertSame(1, (int) $rfq->nombre_offres);
    }

    public function test_seller_cannot_bid_twice_on_same_rfq(): void
    {
        $rfq = Rfq::factory()->create([
            'buyer_id' => $this->buyer->id,
            'category_id' => $this->category->id,
            'statut' => 'active',
        ]);

        $this->actingAs($this->seller, 'sanctum')
            ->postJson("/api/rfqs/{$rfq->id}/bids", [
                'prix_unitaire_propose' => 3000,
                'quantite_disponible' => 500,
            ])
            ->assertCreated();

        $this->actingAs($this->seller, 'sanctum')
            ->postJson("/api/rfqs/{$rfq->id}/bids", [
                'prix_unitaire_propose' => 2800,
                'quantite_disponible' => 500,
            ])
            ->assertStatus(422);
    }

    public function test_buyer_can_accept_bid_and_others_are_rejected(): void
    {
        $rfq = Rfq::factory()->create([
            'buyer_id' => $this->buyer->id,
            'category_id' => $this->category->id,
            'statut' => 'active',
        ]);

        $bid1 = RfqBid::factory()->create([
            'rfq_id' => $rfq->id,
            'seller_id' => $this->sellerProfile->id,
            'statut' => 'en_attente',
        ]);

        $seller2 = User::factory()->seller()->create();
        $profile2 = SellerProfile::factory()->for($seller2)->create();
        $bid2 = RfqBid::factory()->create([
            'rfq_id' => $rfq->id,
            'seller_id' => $profile2->id,
            'statut' => 'en_attente',
        ]);

        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/rfqs/{$rfq->id}/bids/{$bid1->id}/accept")
            ->assertOk()
            ->assertJsonPath('data.statut', 'acceptee');

        $bid2->refresh();
        $this->assertSame('refusee', $bid2->statut, 'Les autres offres doivent être refusées automatiquement');
    }

    public function test_non_owner_cannot_accept_bid(): void
    {
        $rfq = Rfq::factory()->create([
            'buyer_id' => $this->buyer->id,
            'category_id' => $this->category->id,
            'statut' => 'active',
        ]);
        $bid = RfqBid::factory()->create([
            'rfq_id' => $rfq->id,
            'seller_id' => $this->sellerProfile->id,
        ]);

        $otherBuyer = User::factory()->buyer()->create();

        $this->actingAs($otherBuyer, 'sanctum')
            ->postJson("/api/rfqs/{$rfq->id}/bids/{$bid->id}/accept")
            ->assertForbidden();
    }

    public function test_buyer_can_cancel_own_rfq(): void
    {
        $rfq = Rfq::factory()->create([
            'buyer_id' => $this->buyer->id,
            'category_id' => $this->category->id,
            'statut' => 'active',
        ]);

        $this->actingAs($this->buyer, 'sanctum')
            ->deleteJson("/api/rfqs/{$rfq->id}")
            ->assertOk();

        $this->assertSame('annulee', $rfq->fresh()->statut);
    }
}
