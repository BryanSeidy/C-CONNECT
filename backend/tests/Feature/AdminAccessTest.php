<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Dispute;
use App\Models\Order;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $buyer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
        $this->buyer = User::factory()->buyer()->create();
    }

    public function test_admin_can_view_stats(): void
    {
        Order::factory()->count(3)->create();
        Company::factory()->count(2)->create();

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/admin/stats')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'total_orders',
                    'total_companies',
                    'total_users',
                    'total_buyers',
                    'total_sellers',
                    'commission_total',
                    'disputes_open',
                ],
            ]);
    }

    public function test_non_admin_cannot_view_stats(): void
    {
        $this->actingAs($this->buyer, 'sanctum')
            ->getJson('/api/admin/stats')
            ->assertForbidden();
    }

    public function test_admin_can_list_users(): void
    {
        User::factory()->count(5)->create();

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_admin_can_list_disputes(): void
    {
        $order = Order::factory()->create(['buyer_id' => $this->buyer->id]);
        Dispute::factory()->count(2)->create(['order_id' => $order->id]);

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/admin/disputes')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_admin_can_list_companies(): void
    {
        Company::factory()->count(3)->create();

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/admin/companies')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_unauthenticated_cannot_access_admin_routes(): void
    {
        $this->getJson('/api/admin/stats')->assertUnauthorized();
        $this->getJson('/api/admin/users')->assertUnauthorized();
        $this->getJson('/api/admin/disputes')->assertUnauthorized();
        $this->getJson('/api/admin/companies')->assertUnauthorized();
    }
}
