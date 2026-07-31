<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Order;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PaymentWebhookTest extends TestCase
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
    }

    public function test_buyer_can_initiate_payment(): void
    {
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
                'payment_method' => 'mtn_momo',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => ['transaction_reference', 'amount', 'currency', 'payment_method', 'instructions', 'order_id'],
            ]);

        $order->refresh();
        $this->assertNotNull($order->transaction_reference);
        $this->assertSame('mtn_momo', $order->payment_provider);
    }

    public function test_non_owner_cannot_initiate_payment(): void
    {
        $order = Order::factory()->create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->sellerProfile->id,
            'escrow_status' => Order::STATUS_PENDING,
        ]);

        $otherBuyer = User::factory()->buyer()->create();

        $this->actingAs($otherBuyer, 'sanctum')
            ->postJson('/api/payments/mobile-money/initiate', [
                'order_id' => $order->id,
                'phone' => '+237699123456',
                'payment_method' => 'mtn_momo',
            ])
            ->assertNotFound(); // firstOrFail returns 404 when scoped query finds nothing
    }

    public function test_webhook_locks_escrow_with_valid_signature(): void
    {
        // Configurer un secret de webhook pour les tests
        Config::set('services.cconnect_webhooks.secret', 'test-secret-key');

        $order = Order::factory()->create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->sellerProfile->id,
            'escrow_status' => Order::STATUS_PENDING,
            'montant_total' => 15000,
            'transaction_reference' => 'TXN-WEBHOOK-001',
        ]);

        $payload = [
            'provider' => 'campay',
            'payment_method' => 'mtn_momo',
            'transaction_reference' => 'TXN-WEBHOOK-001',
            'status' => 'successful',
            'amount' => 15000,
            'phone' => '+237699123456',
            'currency' => 'XAF',
        ];

        $payloadJson = json_encode($payload);
        $signature = hash_hmac('sha256', $payloadJson, 'test-secret-key');

        $response = $this->call(
            'POST',
            '/api/webhooks/payments',
            $payload,
            [],
            [],
            ['HTTP_X-CConnect-Signature' => $signature, 'CONTENT_TYPE' => 'application/json'],
            $payloadJson
        );

        $response->assertOk();
        $order->refresh();
        $this->assertSame(Order::STATUS_ESCROW_LOCKED, $order->escrow_status);
        $this->assertSame('paid', $order->payment_status);
        $this->assertNotNull($order->paid_at);
    }

    public function test_webhook_is_idempotent(): void
    {
        Config::set('services.cconnect_webhooks.secret', 'test-secret-key');

        $order = Order::factory()->create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->sellerProfile->id,
            'escrow_status' => Order::STATUS_ESCROW_LOCKED,
            'montant_total' => 15000,
            'transaction_reference' => 'TXN-IDEM-001',
            'payment_reference' => 'TXN-IDEM-001',
            'payment_status' => 'paid',
            'paid_at' => now(),
        ]);

        $payload = [
            'provider' => 'campay',
            'payment_method' => 'mtn_momo',
            'transaction_reference' => 'TXN-IDEM-001',
            'status' => 'successful',
            'amount' => 15000,
            'currency' => 'XAF',
        ];

        $payloadJson = json_encode($payload);
        $signature = hash_hmac('sha256', $payloadJson, 'test-secret-key');

        $response = $this->call(
            'POST',
            '/api/webhooks/payments',
            $payload,
            [],
            [],
            ['HTTP_X-CConnect-Signature' => $signature, 'CONTENT_TYPE' => 'application/json'],
            $payloadJson
        );

        $response->assertOk()
            ->assertJsonPath('message', 'Transaction deja traitee.');

        // L'état ne doit pas avoir changé (toujours escrow_locked)
        $this->assertSame(Order::STATUS_ESCROW_LOCKED, $order->fresh()->escrow_status);
    }

    public function test_webhook_rejects_invalid_signature(): void
    {
        Config::set('services.cconnect_webhooks.secret', 'real-secret');

        $payload = [
            'provider' => 'campay',
            'payment_method' => 'mtn_momo',
            'transaction_reference' => 'TXN-BAD-SIG',
            'status' => 'successful',
            'amount' => 1000,
        ];

        $payloadJson = json_encode($payload);

        $response = $this->call(
            'POST',
            '/api/webhooks/payments',
            $payload,
            [],
            [],
            ['HTTP_X-CConnect-Signature' => 'invalid-signature', 'CONTENT_TYPE' => 'application/json'],
            $payloadJson
        );

        $response->assertStatus(401);
    }

    public function test_webhook_rejects_incorrect_amount(): void
    {
        Config::set('services.cconnect_webhooks.secret', 'test-secret-key');

        $order = Order::factory()->create([
            'buyer_id' => $this->buyer->id,
            'seller_id' => $this->sellerProfile->id,
            'escrow_status' => Order::STATUS_PENDING,
            'montant_total' => 15000,
            'transaction_reference' => 'TXN-AMT-001',
        ]);

        $payload = [
            'provider' => 'campay',
            'payment_method' => 'mtn_momo',
            'transaction_reference' => 'TXN-AMT-001',
            'status' => 'successful',
            'amount' => 5000, // montant incorrect
            'currency' => 'XAF',
        ];

        $payloadJson = json_encode($payload);
        $signature = hash_hmac('sha256', $payloadJson, 'test-secret-key');

        $response = $this->call(
            'POST',
            '/api/webhooks/payments',
            $payload,
            [],
            [],
            ['HTTP_X-CConnect-Signature' => $signature, 'CONTENT_TYPE' => 'application/json'],
            $payloadJson
        );

        $response->assertStatus(422);
        $this->assertSame(Order::STATUS_PENDING, $order->fresh()->escrow_status);
    }
}
