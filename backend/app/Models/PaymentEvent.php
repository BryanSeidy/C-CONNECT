<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Journal des événements paiement.
 *
 * Enregistre chaque interaction avec les agrégateurs de paiement
 * pour la traçabilité, le debugging et la réconciliation comptable.
 *
 * @property int $id
 * @property int|null $order_id
 * @property string $event_type
 * @property string|null $transaction_reference
 * @property string|null $provider
 * @property string|null $payment_method
 * @property float|null $amount
 * @property string|null $status
 * @property string|null $payload_snapshot
 * @property string|null $source_ip
 * @property bool $success
 * @property string|null $error_message
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class PaymentEvent extends Model
{
    protected $fillable = [
        'order_id',
        'event_type',
        'transaction_reference',
        'provider',
        'payment_method',
        'amount',
        'status',
        'payload_snapshot',
        'source_ip',
        'success',
        'error_message',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'success' => 'boolean',
    ];

    // ==================== EVENT TYPES ====================

    public const TYPE_INITIATION = 'initiation';
    public const TYPE_STATUS_POLL = 'status_poll';
    public const TYPE_WEBHOOK_RECEIVED = 'webhook_received';
    public const TYPE_WEBHOOK_PROCESSED = 'webhook_processed';
    public const TYPE_WEBHOOK_IDEMPOTENT = 'webhook_idempotent';
    public const TYPE_WEBHOOK_INVALID_SIGNATURE = 'webhook_invalid_signature';
    public const TYPE_WEBHOOK_AMOUNT_MISMATCH = 'webhook_amount_mismatch';
    public const TYPE_WEBHOOK_OFFLINE_FALLBACK = 'webhook_offline_fallback';

    // ==================== RELATIONS ====================

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    // ==================== FACTORY METHODS ====================

    /**
     * Log a payment event with a truncated payload snapshot.
     *
     * @param array<string, mixed> $attributes
     */
    public static function log(array $attributes): self
    {
        // Truncate payload to 2000 chars to avoid bloating the DB
        if (isset($attributes['payload_snapshot']) && is_array($attributes['payload_snapshot'])) {
            $attributes['payload_snapshot'] = mb_substr(
                json_encode($attributes['payload_snapshot'], JSON_UNESCAPED_UNICODE),
                0,
                2000
            );
        }

        return static::create($attributes);
    }
}
