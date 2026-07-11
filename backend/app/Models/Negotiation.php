<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Negotiation extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'negotiations';

    protected $fillable = [
        'product_id',
        'buyer_id',
        'seller_id',
        'quantity',
        'proposed_price',
        'counter_price',
        'message',
        'status',
        'order_id',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'proposed_price' => 'decimal:2',
        'counter_price' => 'decimal:2',
    ];

    // ==================== RELATIONS ====================

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    /** Le vendeur est un SellerProfile — utiliser seller->user pour l'utilisateur associé. */
    public function seller(): BelongsTo
    {
        return $this->belongsTo(SellerProfile::class, 'seller_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    // ==================== MÉTIER ====================

    public function isPending(): bool
    {
        return $this->status === 'PENDING' || $this->status === 'COUNTERED';
    }

    /**
     * Prix unitaire final à honorer si cette négociation est convertie en
     * commande : la contre-offre du vendeur prime si elle existe, sinon le
     * prix initialement proposé par l'acheteur.
     */
    public function finalPrice(): float
    {
        return (float) ($this->counter_price ?? $this->proposed_price);
    }
}
