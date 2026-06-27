<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class SellerProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'business_name', 'biographie', 'region', 
        'is_female_owned', 'is_local_producer', 'quality_score'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
