<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = [
        'buyer_id',
        'seller_id',
        'product_id',
        'quantity',
        'amount',
        'escrow_status',
        'transaction_reference',
    ];

    protected function casts(): array
    {
        return [
            'amount'   => 'decimal:2',
            'quantity' => 'integer',
        ];
    }

    /**
     * Ordered escrow phase hierarchy.
     */
    public static array $escrowPhases = [
        'pending',
        'escrow_locked',
        'shipped',
        'received',
        'released',
    ];

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
