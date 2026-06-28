<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProductController extends Controller
{
    /**
     * Public catalogue — no authentication required.
     * Supports keyword search, region filter, category filter and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()
            ->with('producer:id,fullName,companyName,country,isVerified')
            ->where('isActive', true);

        if ($request->filled('country')) {
            $query->where('country', $request->input('country'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('q')) {
            $searchTerm = '%' . $request->input('q') . '%';
            $query->where(function ($q) use ($searchTerm): void {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('description', 'like', $searchTerm);
            });
        }

        $pageSize  = min((int) $request->input('pageSize', 12), 50);
        $page      = max((int) $request->input('page', 1), 1);
        $paginated = $query->orderBy('created_at', 'desc')->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'data'    => [
                'items' => $paginated->items(),
                'meta'  => [
                    'total'      => $paginated->total(),
                    'page'       => $paginated->currentPage(),
                    'pageSize'   => $paginated->perPage(),
                    'totalPages' => $paginated->lastPage(),
                ],
            ],
            'message' => 'Products retrieved successfully.',
        ]);
    }

    /**
     * Display a single product — public.
     */
    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $product->load('producer:id,fullName,companyName,country,isVerified'),
            'message' => 'Product retrieved successfully.',
        ]);
    }

    /**
     * Create a new product — authenticated sellers only.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'price'       => ['required', 'numeric', 'min:0'],
            'stock'       => ['required', 'integer', 'min:0'],
            'country'     => ['required', 'string', 'max:100'],
            'category'    => ['required', 'string', 'max:100'],
            'imageUrl'    => ['nullable', 'url', 'max:2048'],
        ]);

        $product = Product::create([
            ...$validated,
            'producerId' => $request->user()->id,
            'isActive'   => true,
        ]);

        return response()->json([
            'success' => true,
            'data'    => $product->load('producer:id,fullName,companyName,country,isVerified'),
            'message' => 'Product created successfully.',
        ], 201);
    }

    /**
     * Update a product — authenticated seller who owns the product.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $user = $request->user();

        if ($user->id !== $product->producerId && ! $user->isAdmin()) {
            return response()->json(['message' => 'Not authorized to update this product.'], 403);
        }

        $validated = $request->validate([
            'name'        => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'price'       => ['sometimes', 'numeric', 'min:0'],
            'stock'       => ['sometimes', 'integer', 'min:0'],
            'country'     => ['sometimes', 'string', 'max:100'],
            'category'    => ['sometimes', 'string', 'max:100'],
            'imageUrl'    => ['nullable', 'url', 'max:2048'],
            'isActive'    => ['sometimes', 'boolean'],
        ]);

        $product->update($validated);

        return response()->json([
            'success' => true,
            'data'    => $product->fresh()->load('producer:id,fullName,companyName,country,isVerified'),
            'message' => 'Product updated successfully.',
        ]);
    }

    /**
     * Delete a product — owner or admin only.
     */
    public function destroy(Request $request, Product $product): JsonResponse
    {
        $user = $request->user();

        if ($user->id !== $product->producerId && ! $user->isAdmin()) {
            return response()->json(['message' => 'Not authorized to delete this product.'], 403);
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted successfully.']);
    }
}
