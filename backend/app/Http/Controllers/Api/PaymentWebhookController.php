<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Events\OrderCompleted;
use App\Http\Controllers\Controller;
use App\Jobs\SendOrderNotificationJob;
use App\Models\Order;
use App\Models\PaymentEvent;
use App\Services\OrangeMoneyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use RuntimeException;

/**
 * PaymentWebhookController
 *
 * - initiate : démarre un paiement Mobile Money (OMAPI Orange réel si configuré,
 *   sinon simulation ; MTN reste en simulation jusqu'à intégration dédiée).
 * - status   : polling du statut (appelle /mp/paymentstatus pour Orange).
 * - __invoke : webhooks agrégateurs (Campay / NotchPay / MonBillet).
 * - orangeNotify : callback notifUrl OMAPI.
 */
class PaymentWebhookController extends Controller
{
    private const AMOUNT_TOLERANCE = 1.0;

    public function __construct(
        private readonly OrangeMoneyService $orangeMoney,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        if (!$this->hasValidSignature($request)) {
            Log::warning('[Webhook] Signature invalide', ['ip' => $request->ip()]);
            return response()->json(['message' => 'Signature invalide.'], 401);
        }

        $validated = $request->validate([
            'provider'              => ['required', 'string', Rule::in(['campay', 'notchpay', 'monbillet'])],
            'payment_method'        => ['required', 'string', Rule::in(['mtn_momo', 'orange_money'])],
            'transaction_reference' => ['required', 'string', 'max:255'],
            'status'                => ['required', 'string', Rule::in(['successful', 'success', 'paid', 'SUCCESSFUL'])],
            'amount'                => ['required', 'numeric', 'min:1'],
            'phone'                 => ['nullable', 'string', 'max:20'],
            'currency'              => ['nullable', 'string', Rule::in(['XAF', 'FCFA', 'CFA'])],
        ]);

        $existingOrder = Order::where('transaction_reference', $validated['transaction_reference'])
            ->where('escrow_status', '!=', Order::STATUS_PENDING)
            ->first();

        if ($existingOrder) {
            return response()->json([
                'message' => 'Transaction deja traitee.',
                'data'    => ['order_status' => $existingOrder->escrow_status],
            ]);
        }

        try {
            $order = $this->processPayment($validated);
        } catch (\Throwable $e) {
            $this->persistOffline($validated, $e);
            return response()->json(['message' => 'Paiement enregistre en mode resilient.'], 200);
        }

        if ($order === null) {
            return response()->json(['message' => 'Commande introuvable ou montant incorrect.'], 422);
        }

        $this->dispatchPaymentSuccess($order);

        return response()->json([
            'message' => 'Paiement traite avec succes.',
            'data'    => [
                'order_id'     => $order->id,
                'order_status' => $order->escrow_status,
            ],
        ]);
    }

    /**
     * Callback notifUrl OMAPI (souvent HTTP, payload variable).
     * POST /api/webhooks/payments/orange
     */
    public function orangeNotify(Request $request): JsonResponse
    {
        $payload = $request->all();

        PaymentEvent::log([
            'event_type' => PaymentEvent::TYPE_WEBHOOK_RECEIVED,
            'provider' => 'orange_money',
            'payment_method' => 'orange_money',
            'payload_snapshot' => $payload,
            'source_ip' => $request->ip(),
            'success' => true,
            'status' => 'received',
        ]);

        $payToken = (string) (
            $payload['payToken']
            ?? $payload['paytoken']
            ?? $payload['data']['payToken']
            ?? $request->query('payToken', '')
        );

        if ($payToken === '') {
            Log::warning('[OrangeMoney] notifUrl sans payToken', ['payload' => $payload]);
            return response()->json(['message' => 'payToken manquant.'], 422);
        }

        $order = Order::where('pay_token', $payToken)->first();
        if ($order === null) {
            return response()->json(['message' => 'Commande introuvable pour ce payToken.'], 404);
        }

        if ($order->escrow_status !== Order::STATUS_PENDING) {
            return response()->json([
                'message' => 'Transaction deja traitee.',
                'data' => ['order_status' => $order->escrow_status],
            ]);
        }

        $status = $this->orangeMoney->interpretStatus($payload);

        // Si le webhook est ambigu, on re-vérifie auprès de l'API status
        if ($status === 'pending' && $this->orangeMoney->isConfigured()) {
            try {
                $remote = $this->orangeMoney->getPaymentStatus($payToken);
                $status = $this->orangeMoney->interpretStatus($remote);
                $payload = array_merge($payload, ['status_check' => $remote]);
            } catch (\Throwable $e) {
                Log::warning('[OrangeMoney] status check depuis notifUrl échoué', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($status === 'successful') {
            $txnId = $this->orangeMoney->extractTxnId($payload) ?? $order->transaction_reference;
            $this->lockEscrowFromOrange($order, $txnId, $payload);
            $this->dispatchPaymentSuccess($order->fresh());

            return response()->json(['message' => 'Paiement Orange confirme.', 'status' => 'successful']);
        }

        if ($status === 'failed') {
            $order->update(['payment_status' => 'failed']);
            PaymentEvent::log([
                'order_id' => $order->id,
                'event_type' => PaymentEvent::TYPE_WEBHOOK_PROCESSED,
                'provider' => 'orange_money',
                'payment_method' => 'orange_money',
                'transaction_reference' => $order->transaction_reference,
                'status' => 'failed',
                'payload_snapshot' => $payload,
                'success' => false,
            ]);

            return response()->json(['message' => 'Paiement Orange echoue.', 'status' => 'failed']);
        }

        return response()->json(['message' => 'Paiement Orange en attente.', 'status' => 'pending']);
    }

    /**
     * POST /api/payments/mobile-money/initiate
     */
    public function initiate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id'       => ['required', 'integer', 'exists:orders,id'],
            'phone'          => ['required', 'string', 'regex:/^\+237[0-9]{9}$/'],
            'payment_method' => ['required', 'string', Rule::in(['mtn_momo', 'orange_money'])],
        ]);

        $order = Order::where('id', $validated['order_id'])
            ->where('buyer_id', $request->user()->id)
            ->where('escrow_status', Order::STATUS_PENDING)
            ->firstOrFail();

        $useOrangeApi = $validated['payment_method'] === 'orange_money'
            && (bool) config('services.orange_money.enabled', true)
            && $this->orangeMoney->isConfigured();

        if ($useOrangeApi) {
            return $this->initiateOrangeMoney($order, $validated['phone']);
        }

        return $this->initiateSimulation($order, $validated['phone'], $validated['payment_method']);
    }

    /**
     * GET /api/payments/mobile-money/status?order_id=
     * Polling front : pour Orange, appelle /mp/paymentstatus.
     */
    public function status(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'integer', 'exists:orders,id'],
        ]);

        $order = Order::where('id', $validated['order_id'])
            ->where('buyer_id', $request->user()->id)
            ->firstOrFail();

        if ($order->escrow_status !== Order::STATUS_PENDING) {
            return response()->json([
                'success' => true,
                'data' => [
                    'status' => $order->payment_status === 'paid' || $order->escrow_status === Order::STATUS_ESCROW_LOCKED
                        ? 'successful'
                        : ($order->payment_status ?? $order->escrow_status),
                    'order_status' => $order->escrow_status,
                    'transaction_reference' => $order->transaction_reference,
                    'pay_token' => $order->pay_token,
                ],
            ]);
        }

        // Orange réel : interroger OMAPI
        if (
            $order->payment_provider === 'orange_money'
            && $order->pay_token
            && $this->orangeMoney->isConfigured()
        ) {
            try {
                $remote = $this->orangeMoney->getPaymentStatus($order->pay_token);
                $status = $this->orangeMoney->interpretStatus($remote);

                PaymentEvent::log([
                    'order_id' => $order->id,
                    'event_type' => PaymentEvent::TYPE_STATUS_POLL,
                    'provider' => 'orange_money',
                    'payment_method' => 'orange_money',
                    'transaction_reference' => $order->transaction_reference,
                    'status' => $status,
                    'payload_snapshot' => $remote,
                    'success' => $status === 'successful',
                ]);

                if ($status === 'successful') {
                    $txnId = $this->orangeMoney->extractTxnId($remote) ?? $order->transaction_reference;
                    $this->lockEscrowFromOrange($order, $txnId, $remote);
                    $order = $order->fresh();
                    $this->dispatchPaymentSuccess($order);
                } elseif ($status === 'failed') {
                    $order->update(['payment_status' => 'failed']);
                }

                return response()->json([
                    'success' => true,
                    'data' => [
                        'status' => $status,
                        'order_status' => $order->escrow_status,
                        'transaction_reference' => $order->transaction_reference,
                        'pay_token' => $order->pay_token,
                        'provider_payload' => $remote,
                    ],
                ]);
            } catch (\Throwable $e) {
                Log::warning('[OrangeMoney] Polling status échoué', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage(),
                ]);

                return response()->json([
                    'success' => true,
                    'data' => [
                        'status' => 'pending',
                        'order_status' => $order->escrow_status,
                        'transaction_reference' => $order->transaction_reference,
                        'pay_token' => $order->pay_token,
                        'message' => 'Statut temporairement indisponible, nouvel essai...',
                    ],
                ]);
            }
        }

        // Simulation / MTN : toujours pending jusqu'à processMobileMoney ou webhook
        return response()->json([
            'success' => true,
            'data' => [
                'status' => $order->payment_status ?? 'pending',
                'order_status' => $order->escrow_status,
                'transaction_reference' => $order->transaction_reference,
                'pay_token' => $order->pay_token,
                'mode' => 'simulation',
            ],
        ]);
    }

    // ── Initiation ────────────────────────────────────────────────────────────

    private function initiateOrangeMoney(Order $order, string $phone): JsonResponse
    {
        $transactionRef = 'CCX-'.strtoupper(substr(md5(uniqid((string) mt_rand(), true)), 0, 12));
        $merchantOrderId = 'CC'.$order->id;
        $notifUrl = url('/api/webhooks/payments/orange');

        try {
            $result = $this->orangeMoney->initiateMerchantPayment(
                subscriberMsisdn: $phone,
                amount: $order->montant_total,
                orderId: $merchantOrderId,
                description: 'C-Connect commande #'.$order->id,
                notifUrl: $notifUrl,
            );
        } catch (RuntimeException $e) {
            PaymentEvent::log([
                'order_id' => $order->id,
                'event_type' => PaymentEvent::TYPE_INITIATION,
                'provider' => 'orange_money',
                'payment_method' => 'orange_money',
                'transaction_reference' => $transactionRef,
                'amount' => $order->montant_total,
                'status' => 'error',
                'success' => false,
                'error_message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Impossible d\'initier le paiement Orange Money.',
                'error' => $e->getMessage(),
            ], 502);
        }

        $order->update([
            'transaction_reference' => $transactionRef,
            'payment_provider' => 'orange_money',
            'telephone_livraison' => $phone,
            'pay_token' => $result['pay_token'],
            'payment_status' => 'pending_confirmation',
        ]);

        PaymentEvent::log([
            'order_id' => $order->id,
            'event_type' => PaymentEvent::TYPE_INITIATION,
            'provider' => 'orange_money',
            'payment_method' => 'orange_money',
            'transaction_reference' => $transactionRef,
            'amount' => $order->montant_total,
            'status' => 'pending_confirmation',
            'payload_snapshot' => [
                'pay_token' => $result['pay_token'],
                'pay' => $result['pay'],
                'push' => $result['push'],
            ],
            'success' => true,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'transaction_reference' => $transactionRef,
                'pay_token' => $result['pay_token'],
                'amount' => $order->montant_total,
                'currency' => 'XAF',
                'payment_method' => 'orange_money',
                'mode' => 'omapi',
                'status' => 'pending_confirmation',
                'instructions' => 'Validez le message de debit Orange Money en tapant votre code PIN sur votre telephone.',
                'order_id' => $order->id,
                'poll_url' => '/api/payments/mobile-money/status?order_id='.$order->id,
            ],
        ]);
    }

    private function initiateSimulation(Order $order, string $phone, string $paymentMethod): JsonResponse
    {
        $transactionRef = 'CCX-'.strtoupper(substr(md5(uniqid((string) mt_rand(), true)), 0, 12));

        $order->update([
            'transaction_reference' => $transactionRef,
            'payment_provider' => $paymentMethod,
            'telephone_livraison' => $phone,
            'pay_token' => null,
            'payment_status' => 'pending',
        ]);

        $instructions = match ($paymentMethod) {
            'mtn_momo' => 'Validez le message de debit MTN MoMo en tapant votre code PIN.',
            'orange_money' => 'Validez le message de debit Orange Money en tapant votre code PIN. (mode simulation — cles OMAPI absentes)',
            default => 'Validez la demande de paiement sur votre telephone.',
        };

        PaymentEvent::log([
            'order_id' => $order->id,
            'event_type' => PaymentEvent::TYPE_INITIATION,
            'provider' => $paymentMethod,
            'payment_method' => $paymentMethod,
            'transaction_reference' => $transactionRef,
            'amount' => $order->montant_total,
            'status' => 'simulation',
            'success' => true,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'transaction_reference' => $transactionRef,
                'amount' => $order->montant_total,
                'currency' => 'XAF',
                'payment_method' => $paymentMethod,
                'mode' => 'simulation',
                'status' => 'pending',
                'instructions' => $instructions,
                'order_id' => $order->id,
            ],
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * @param array<string, mixed> $payload
     */
    private function lockEscrowFromOrange(Order $order, string $txnId, array $payload): void
    {
        DB::transaction(function () use ($order, $txnId, $payload): void {
            /** @var Order $locked */
            $locked = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            if ($locked->escrow_status !== Order::STATUS_PENDING) {
                return;
            }

            $locked->update([
                'escrow_status' => Order::STATUS_ESCROW_LOCKED,
                'payment_provider' => 'orange_money',
                'payment_reference' => $txnId,
                'transaction_reference' => $txnId,
                'payment_status' => 'paid',
                'paid_at' => now(),
                'synced' => true,
            ]);

            PaymentEvent::log([
                'order_id' => $locked->id,
                'event_type' => PaymentEvent::TYPE_WEBHOOK_PROCESSED,
                'provider' => 'orange_money',
                'payment_method' => 'orange_money',
                'transaction_reference' => $txnId,
                'amount' => $locked->montant_total,
                'status' => 'successful',
                'payload_snapshot' => $payload,
                'success' => true,
            ]);
        });
    }

    private function dispatchPaymentSuccess(Order $order): void
    {
        // Conservé tel quel : le webhook historique déclenche OrderCompleted
        // à la confirmation de paiement (escrow verrouillé).
        OrderCompleted::dispatch($order);

        if (class_exists(SendOrderNotificationJob::class)) {
            SendOrderNotificationJob::dispatch($order->id, 'escrow_locked')->onQueue('database');
        }
    }

    /**
     * @param array<string, mixed> $validated
     */
    private function processPayment(array $validated): ?Order
    {
        return DB::transaction(function () use ($validated): ?Order {
            /** @var Order|null $order */
            $order = Order::where('transaction_reference', $validated['transaction_reference'])
                ->lockForUpdate()
                ->first();

            if ($order === null) {
                $order = Order::where('escrow_status', Order::STATUS_PENDING)
                    ->where('montant_total', $validated['amount'])
                    ->lockForUpdate()
                    ->first();
            }

            if ($order === null) {
                return null;
            }

            if ($order->escrow_status !== Order::STATUS_PENDING) {
                return $order;
            }

            $amountDiff = abs((float) $order->montant_total - (float) $validated['amount']);
            if ($amountDiff > self::AMOUNT_TOLERANCE) {
                Log::warning('[Webhook] Montant incorrect', [
                    'attendu' => $order->montant_total,
                    'recu' => $validated['amount'],
                    'diff' => $amountDiff,
                ]);
                return null;
            }

            $order->update([
                'escrow_status' => Order::STATUS_ESCROW_LOCKED,
                'payment_provider' => $validated['provider'],
                'payment_reference' => $validated['transaction_reference'],
                'transaction_reference' => $validated['transaction_reference'],
                'payment_status' => 'paid',
                'paid_at' => now(),
                'synced' => true,
            ]);

            return $order->refresh();
        });
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function persistOffline(array $payload, \Throwable $reason): void
    {
        Log::error('[Webhook] Fallback offline declenche', [
            'reason' => $reason->getMessage(),
            'payload' => $payload,
        ]);

        $sqlitePath = database_path('local_backup.sqlite');
        if (!file_exists($sqlitePath)) {
            touch($sqlitePath);
        }

        Config::set('database.connections.sqlite.database', $sqlitePath);

        try {
            DB::connection('sqlite')->table('webhook_queue')->insertOrIgnore([
                'sync_ref' => 'WHK-'.uniqid(),
                'provider' => $payload['provider'] ?? 'unknown',
                'transaction_reference' => $payload['transaction_reference'] ?? '',
                'amount' => $payload['amount'] ?? 0,
                'payload_json' => json_encode($payload),
                'synced' => false,
                'created_at' => now()->toDateTimeString(),
            ]);
        } catch (\Throwable $e) {
            Log::critical('[Webhook] Impossible de persister offline', ['error' => $e->getMessage()]);
        }
    }

    private function hasValidSignature(Request $request): bool
    {
        $secret = (string) config('services.cconnect_webhooks.secret', '');
        $signature = (string) $request->header('X-CConnect-Signature', '');

        if ($secret === '' || $signature === '') {
            return app()->environment('local', 'testing');
        }

        $expected = hash_hmac('sha256', $request->getContent(), $secret);

        return hash_equals($expected, $signature);
    }
}
