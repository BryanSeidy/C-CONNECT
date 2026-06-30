<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rfq extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'rfqs';

    protected $fillable = [
        'buyer_id',
        'category_id',
        'titre',
        'description',
        'quantite',
        'unite',
        'budget_max',
        'region_livraison',
        'ville_livraison',
        'delai_livraison',
        'expire_le',
        'vendeur_verifie_requis',
        'cooperative_uniquement',
        'femmes_entrepreneures_prefere',
        'statut',
    ];

    protected $casts = [
        'quantite' => 'decimal:2',
        'budget_max' => 'decimal:2',
        'vendeur_verifie_requis' => 'boolean',
        'cooperative_uniquement' => 'boolean',
        'femmes_entrepreneures_prefere' => 'boolean',
        'delai_livraison' => 'date',
        'expire_le' => 'date',
        'nombre_offres' => 'integer',
    ];

    // ==================== RELATIONS ====================

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function bids(): HasMany
    {
        return $this->hasMany(RfqBid::class);
    }

    // ==================== SCOPES ====================

    public function scopeActive($query)
    {
        return $query->where('statut', 'active')
            ->where(function ($q): void {
                $q->whereNull('expire_le')->orWhere('expire_le', '>=', now()->toDateString());
            });
    }

    public function scopeByRegion($query, string $region)
    {
        return $query->where('region_livraison', $region);
    }

    // ==================== MÉTIER ====================

    public function incrementNombreOffres(): void
    {
        $this->increment('nombre_offres');
    }

    public function isExpired(): bool
    {
        return $this->expire_le !== null && $this->expire_le->isPast();
    }
}
