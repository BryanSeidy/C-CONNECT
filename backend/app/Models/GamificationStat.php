<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GamificationStat extends Model
{
    protected $fillable = ['user_id', 'points', 'total_sales', 'quality_rating', 'badges_unlocked'];

    protected function casts(): array
    {
        return ['badges_unlocked' => 'array', 'quality_rating' => 'decimal:2'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
