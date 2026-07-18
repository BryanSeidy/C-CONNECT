<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Livreur sous-traitant. Pas un utilisateur de la plateforme — pas de
 * compte/login, géré uniquement par l'admin. Contacté par email lors d'une
 * demande de livraison (voir DeliveryDispatchService).
 */
class DeliveryPartner extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'telephone',
        'email',
        'region',
        'actif',
        'livraisons_en_cours',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
            'livraisons_en_cours' => 'integer',
        ];
    }

    public function deliveryRequests(): HasMany
    {
        return $this->hasMany(DeliveryRequest::class);
    }

    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }

    public function scopeDansLaRegion($query, string $region)
    {
        return $query->where('region', $region);
    }
}
