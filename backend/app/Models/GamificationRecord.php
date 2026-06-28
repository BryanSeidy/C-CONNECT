<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class GamificationRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'points', 'total_sales', 'quality_rating', 'tier', 'badges_unlocked'
    ];

    protected $casts = [
        'badges_unlocked' => 'array'
    ];

    public function checkBadges()
    {
        $sellerProfile = $this->user->sellerProfile;
        if (!$sellerProfile) return;

        $newBadges = [];
        if ($sellerProfile->is_female_owned) $newBadges[] = 'Woman Pioneer';
        if ($sellerProfile->is_local_producer) $newBadges[] = 'Made in Cameroon';
        
        if ($this->total_sales >= 100) $newBadges[] = 'Camer Champion';

        $this->badges_unlocked = array_unique(array_merge($this->badges_unlocked ?? [], $newBadges));
        $this->save();
    }
}
