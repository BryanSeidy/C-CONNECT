<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'buyer_id',
        'product_id',
        'order_id',
        'note',
        'commentaire',
        'is_verified_purchase',
    ];

    protected $casts = [
        'note' => 'integer',
        'is_verified_purchase' => 'boolean',
    ];

    protected $attributes = [
        'is_verified_purchase' => false,
    ];

    // ==================== RELATIONS ====================

    /**
     * L'acheteur qui a déposé l'avis.
     */
    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    /**
     * Le produit concerné par l'avis.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * La commande associée (si achat vérifié).
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    // ==================== SCOPES ====================

    /**
     * Avis avec une note minimale.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  int  $min
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeMinRating($query, int $min)
    {
        return $query->where('note', '>=', $min);
    }

    /**
     * Avis excellents (5 étoiles).
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeExcellent($query)
    {
        return $query->where('note', 5);
    }

    /**
     * Avis vérifiés (achat confirmé).
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeVerifiedPurchase($query)
    {
        return $query->where('is_verified_purchase', true);
    }

    /**
     * Avis pour un vendeur spécifique (via ses produits).
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $sellerId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForSeller($query, string $sellerId)
    {
        return $query->whereHas('product', function ($q) use ($sellerId) {
            $q->where('seller_id', $sellerId);
        });
    }

    // ==================== ACCESSORS ====================

    /**
     * Affiche la note sous forme d'étoiles.
     */
    public function getStarsDisplayAttribute(): string
    {
        return str_repeat('⭐', $this->note);
    }

    /**
     * Vérifie si c'est un avis positif (4+).
     */
    public function getIsPositiveAttribute(): bool
    {
        return $this->note >= 4;
    }
}
