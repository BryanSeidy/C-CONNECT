<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Events\OrderPlaced;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function processMobileMoney(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:Order,id',
            'phone' => 'required|string',
            'provider' => 'required|in:MTN,Orange'
        ]);

        $order = Order::findOrFail($request->order_id);

        // Simulate external API call
        $success = true; // In a real app, this would be the webhook response

        if ($success) {
            $order->update(['statut' => 'paid']);
            
            // Trigger Gamification Points
            event(new OrderPlaced($order));

            return response()->json([
                'message' => "Transaction successful via {$request->provider}",
                'order' => $order
            ]);
        }

        return response()->json(['message' => 'Transaction failed'], 400);
    }
}
