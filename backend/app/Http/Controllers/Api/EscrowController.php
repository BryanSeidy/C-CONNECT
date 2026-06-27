<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Events\FundsReleased;
use App\Http\Controllers\Controller;
use App\Jobs\SendOrderNotificationJob;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EscrowController extends Controller
{
    public function releaseFunds(Request $request, Order $order): JsonResponse
    {
        if (! $request->user()->isAdmin() && $request->user()->id !== $order->buyer_id) {
            return response()->json(['message' => 'Only the buyer or an admin can release escrow.'], 403);
        }

        $released = DB::transaction(function () use ($order): ?Order {
            $locked = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            if ($locked->escrow_status !== 'escrow_locked') {
                return null;
            }
            $locked->update(['escrow_status' => 'released']);

            return $locked->refresh();
        });

        if (! $released) {
            return response()->json(['message' => 'Order funds are not eligible for release.'], 422);
        }

        FundsReleased::dispatch($released);
        SendOrderNotificationJob::dispatch($released->id, 'released')->onQueue('database');

        return response()->json(['message' => 'Funds released.', 'data' => ['order' => $released]]);
    }
}
