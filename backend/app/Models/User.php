<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    protected $table = 'users';

    // The DB uses camelCase timestamps
    // const CREATED_AT = 'createdAt';
    // const UPDATED_AT = 'updatedAt';

    protected $fillable = [
        'email',
        'password',
        'role',
        'nom',
        'prenom',
        'telephone',
        'company_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['fullName'];

    protected function casts(): array
    {
        return [
            // 'password' => 'hashed',
            'role' => 'string',
        ];
    }

    /**
     * Accesseur en lecture seule — 'nom'/'prenom' sont les vraies colonnes
     * en base ; 'fullName' n'en est pas une (voir la table users). Utilisé
     * par le frontend et par les endroits du backend qui veulent un nom
     * d'affichage complet sans se soucier du découpage nom/prénom.
     */
    public function getFullNameAttribute(): string
    {
        return trim(($this->prenom ?? '') . ' ' . ($this->nom ?? ''));
    }

    public function isBuyer(): bool
    {
        return $this->role === 'buyer';
    }

    public function isSeller(): bool
    {
        return $this->role === 'seller';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function sellerProfile(): HasOne
    {
        return $this->hasOne(SellerProfile::class);
    }

    public function company(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'buyer_id');
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Order::class, 'seller_id');
    }

    public function gamificationStat(): HasOne
    {
        return $this->hasOne(GamificationStat::class);
    }
}
