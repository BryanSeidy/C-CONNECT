<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $order_id
 * @property string $product_id
 * @property int $quantite
 * @property float $prix_unitaire
 * @property float $sous_total
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read \App\Models\Order $order
 * @property-read \App\Models\Product $product
 * @property-read string $sous_total_formate
 */
class OrderItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'order_id',
        'product_id',
        'quantite',
        'prix_unitaire',
        'sous_total',
        'notes',
    ];

    protected $casts = [
        'quantite' => 'integer',
        'prix_unitaire' => 'decimal:2',
        'sous_total' => 'decimal:2',
    ];

    // ==================== RELATIONS ====================

    /**
     * La commande parente.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Le produit acheté.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // ==================== BOOT ====================

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (OrderItem $item): void {
            if (empty($item->sous_total)) {
                $item->sous_total = $item->quantite * $item->prix_unitaire;
            }
        });
    }

    // ==================== ACCESSORS ====================

    /**
     * Sous-total formaté avec devise.
     */
    public function getSousTotalFormateAttribute(): string
    {
        return number_format($this->sous_total, 0, ',', ' ') . ' XAF';
    }
}
