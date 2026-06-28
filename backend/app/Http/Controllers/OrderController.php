<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index()
    {
        return response()->json(Order::with('buyer')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'buyer_id' => 'required|exists:User,id',
            'montant_total' => 'required|numeric',
            'payment_provider' => 'required|string',
        ]);

        $order = Order::create([
            'buyer_id' => $request->buyer_id,
            'montant_total' => $request->montant_total,
            'payment_provider' => $request->payment_provider,
            'statut' => 'pending'
        ]);

        return response()->json($order, 201);
    }

    public function show(Order $order)
    {
        return response()->json($order->load('buyer'));
    }

    public function update(Request $request, Order $order)
    {
        $order->update($request->only('statut'));
        return response()->json($order);
    }
}
