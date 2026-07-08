<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Events\OrderCompleted;
use App\Http\Controllers\Controller;
use App\Jobs\SendOrderNotificationJob;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * PaymentWebhookController
 *
 * Traite les webhooks de paiement Mobile Money des agregateurs camerounais
 * (Campay, Notch Pay, MonBillet).
 *
 * Idempotence stricte : une transaction_reference ne peut etre traitee qu'une
 * seule fois. Toute tentative de re-traitement retourne 200 OK immediatement.
 *
 * Resilience offline : si Neon est inaccessible, la mutation est enregistree
 * dans SQLite local avec synced = false pour reconciliation ulterieure.
 */
class PaymentWebhookController extends Controller
{
    // Ecart maximal tolere entre le montant recu et le montant attendu (XAF)
    private const AMOUNT_TOLERANCE = 1.0;

    public function __invoke(Request $request): JsonResponse
    {
        // Verification de la signature HMAC avant tout traitement
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

        // Idempotence : verifier si la transaction a deja ete traitee
        $existingOrder = Order::where('transaction_reference', $validated['transaction_reference'])
            ->where('escrow_status', '!=', 'pending')
            ->first();

        if ($existingOrder) {
            Log::info('[Webhook] Transaction deja traitee — reponse idempotente', [
                'ref'    => $validated['transaction_reference'],
                'status' => $existingOrder->escrow_status,
            ]);
            return response()->json([
                'message' => 'Transaction deja traitee.',
                'data'    => ['order_status' => $existingOrder->escrow_status],
            ]);
        }

        // Traitement principal : recherche et mise a jour de la commande
        try {
            $order = $this->processPayment($validated);
        } catch (\Throwable $e) {
            // Fallback offline : persister dans SQLite si Neon indisponible
            $this->persistOffline($validated, $e);
            return response()->json(['message' => 'Paiement enregistre en mode resilient.'], 200);
        }

        if ($order === null) {
            return response()->json(['message' => 'Commande introuvable ou montant incorrect.'], 422);
        }

        // Declencher les evenements metier
        OrderCompleted::dispatch($order);

        if (class_exists(SendOrderNotificationJob::class)) {
            SendOrderNotificationJob::dispatch($order->id, 'escrow_locked')->onQueue('database');
        }

        return response()->json([
            'message' => 'Paiement traite avec succes.',
            'data'    => [
                'order_id'     => $order->id,
                'order_status' => $order->escrow_status,
            ],
        ]);
    }

    // ── Initiation du paiement Mobile Money depuis le frontend ────────────────

    /**
     * POST /api/payment/mobile-money
     * Declenche une demande de paiement via l'agregateur configure.
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

        // Generer une reference unique pour cette transaction
        $transactionRef = 'CCX-' . strtoupper(substr(md5(uniqid((string) mt_rand(), true)), 0, 12));

        $order->update([
            'transaction_reference' => $transactionRef,
            'payment_provider'      => $validated['payment_method'],
            'telephone_livraison'   => $validated['phone'],
        ]);

        // En production : appel reel vers Campay ou Notch Pay
        // Ici, on simule l'initiation et on retourne les instructions a l'utilisateur
        $instructions = match ($validated['payment_method']) {
            'mtn_momo'     => 'Validez le message de debit MTN MoMo en tapant votre code PIN.',
            'orange_money' => 'Validez le message de debit Orange Money en tapant votre code PIN.',
            default        => 'Validez la demande de paiement sur votre telephone.',
        };

        return response()->json([
            'success' => true,
            'data' => [
                'transaction_reference' => $transactionRef,
                'amount'                => $order->montant_total,
                'currency'              => 'XAF',
                'payment_method'        => $validated['payment_method'],
                'instructions'          => $instructions,
                'order_id'              => $order->id,
            ],
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

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
                // Chercher par montant en attente si la reference n'est pas encore enregistree
                $order = Order::where('escrow_status', 'pending')
                    ->where('montant_total', $validated['amount'])
                    ->lockForUpdate()
                    ->first();
            }

            if ($order === null) {
                return null;
            }

            if ($order->escrow_status !== 'pending') {
                return $order; // deja traite
            }

            $amountDiff = abs((float) $order->montant_total - (float) $validated['amount']);
            if ($amountDiff > self::AMOUNT_TOLERANCE) {
                Log::warning('[Webhook] Montant incorrect', [
                    'attendu' => $order->montant_total,
                    'recu'    => $validated['amount'],
                    'diff'    => $amountDiff,
                ]);
                return null;
            }

            $order->update([
                'escrow_status'         => Order::STATUS_ESCROW_LOCKED,
                'payment_provider'      => $validated['provider'],
                'payment_reference'     => $validated['transaction_reference'],
                'transaction_reference' => $validated['transaction_reference'],
                'payment_status'        => 'paid',
                'paid_at'               => now(),
                'synced'                => true,
            ]);

            return $order->refresh();
        });
    }

    /**
     * Persiste le payload dans SQLite local si Neon est inaccessible.
     *
     * @param array<string, mixed> $payload
     */
    private function persistOffline(array $payload, \Throwable $reason): void
    {
        Log::error('[Webhook] Fallback offline declenche', [
            'reason'  => $reason->getMessage(),
            'payload' => $payload,
        ]);

        $sqlitePath = database_path('local_backup.sqlite');
        if (!file_exists($sqlitePath)) {
            touch($sqlitePath);
        }

        Config::set('database.connections.sqlite.database', $sqlitePath);

        try {
            DB::connection('sqlite')->table('webhook_queue')->insertOrIgnore([
                'sync_ref'              => 'WHK-' . uniqid(),
                'provider'              => $payload['provider'] ?? 'unknown',
                'transaction_reference' => $payload['transaction_reference'] ?? '',
                'amount'                => $payload['amount'] ?? 0,
                'payload_json'          => json_encode($payload),
                'synced'                => false,
                'created_at'            => now()->toDateTimeString(),
            ]);
        } catch (\Throwable $e) {
            Log::critical('[Webhook] Impossible de persister offline', ['error' => $e->getMessage()]);
        }
    }

    private function hasValidSignature(Request $request): bool
    {
        $secret    = (string) config('services.cconnect_webhooks.secret', '');
        $signature = (string) $request->header('X-CConnect-Signature', '');

        if ($secret === '' || $signature === '') {
            return app()->environment('local', 'testing');
        }

        $expected = hash_hmac('sha256', $request->getContent(), $secret);
        return hash_equals($expected, $signature);
    }
}
