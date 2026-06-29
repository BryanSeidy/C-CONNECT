<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * @property string $id
 * @property string $seller_id
 * @property string|null $category_id
 * @property string $nom
 * @property string $slug
 * @property string|null $description
 * @property float $prix
 * @property int $stock
 * @property string|null $region
 * @property string|null $image_principale
 * @property float $quality_rating
 * @property int $reviews_count
 * @property int $sales_count
 * @property string $statut
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * @property-read \App\Models\SellerProfile $seller
 * @property-read \App\Models\Category|null $category
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\OrderItem[] $orderItems
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\Review[] $reviews
 * @property-read string $prix_formate
 * @property-read bool $is_in_stock
 * @property-read float $rating_percent
 */
class Product extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'seller_id',
        'category_id',
        'nom',
        'slug',
        'description',
        'prix',
        'stock',
        'region',
        'image_url',
        'image_principale',
        'statut',
    ];

    protected $casts = [
        'prix' => 'decimal:2',
        'quality_rating' => 'decimal:2',
        'stock' => 'integer',
        'reviews_count' => 'integer',
        'sales_count' => 'integer',
    ];

    protected $attributes = [
        'statut' => 'pending',
        'quality_rating' => 0.00,
        'reviews_count' => 0,
        'sales_count' => 0,
    ];

    /**
     * Boot du modèle : génération automatique du slug.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Product $product): void {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->nom) . '-' . Str::random(6);
            }
        });

        static::updating(function (Product $product): void {
            if ($product->isDirty('nom') && !$product->isDirty('slug')) {
                $product->slug = Str::slug($product->nom) . '-' . Str::random(6);
            }
        });
    }

    // ==================== RELATIONS ====================

    /**
     * Le vendeur propriétaire du produit.
     */
    public function seller(): BelongsTo
    {
        return $this->belongsTo(SellerProfile::class, 'seller_id');
    }

    /**
     * La catégorie du produit.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Les lignes de commande contenant ce produit.
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Les avis déposés sur ce produit.
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    // ==================== SCOPES ====================

    /**
     * Produits actifs uniquement.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActive($query)
    {
        return $query->where('statut', 'active');
    }

    /**
     * Filtrer par région.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $region
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByRegion($query, string $region)
    {
        return $query->where('region', $region);
    }

    /**
     * Filtrer par catégorie.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $categoryId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByCategory($query, string $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    /**
     * Produits en stock uniquement.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeInStock($query)
    {
        return $query->where('stock', '>', 0);
    }

    /**
     * Produits les mieux notés.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeTopRated($query)
    {
        return $query->where('statut', 'active')
            ->orderBy('quality_rating', 'desc');
    }

    /**
     * Produits les plus vendus.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeBestSellers($query)
    {
        return $query->where('statut', 'active')
            ->orderBy('sales_count', 'desc');
    }

    // ==================== ACCESSORS ====================

    /**
     * Prix formaté avec devise.
     */
    public function getPrixFormateAttribute(): string
    {
        return number_format($this->prix, 0, ',', ' ') . ' XAF';
    }

    /**
     * Vérifie si le produit est en stock.
     */
    public function getIsInStockAttribute(): bool
    {
        return $this->stock > 0;
    }

    /**
     * Note en pourcentage pour barre de progression.
     */
    public function getRatingPercentAttribute(): float
    {
        return ($this->quality_rating / 5) * 100;
    }
}
