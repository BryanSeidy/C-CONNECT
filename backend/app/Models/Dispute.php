<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dispute extends Model
{
    use HasFactory, HasUuids;

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

        $this->order->update(['escrow_status' => 'annule']);
    }

    public function resolveWithRelease(User $admin, string $notes): void
    {
        $this->update([
            'statut' => 'resolu_libere',
            'notes_resolution' => $notes,
            'resolu_par' => $admin->id,
            'resolu_le' => now(),
        ]);

        $this->order->update([
            'escrow_status' => 'complete',
            'complete_le' => now(),
        ]);
    }
}
