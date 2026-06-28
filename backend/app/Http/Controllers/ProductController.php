<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::query()->with('producer:id,fullName,companyName,country,isVerified');

        // Simple filtering to match frontend
        if ($request->has('country')) {
            $products->where('country', $request->country);
        }
        if ($request->has('category')) {
            $products->where('category', $request->category);
        }
        if ($request->has('q')) {
            $products->where('name', 'like', '%' . $request->q . '%');
        }

        $page = $request->input('page', 1);
        $pageSize = $request->input('pageSize', 12);
        
        $paginated = $products->paginate($pageSize, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $paginated->items(),
                'meta' => [
                    'total' => $paginated->total(),
                    'page' => $paginated->currentPage(),
                    'pageSize' => $paginated->perPage(),
                    'totalPages' => $paginated->lastPage(),
                ]
            ],
            'message' => 'Products retrieved successfully'
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:255',
            'description' => 'required|string',
            'prix' => 'required|numeric',
            'stock' => 'required|integer',
            'region' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'seller_id' => 'required|exists:users,id',
            'imageUrl' => 'nullable|string'
        ]);

        $product = Product::create($request->all());

        return response()->json(['success' => true, 'data' => $product, 'message' => 'Product created successfully'], 201);
    }

    public function show(Product $product)
    {
        return response()->json([
            'success' => true,
            'data' => $product->load(['producer:id,fullName,companyName,country,isVerified']),
            'message' => 'Product retrieved successfully',
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $request->validate([
            'nom' => 'string|max:255',
            'prix' => 'numeric',
            'stock' => 'integer',
        ]);

        $product->update($request->all());

        return response()->json(['success' => true, 'data' => $product, 'message' => 'Product updated successfully']);
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(null, 204);
    }
}
