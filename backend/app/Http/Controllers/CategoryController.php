<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController
{
    /**
     * Liste publique des catégories actives, triées par ordre.
     */
    public function index(): JsonResponse
    {
        $categories = Category::active()->ordered()->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Créer une catégorie (admin uniquement via middleware).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'icone' => ['nullable', 'string', 'max:255'],
        ]);

        $category = Category::create([
            'nom' => $validated['nom'],
            'slug' => Str::slug($validated['nom']),
            'description' => $validated['description'] ?? null,
            'icone' => $validated['icone'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $category,
            'message' => 'Catégorie créée avec succès.',
        ], 201);
    }

    /**
     * Afficher une catégorie publique.
     */
    public function show(Category $category): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $category->load('products'),
        ]);
    }

    /**
     * Mettre à jour une catégorie (admin uniquement).
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $request->validate([
            'nom' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'icone' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'order' => ['sometimes', 'integer', 'min:0'],
        ]);

        if (isset($validated['nom'])) {
            $validated['slug'] = Str::slug($validated['nom']);
        }

        $category->update($validated);

        return response()->json([
            'success' => true,
            'data' => $category->fresh(),
            'message' => 'Catégorie mise à jour.',
        ]);
    }

    /**
     * Supprimer une catégorie (admin uniquement).
     */
    public function destroy(Category $category): JsonResponse
    {
        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Catégorie supprimée.',
        ]);
    }
}
