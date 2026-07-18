<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Order;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OrangeMoneyPaymentTest extends TestCase
{
    use RefreshDatabase;

    private User $buyer;
    private SellerProfile $sellerProfile;

    protected function setUp(): void
    {
        parent::setUp();

        $this->buyer = User::factory()->buyer()->create();
        $seller = User::factory()->seller()->create();
        $this->sellerProfile = SellerProfile::factory()->for($seller)->create();

        Cache::flush();

        Config::set('services.orange_money', [
            'base_url' => 'https://api-s1.orange.cm',
            'auth_token' => 'test-x-auth-token',
            'consumer_key' => 'test-consumer-key',
            'consumer_secret' => 'test-consumer-secret',
            'channel_msisdn' => '691301143',
            'pin' => '2222',
            'mode' => 'sandbox',
            'enabled' => true,
        ]);
    }

    public function test_orange_initiate_calls_omapi_init_pay_push(): void
    {
        Http::fake([
            'https://api-s1.orange.cm/token' => Http::response([
                'access_token' => 'tok-abc',
                'expires_in' => 3600,
                'token_type' => 'Bearer',
            ], 200),
            'https://api-s1.orange.cm/omcoreapis/1.0.2/mp/init' => Http::response([
                'payToken' => 'PAYTOKEN-TEST-123456',
            ], 200),
            'https://api-s1.orange.cm/omcoreapis/1.0.2/mp/pay' => Http::response([
                'status' => 'PENDING',
                'inittxnstatus' => '200',
            ], 200),
            'https://api-s1.orange.cm/omcoreapis/1.0.2/mp/push/*' => Http::response([
                'status' => 'SENT',
            ], 200),
        ]);

        $order = Order::factory()->create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->sellerProfile->id,
            'escrow_status' => Order::STATUS_PENDING,
            'montant_total' => 15000,
        ]);

        $response = $this->actingAs($this->buyer, 'sanctum')
            ->postJson('/api/payments/mobile-money/initiate', [
                'order_id' => $order->id,
                'phone' => '+237699123456',
                'payment_method' => 'orange_money',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.mode', 'omapi')
            ->assertJsonPath('data.payment_method', 'orange_money')
            ->assertJsonPath('data.pay_token', 'PAYTOKEN-TEST-123456');

        $order->refresh();
        $this->assertSame('PAYTOKEN-TEST-123456', $order->pay_token);
        $this->assertSame('orange_money', $order->payment_provider);
        $this->assertSame('pending_confirmation', $order->payment_status);

        Http::assertSent(fn ($request) => $request->url() === 'https://api-s1.orange.cm/token');
        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/mp/init'));
        Http::assertSent(function ($request) {
            if (!str_ends_with($request->url(), '/mp/pay')) {
                return false;
            }
            $data = $request->data();

            return ($data['subscriberMsisdn'] ?? null) === '699123456'
                && ($data['channelUserMsisdn'] ?? null) === '691301143'
                && ($data['pin'] ?? null) === '2222'
                && ($data['amount'] ?? null) === '15000'
                && ($data['payToken'] ?? null) === 'PAYTOKEN-TEST-123456';
        });
        Http::assertSent(fn ($request) => str_contains($request->url(), '/mp/push/'));
    }

    public function test_orange_status_poll_locks_escrow_on_success(): void
    {
        Http::fake(function (\Illuminate\Http\Client\Request $request) {
            $url = $request->url();

            if (str_ends_with($url, '/token')) {
                return Http::response([
                    'access_token' => 'tok-abc',
                    'expires_in' => 3600,
                ], 200);
            }

            if (str_contains($url, '/mp/paymentstatus/')) {
                return Http::response([
                    'status' => 'SUCCESSFUL',
                    'txnid' => 'OM-TXN-999',
                    'confirmtxnstatus' => '200',
                ], 200);
            }

            return Http::response(['error' => 'unexpected '.$url], 500);
        });

        $order = Order::factory()->create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->sellerProfile->id,
            'escrow_status' => Order::STATUS_PENDING,
            'montant_total' => 15000,
            'payment_provider' => 'orange_money',
            'transaction_reference' => 'CCX-ORANGE001',
            'pay_token' => 'PAYTOKEN-POLL-1',
            'payment_status' => 'pending_confirmation',
        ]);

        $response = $this->actingAs($this->buyer, 'sanctum')
            ->getJson('/api/payments/mobile-money/status?order_id='.$order->id);

        $response->assertOk()
            ->assertJsonPath('data.status', 'successful');

        $order->refresh();
        $this->assertSame(Order::STATUS_ESCROW_LOCKED, $order->escrow_status);
        $this->assertSame('paid', $order->payment_status);
        $this->assertSame('OM-TXN-999', $order->payment_reference);
        $this->assertNotNull($order->paid_at);
    }

    public function test_orange_notif_url_locks_escrow(): void
    {
        $order = Order::factory()->create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->sellerProfile->id,
            'escrow_status' => Order::STATUS_PENDING,
            'montant_total' => 8000,
            'payment_provider' => 'orange_money',
            'transaction_reference' => 'CCX-NOTIF001',
            'pay_token' => 'PAYTOKEN-NOTIF-1',
            'payment_status' => 'pending_confirmation',
        ]);

        $response = $this->postJson('/api/webhooks/payments/orange', [
            'payToken' => 'PAYTOKEN-NOTIF-1',
            'status' => 'SUCCESSFUL',
            'txnid' => 'OM-NOTIF-42',
        ]);

        $response->assertOk()->assertJsonPath('status', 'successful');

        $order->refresh();
        $this->assertSame(Order::STATUS_ESCROW_LOCKED, $order->escrow_status);
        $this->assertSame('OM-NOTIF-42', $order->payment_reference);
    }

    public function test_orange_falls_back_to_simulation_without_consumer_keys(): void
    {
        Config::set('services.orange_money.consumer_key', '');
        Config::set('services.orange_money.consumer_secret', '');

        $order = Order::factory()->create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->sellerProfile->id,
            'escrow_status' => Order::STATUS_PENDING,
            'montant_total' => 5000,
        ]);

        $response = $this->actingAs($this->buyer, 'sanctum')
            ->postJson('/api/payments/mobile-money/initiate', [
                'order_id' => $order->id,
                'phone' => '+237699123456',
                'payment_method' => 'orange_money',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.mode', 'simulation');

        Http::assertNothingSent();
    }

    public function test_simulation_confirm_rejected_when_omapi_configured_for_orange(): void
    {
        $order = Order::factory()->create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->sellerProfile->id,
            'escrow_status' => Order::STATUS_PENDING,
            'montant_total' => 5000,
        ]);

        $this->actingAs($this->buyer, 'sanctum')
            ->postJson('/api/payments/mobile-money', [
                'order_id' => $order->id,
                'phone' => '+237699123456',
                'provider' => 'Orange',
            ])
            ->assertStatus(422);
    }
}
