<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * List all orders scoped to the authenticated user.
     * Buyers see their purchases; sellers see their sales.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Order::with(['product:id,name,country,category,stock', 'buyer:id,fullName,email', 'seller:id,fullName,companyName'])
            ->when($user->isBuyer(), fn ($q) => $q->where('buyer_id', $user->id))
            ->when($user->isSeller(), fn ($q) => $q->where('seller_id', $user->id))
            ->latest();

        $orders = $query->get();

        return response()->json([
            'success' => true,
            'data'    => $orders,
            'message' => 'Orders retrieved successfully.',
        ]);
    }

    /**
     * Create a new order for the authenticated buyer.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity'   => ['required', 'integer', 'min:1'],
        ]);

        $product = \App\Models\Product::findOrFail($validated['product_id']);

        if (! $product->isActive || $product->stock < $validated['quantity']) {
            return response()->json(['message' => 'Product is unavailable or insufficient stock.'], 422);
        }

        $order = Order::create([
            'buyer_id'              => $request->user()->id,
            'seller_id'             => $product->producerId,
            'product_id'            => $product->id,
            'quantity'              => $validated['quantity'],
            'amount'                => $product->price * $validated['quantity'],
            'escrow_status'         => 'pending',
            'transaction_reference' => 'TXN-' . strtoupper(Str::random(12)),
        ]);

        return response()->json([
            'success' => true,
            'data'    => $order->load(['product:id,name,country,category', 'seller:id,fullName,companyName']),
            'message' => 'Order created successfully.',
        ], 201);
    }

    /**
     * Show a single order — only accessible to buyer or seller of the order.
     */
    public function show(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        if ($user->id !== $order->buyer_id && $user->id !== $order->seller_id && ! $user->isAdmin()) {
            return response()->json(['message' => 'Not authorized to view this order.'], 403);
        }

        return response()->json([
            'success' => true,
            'data'    => $order->load(['product:id,name,country,category', 'buyer:id,fullName,email', 'seller:id,fullName,companyName']),
            'message' => 'Order retrieved successfully.',
        ]);
    }

    /**
     * Update order status — restricted to participants.
     */
    public function update(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        if ($user->id !== $order->buyer_id && $user->id !== $order->seller_id && ! $user->isAdmin()) {
            return response()->json(['message' => 'Not authorized to update this order.'], 403);
        }

        $validated = $request->validate([
            'escrow_status' => ['required', 'string', 'in:pending,escrow_locked,shipped,received,released,disputed'],
        ]);

        $order->update($validated);

        return response()->json([
            'success' => true,
            'data'    => $order->fresh()->load('product:id,name,country,category'),
            'message' => 'Order updated successfully.',
        ]);
    }

    /**
     * Soft-delete / cancel: only buyers can cancel pending orders.
     */
    public function destroy(Request $request, Order $order): JsonResponse
    {
        if ($request->user()->id !== $order->buyer_id) {
            return response()->json(['message' => 'Only the buyer can cancel this order.'], 403);
        }

        if ($order->escrow_status !== 'pending') {
            return response()->json(['message' => 'Cannot cancel an order already in escrow.'], 422);
        }

        $order->delete();

        return response()->json(['message' => 'Order cancelled.'], 200);
    }
}
