<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'buyer_id',
        'seller_id',
        'montant_total',
        'commission_plateforme',
        'montant_net_vendeur',
        'statut',
        'payment_provider',
        'payment_reference',
        'payment_status',
        'payment_metadata',
        'adresse_livraison',
        'ville_livraison',
        'telephone_livraison',
        'notes_livraison',
    ];

    protected $casts = [
        'montant_total' => 'decimal:2',
        'commission_plateforme' => 'decimal:2',
        'montant_net_vendeur' => 'decimal:2',
        'payment_metadata' => 'array',
        'paid_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
        'released_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    protected $attributes = [
        'statut' => 'pending',
    ];

    // ==================== RELATIONS ====================

    public function buyer(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(SellerProfile::class, 'seller_id');
    }

    public function items(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function reviews(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Review::class);
    }

    // ==================== SCOPES ====================

    public function scopeByStatus($query, string $status)
    {
        return $query->where('statut', $status);
    }

    public function scopeForSeller($query, string $sellerId)
    {
        return $query->where('seller_id', $sellerId);
    }

    public function scopeForBuyer($query, string $buyerId)
    {
        return $query->where('buyer_id', $buyerId);
    }

    public function dispute(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Dispute::class);
    }

    // ==================== MÉTIER ESCROW B2B ====================

    public function lockEscrow(): void
    {
        $this->update(['escrow_status' => 'escrow_locked']);
    }

    public function markEnPreparation(): void
    {
        $this->update(['escrow_status' => 'en_preparation', 'en_preparation_le' => now()]);
    }

    public function markExpedie(): void
    {
        $this->update(['escrow_status' => 'expedie', 'shipped_at' => now()]);
    }

    public function markEnTransit(): void
    {
        $this->update(['escrow_status' => 'en_transit', 'en_transit_le' => now()]);
    }

    public function markLivre(): void
    {
        $this->update(['escrow_status' => 'livre', 'delivered_at' => now()]);
    }

    public function markComplete(): void
    {
        $this->update([
            'escrow_status' => 'complete',
            'complete_le' => now(),
        ]);
    }

    public function markAsDisputed(): void
    {
        $this->update(['escrow_status' => 'dispute', 'dispute_le' => now()]);
    }

    public function cancel(): void
    {
        $this->update(['escrow_status' => 'annule', 'cancelled_at' => now()]);
    }

    /**
     * Automatically compute commission and seller payout on total amount.
     */
    public static function computeFinancials(float $montantTotal, float $tauxCommission = 0.10): array
    {
        $commission = round($montantTotal * $tauxCommission, 2);

        return [
            'montant_total' => $montantTotal,
            'commission_plateforme' => $commission,
            'montant_vendeur' => round($montantTotal - $commission, 2),
        ];
    }

    // ==================== HELPERS ====================

    public function getMontantTotalFormateAttribute(): string
    {
        return number_format($this->montant_total, 0, ',', ' ') . ' XAF';
    }

    public function getCanBeCancelledAttribute(): bool
    {
        return in_array($this->statut, ['pending', 'escrow_locked']);
    }
}
