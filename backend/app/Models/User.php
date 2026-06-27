<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    protected $table = 'User';

    // The DB uses camelCase timestamps
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    protected $fillable = [
        'email',
        'password',
        'fullName',
        'companyName',
        'country',
        'role',
        'isVerified',
        'nom',
        'prenom',
        'telephone',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'isVerified' => 'boolean',
        ];
    }

    public function gamificationRecord()
    {
        return $this->hasOne(GamificationRecord::class);
    }

    public function sellerProfile()
    {
        return $this->hasOne(SellerProfile::class);
    }
}
