<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Dispute;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DisputeWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $buyer;
    private User $seller;
    private User $admin;
    private SellerProfile $sellerProfile;
    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->buyer = User::factory()->buyer()->create();
        $this->seller = User::factory()->seller()->create();
        $this->admin = User::factory()->admin()->create();
        $this->sellerProfile = SellerProfile::factory()->for($this->seller)->create();

        $this->order = Order::factory()->create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->sellerProfile->id,
            'escrow_status' => Order::STATUS_ESCROW_LOCKED,
            'montant_total' => 50000,
            'montant_vendeur' => 45000,
            'commission_plateforme' => 5000,
        ]);
    }

    public function test_buyer_can_open_dispute(): void
    {
        $response = $this->actingAs($this->buyer, 'sanctum')->postJson('/api/disputes', [
            'order_id' => $this->order->id,
            'raison' => 'marchandise_non_recue',
            'description' => 'La commande n\'est jamais arrivée malgré le paiement.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.statut', 'ouvert');

        $this->assertSame(Order::STATUS_DISPUTE, $this->order->fresh()->escrow_status);
    }

    public function test_seller_can_open_dispute(): void
    {
        $response = $this->actingAs($this->seller, 'sanctum')->postJson('/api/disputes', [
            'order_id' => $this->order->id,
            'raison' => 'autre',
            'description' => 'Litige ouvert par le vendeur.',
        ]);

        $response->assertCreated();
    }

    public function test_non_participant_cannot_open_dispute(): void
    {
        $intruder = User::factory()->buyer()->create();

        $this->actingAs($intruder, 'sanctum')
            ->postJson('/api/disputes', [
                'order_id' => $this->order->id,
                'raison' => 'autre',
                'description' => 'Tentative frauduleuse',
            ])
            ->assertForbidden();
    }

    public function test_cannot_open_dispute_on_completed_order(): void
    {
        $this->order->update(['escrow_status' => Order::STATUS_COMPLETE]);

        $this->actingAs($this->buyer, 'sanctum')
            ->postJson('/api/disputes', [
                'order_id' => $this->order->id,
                'raison' => 'autre',
                'description' => 'Trop tard',
            ])
            ->assertStatus(422);
    }

    public function test_admin_can_resolve_dispute_with_refund(): void
    {
        $dispute = Dispute::factory()->create([
            'order_id' => $this->order->id,
            'initiateur_id' => $this->buyer->id,
            'statut' => 'ouvert',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/disputes/{$dispute->id}/resolve", [
                'decision' => 'rembourser',
                'notes_resolution' => 'Remboursement accordé à l\'acheteur.',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.statut', 'resolu_rembourse');

        $this->assertSame(Order::STATUS_ANNULE, $this->order->fresh()->escrow_status);
        $dispute->refresh();
        $this->assertSame($this->admin->id, $dispute->resolu_par);
    }

    public function test_admin_can_resolve_dispute_with_release(): void
    {
        $dispute = Dispute::factory()->create([
            'order_id' => $this->order->id,
            'initiateur_id' => $this->buyer->id,
            'statut' => 'ouvert',
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/disputes/{$dispute->id}/resolve", [
                'decision' => 'liberer',
                'notes_resolution' => 'Fonds libérés au vendeur.',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.statut', 'resolu_libere');

        $this->assertSame(Order::STATUS_COMPLETE, $this->order->fresh()->escrow_status);
    }

    public function test_non_admin_cannot_resolve_dispute(): void
    {
        $dispute = Dispute::factory()->create([
            'order_id' => $this->order->id,
            'initiateur_id' => $this->buyer->id,
            'statut' => 'ouvert',
        ]);

        $this->actingAs($this->buyer, 'sanctum')
            ->postJson("/api/disputes/{$dispute->id}/resolve", [
                'decision' => 'liberer',
                'notes_resolution' => 'auto-resolution',
            ])
            ->assertForbidden();
    }
}
