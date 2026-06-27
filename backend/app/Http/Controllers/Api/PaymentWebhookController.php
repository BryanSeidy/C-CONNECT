<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Events\OrderCompleted;
use App\Http\Controllers\Controller;
use App\Jobs\SendOrderNotificationJob;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PaymentWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        if (! $this->hasValidSignature($request)) {
            return response()->json(['message' => 'Invalid webhook signature.'], 401);
        }

        $validated = $request->validate([
            'provider' => ['required', 'string', Rule::in(['campay', 'notchpay'])],
            'payment_method' => ['required', 'string', Rule::in(['mtn_momo', 'orange_money'])],
            'transaction_reference' => ['required', 'string', 'max:120'],
            'status' => ['required', 'string', Rule::in(['successful', 'success', 'paid'])],
            'amount' => ['required', 'numeric', 'min:1'],
        ]);

        $order = DB::transaction(function () use ($validated): ?Order {
            $order = Order::where('transaction_reference', $validated['transaction_reference'])->lockForUpdate()->first();
            if (! $order || $order->escrow_status !== 'pending' || abs(((float) $order->amount) - ((float) $validated['amount'])) > 0.009) {
                return null;
            }
            $order->update(['escrow_status' => 'escrow_locked']);

            return $order->refresh();
        });

        if (! $order) {
            return response()->json(['message' => 'Pending order not found or amount mismatch.'], 422);
        }

        OrderCompleted::dispatch($order);
        SendOrderNotificationJob::dispatch($order->id, 'escrow_locked')->onQueue('database');

        return response()->json(['message' => 'Webhook processed.', 'data' => ['order' => $order]]);
    }

    private function hasValidSignature(Request $request): bool
    {
        $secret = (string) config('services.cconnect_webhooks.secret', '');
        $signature = (string) $request->header('X-CConnect-Signature', '');
        if ($secret === '' || $signature === '') {
            return false;
        }
        $expected = hash_hmac('sha256', $request->getContent(), $secret);

        return hash_equals($expected, $signature);
    }
}
