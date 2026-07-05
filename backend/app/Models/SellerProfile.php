<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class SellerProfile extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'user_id',
        'business_name',
        'slug',
        'biographie',
        'region',
        'ville',
        'adresse',
        'telephone_boutique',
        'logo',
        'banniere',
        'is_female_owned',
        'is_local_producer',
        'is_cooperative',
    ];

    protected $casts = [
        'is_female_owned' => 'boolean',
        'is_local_producer' => 'boolean',
        'is_cooperative' => 'boolean',
        'quality_score' => 'decimal:2',
        'verified_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($profile) {
            if (empty($profile->slug)) {
                $profile->slug = Str::slug($profile->business_name) . '-' . Str::random(6);
            }
        });
    }

    // ==================== RELATIONS ====================

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function products(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Product::class, 'seller_id');
    }

    public function orders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Order::class, 'seller_id');
    }

    // ==================== SCOPES ====================

    public function scopeVerified($query)
    {
        return $query->where('verification_status', 'verified');
    }

    public function scopeFemaleOwned($query)
    {
        return $query->where('is_female_owned', true);
    }

    public function scopeLocalProducer($query)
    {
        return $query->where('is_local_producer', true);
    }

    public function scopeByRegion($query, string $region)
    {
        return $query->where('region', $region);
    }

    public function scopeTopQuality($query)
    {
        return $query->where('quality_score', '>=', 4.0)
            ->orderBy('quality_score', 'desc');
    }
}
