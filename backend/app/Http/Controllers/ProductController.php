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
            ->with(['seller.user', 'category'])
            ->where('statut', 'active');

        if ($request->filled('country')) {
            $query->where('region', $request->input('country'));
        }

        if ($request->filled('category')) {
            $categoryParam = $request->input('category');
            $query->where(function ($q) use ($categoryParam): void {
                if (\Illuminate\Support\Str::isUuid($categoryParam)) {
                    $q->where('category_id', $categoryParam);
                } else {
                    $q->whereHas('category', function ($cq) use ($categoryParam): void {
                        $cq->where('nom', 'like', '%' . $categoryParam . '%')
                           ->orWhere('slug', $categoryParam);
                    });
                }
            });
        }

        if ($request->filled('q')) {
            $searchTerm = '%' . $request->input('q') . '%';
            $query->where(function ($q) use ($searchTerm): void {
                $q->where('nom', 'like', $searchTerm)
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
            'data'    => $product->load(['seller.user', 'category']),
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

        $user = $request->user();
        $sellerProfile = $user->sellerProfile;
        if (!$sellerProfile) {
            $sellerProfile = $user->sellerProfile()->create([
                'business_name' => $user->fullName ?? $user->name ?? 'Coopérative locale',
                'region' => $validated['country'],
            ]);
        }

        $categoryParam = $validated['category'];
        $category = null;
        if (\Illuminate\Support\Str::isUuid($categoryParam)) {
            $category = \App\Models\Category::find($categoryParam);
        } else {
            $category = \App\Models\Category::where('nom', $categoryParam)
                ->orWhere('slug', \Illuminate\Support\Str::slug($categoryParam))
                ->first();
        }

        if (!$category) {
            // Default or create fallback
            $category = \App\Models\Category::firstOrCreate([
                'nom' => $categoryParam,
            ], [
                'slug' => \Illuminate\Support\Str::slug($categoryParam),
                'description' => 'Auto created category',
            ]);
        }

        $product = Product::create([
            'seller_id' => $sellerProfile->id,
            'category_id' => $category->id,
            'nom' => $validated['name'],
            'description' => $validated['description'],
            'prix' => $validated['price'],
            'stock' => $validated['stock'],
            'region' => $validated['country'],
            'image_url' => $validated['imageUrl'] ?? null,
            'statut' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'data'    => $product->load(['seller.user', 'category']),
            'message' => 'Product created successfully.',
        ], 201);
    }

    /**
     * Update a product — authenticated seller who owns the product.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $user = $request->user();
        $sellerProfile = $user->sellerProfile;

        if ((!$sellerProfile || $sellerProfile->id !== $product->seller_id) && !$user->isAdmin()) {
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

        $updateData = [];
        if (isset($validated['name'])) $updateData['nom'] = $validated['name'];
        if (isset($validated['description'])) $updateData['description'] = $validated['description'];
        if (isset($validated['price'])) $updateData['prix'] = $validated['price'];
        if (isset($validated['stock'])) $updateData['stock'] = $validated['stock'];
        if (isset($validated['country'])) $updateData['region'] = $validated['country'];
        if (isset($validated['imageUrl'])) $updateData['image_url'] = $validated['imageUrl'];
        if (isset($validated['isActive'])) $updateData['statut'] = $validated['isActive'] ? 'active' : 'disabled';

        if (isset($validated['category'])) {
            $categoryParam = $validated['category'];
            $category = null;
            if (\Illuminate\Support\Str::isUuid($categoryParam)) {
                $category = \App\Models\Category::find($categoryParam);
            } else {
                $category = \App\Models\Category::where('nom', $categoryParam)
                    ->orWhere('slug', \Illuminate\Support\Str::slug($categoryParam))
                    ->first();
            }
            if ($category) {
                $updateData['category_id'] = $category->id;
            }
        }

        $product->update($updateData);

        return response()->json([
            'success' => true,
            'data'    => $product->fresh()->load(['seller.user', 'category']),
            'message' => 'Product updated successfully.',
        ]);
    }

    /**
     * Delete a product — owner or admin only.
     */
    public function destroy(Request $request, Product $product): JsonResponse
    {
        $user = $request->user();
        $sellerProfile = $user->sellerProfile;

        if ((!$sellerProfile || $sellerProfile->id !== $product->seller_id) && !$user->isAdmin()) {
            return response()->json(['message' => 'Not authorized to delete this product.'], 403);
        }

        $product->delete();

        return response()->json(['message' => 'Product deleted successfully.']);
    }
}
