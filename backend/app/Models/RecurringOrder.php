<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class RecurringOrder extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'recurring_orders';

    protected $fillable = [
        'buyer_id',
        'seller_id',
        'product_id',
        'quantite',
        'unite',
        'frequence',
        'jour_semaine',
        'jour_mois',
        'prochaine_livraison',
        'date_fin',
        'prix_negocie',
        'notes',
        'statut',
    ];

    protected $casts = [
        'quantite' => 'decimal:2',
        'prix_negocie' => 'decimal:2',
        'volume_total_xaf' => 'decimal:2',
        'prochaine_livraison' => 'date',
        'date_fin' => 'date',
        'total_commandes_generees' => 'integer',
        'jour_semaine' => 'integer',
        'jour_mois' => 'integer',
    ];

    // ==================== RELATIONS ====================

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(SellerProfile::class, 'seller_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // ==================== SCOPES ====================

    public function scopeActive($query)
    {
        return $query->where('statut', 'active');
    }

    public function scopeDueToday($query)
    {
        return $query->where('statut', 'active')
            ->where('prochaine_livraison', '<=', now()->toDateString());
    }

    // ==================== MÉTIER ====================

    public function calculerProchaineDate(): \Carbon\Carbon
    {
        $base = $this->prochaine_livraison ?? now();

        return match ($this->frequence) {
            'hebdomadaire' => $base->copy()->addWeek(),
            'bimensuelle' => $base->copy()->addWeeks(2),
            'mensuelle' => $base->copy()->addMonth(),
            default => $base->copy()->addWeek(),
        };
    }

    public function getPrixEffectifAttribute(): float
    {
        return $this->prix_negocie ?? $this->product?->prix ?? 0;
    }

    public function getMontantParLivraisonAttribute(): float
    {
        return $this->getPrixEffectifAttribute() * (float) $this->quantite;
    }
}
