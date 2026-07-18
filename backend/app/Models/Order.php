<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'buyer_id',
        'seller_id',
        'montant_total',
        'commission_plateforme',
        'montant_vendeur',
        'escrow_status',
        'payment_provider',
        'payment_reference',
        'transaction_reference',
        'payment_status',
        'adresse_livraison',
        'ville_livraison',
        'telephone_livraison',
        'livraison_demandee',
        'frais_livraison',
        'date_livraison_estimee',
        'paid_at',
        'confirmed_at',
        'shipped_at',
        'delivered_at',
        'released_at',
        'cancelled_at',
        'en_preparation_le',
        'en_transit_le',
        'complete_le',
        'dispute_le',
        'synced',
    ];

    protected $casts = [
        'montant_total' => 'decimal:2',
        'commission_plateforme' => 'decimal:2',
        'montant_vendeur' => 'decimal:2',
        'livraison_demandee' => 'boolean',
        'frais_livraison' => 'decimal:2',
        'date_livraison_estimee' => 'date',
        'paid_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'shipped_at' => 'datetime',
        'delivered_at' => 'datetime',
        'released_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'en_preparation_le' => 'datetime',
        'en_transit_le' => 'datetime',
        'complete_le' => 'datetime',
        'dispute_le' => 'datetime',
    ];

    /**
     * États finaux du cycle Escrow B2B.
     * Aligné avec la migration corrective et les contrôleurs.
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_ESCROW_LOCKED = 'escrow_locked';
    public const STATUS_EN_PREPARATION = 'en_preparation';
    public const STATUS_EXPEDIE = 'expedie';
    public const STATUS_EN_TRANSIT = 'en_transit';
    public const STATUS_LIVRE = 'livre';
    public const STATUS_COMPLETE = 'complete';
    public const STATUS_ANNULE = 'annule';
    public const STATUS_DISPUTE = 'dispute';

    /** Tous les statuts autorisés du lifecycle. */
    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_ESCROW_LOCKED,
        self::STATUS_EN_PREPARATION,
        self::STATUS_EXPEDIE,
        self::STATUS_EN_TRANSIT,
        self::STATUS_LIVRE,
        self::STATUS_COMPLETE,
        self::STATUS_ANNULE,
        self::STATUS_DISPUTE,
    ];

    /** Statuts finaux qui libèrent/déduisent le stock réservé. */
    public const STOCK_RELEASING_STATUSES = [self::STATUS_LIVRE, self::STATUS_COMPLETE];

    /** Statuts finaux qui annulent et restituent le stock réservé. */
    public const STOCK_RESTORING_STATUSES = [self::STATUS_ANNULE];

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
        return $query->where('escrow_status', $status);
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
        return in_array($this->escrow_status, ['pending', 'escrow_locked'], true);
    }
}
