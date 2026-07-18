<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class DeliveryRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'delivery_partner_id',
        'frais_livraison',
        'ville_livraison',
        'adresse_livraison',
        'telephone_livraison',
        'statut',
        'token_reponse',
        'assignee_le',
        'repondue_le',
        'livree_le',
    ];

    protected function casts(): array
    {
        return [
            'frais_livraison' => 'decimal:2',
            'assignee_le' => 'datetime',
            'repondue_le' => 'datetime',
            'livree_le' => 'datetime',
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (DeliveryRequest $request): void {
            if (empty($request->token_reponse)) {
                $request->token_reponse = Str::random(48);
            }
        });
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function deliveryPartner(): BelongsTo
    {
        return $this->belongsTo(DeliveryPartner::class);
    }
}
