<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SendOrderNotificationJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $orderId, public readonly string $status) {}

    public function handle(): void
    {
        $order = Order::with(['buyer', 'seller'])->findOrFail($this->orderId);
        Log::info('C-Connect order notification queued.', ['order_id' => $order->id, 'status' => $this->status, 'buyer_id' => $order->buyer_id, 'seller_id' => $order->seller_id]);
    }
}
