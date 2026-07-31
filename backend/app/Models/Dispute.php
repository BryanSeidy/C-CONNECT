<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dispute extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'initiateur_id',
        'raison',
        'description',
        'preuves_urls',
        'statut',
        'notes_resolution',
        'resolu_par',
        'resolu_le',
    ];

    protected $casts = [
        'preuves_urls' => 'array',
        'resolu_le' => 'datetime',
    ];

    // ==================== RELATIONS ====================

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function initiateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiateur_id');
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolu_par');
    }

    // ==================== MÉTIER ====================

    public function resolveWithRefund(User $admin, string $notes): void
    {
        $this->update([
            'statut' => 'resolu_rembourse',
            'notes_resolution' => $notes,
            'resolu_par' => $admin->id,
            'resolu_le' => now(),
        ]);

        // Annule la commande et restitue le stock réservé
        $this->order->cancel();
        foreach ($this->order->items as $item) {
            $item->product?->libererStock($item->quantite);
        }
    }

    public function resolveWithRelease(User $admin, string $notes): void
    {
        $this->update([
            'statut' => 'resolu_libere',
            'notes_resolution' => $notes,
            'resolu_par' => $admin->id,
            'resolu_le' => now(),
        ]);

        // Libère les fonds au vendeur
        $this->order->markComplete();
        foreach ($this->order->items as $item) {
            $item->product?->consommerStock($item->quantite);
        }
    }
}
