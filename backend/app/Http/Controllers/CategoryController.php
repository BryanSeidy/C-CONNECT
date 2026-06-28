<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(Category::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name_fr' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'icon' => 'nullable|string'
        ]);

        $category = Category::create([
            'name_fr' => $request->name_fr,
            'name_en' => $request->name_en,
            'slug' => Str::slug($request->name_fr),
            'icon' => $request->icon
        ]);

        return response()->json($category, 201);
    }

    public function show(Category $category)
    {
        return response()->json($category);
    }

    public function update(Request $request, Category $category)
    {
        $request->validate([
            'name_fr' => 'string|max:255',
            'name_en' => 'string|max:255',
            'icon' => 'nullable|string'
        ]);

        $category->update($request->all());
        
        if ($request->has('name_fr')) {
            $category->slug = Str::slug($request->name_fr);
            $category->save();
        }

        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return response()->json(null, 204);
    }
}
