<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class RfqBid extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'rfq_bids';

    protected $fillable = [
        'rfq_id',
        'seller_id',
        'prix_unitaire_propose',
        'quantite_disponible',
        'date_livraison_proposee',
        'message',
        'conditions',
        'statut',
    ];

    protected $casts = [
        'prix_unitaire_propose' => 'decimal:2',
        'quantite_disponible' => 'decimal:2',
        'date_livraison_proposee' => 'date',
        'traitee_le' => 'datetime',
    ];

    // ==================== RELATIONS ====================

    public function rfq(): BelongsTo
    {
        return $this->belongsTo(Rfq::class);
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(SellerProfile::class, 'seller_id');
    }

    // ==================== MÉTIER ====================

    public function accept(): void
    {
        $this->update(['statut' => 'acceptee', 'traitee_le' => now()]);

        // Decline all other bids on the same RFQ
        RfqBid::where('rfq_id', $this->rfq_id)
            ->where('id', '!=', $this->id)
            ->where('statut', 'en_attente')
            ->update(['statut' => 'refusee', 'traitee_le' => now()]);

        $this->rfq->update(['statut' => 'en_negociation']);
    }

    public function reject(): void
    {
        $this->update(['statut' => 'refusee', 'traitee_le' => now()]);
    }

    public function getMontantTotalEstimeAttribute(): float
    {
        return (float) $this->prix_unitaire_propose * (float) $this->quantite_disponible;
    }
}
