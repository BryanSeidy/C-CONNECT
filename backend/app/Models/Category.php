<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'slug',
        'description',
        'icone',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($category) {
            if (empty($category->slug)) {
                $category->slug = Str::slug($category->nom);
            }
        });
    }

    /**
     * Route model binding : accepte le slug OU l'id (voir Product/Company
     * pour le même correctif — préventif ici, aucun flux frontend n'utilise
     * encore /catalogue/categories/{slug}, mais la colonne slug existe).
     */
    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where('slug', $value)->first()
            ?? $this->where('id', $value)->firstOrFail();
    }

    // ==================== RELATIONS ====================

    public function products(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Product::class);
    }

    // ==================== SCOPES ====================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }
}
