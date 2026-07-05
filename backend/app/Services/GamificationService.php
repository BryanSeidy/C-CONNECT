<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\GamificationStat;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class GamificationService
{
    public function awardPoints(int $userId, int $points): GamificationStat
    {
        return DB::transaction(function () use ($userId, $points): GamificationStat {
            $stat = $this->lockedStat($userId);
            $stat->increment('points', $points);

            return $this->evaluateBadges($userId);
        });
    }

    public function updateVendorSales(int $sellerId): GamificationStat
    {
        return DB::transaction(function () use ($sellerId): GamificationStat {
            $stat = $this->lockedStat($sellerId);
            $stat->increment('total_sales');

            return $this->evaluateBadges($sellerId);
        });
    }

    public function evaluateBadges(int $userId): GamificationStat
    {
        $stat = $this->lockedStat($userId);
        $badges = $stat->badges_unlocked ?? [];
        $user = User::with('sellerProfile')->findOrFail($userId);

        if ($stat->total_sales >= 1 && $user->sellerProfile?->is_female_owned) {
            $badges[] = 'woman_pioneer';
        }
        if ($stat->total_sales >= 10) {
            $badges[] = 'trusted_producer';
        }
        if ($stat->points >= 500) {
            $badges[] = 'camer_champion';
        }

        $stat->badges_unlocked = array_values(array_unique($badges));
        $stat->save();

        return $stat->refresh();
    }

    private function lockedStat(int $userId): GamificationStat
    {
        return GamificationStat::query()->where('user_id', $userId)->lockForUpdate()->first()
            ?? GamificationStat::create(['user_id' => $userId]);
    }
}
