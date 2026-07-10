<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\GamificationStat;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * GamificationService — C-Connect Fintech Engine
 *
 * Règles métier :
 *   - Points commandite  : floor(montant / 1000) XAF par XAF dépensé
 *   - Acheteur           : +25 points à chaque commande complétée
 *   - Vendeur            : +50 points + update total_sales à chaque vente
 *   - Avis déposé        : +10 pour l'acheteur, note × 5 pour le vendeur
 *   - Bonus woman_pioneer: +15 si vendeur is_female_owned, première vente
 *   - Bonus cooperative  : +10 si is_cooperative, toutes ventes
 *
 * Badges déclenchés automatiquement par evaluateBadges().
 */
class GamificationService
{
    // ── Règles de badges ────────────────────────────────────────────────────

    private const BADGE_RULES = [
        'woman_pioneer'    => ['female_owned' => true, 'min_sales' => 1],
        'trusted_producer' => ['min_sales' => 10],
        'camer_champion'   => ['min_points' => 500],
        'top_seller'       => ['min_sales' => 50],
        'quality_star'     => ['min_rating' => 4.5, 'min_sales' => 5],
        'fast_responder'   => ['manual' => true],   // octroi manuel admin
        'cooperative_hero' => ['is_cooperative' => true, 'min_sales' => 5],
    ];

    // ── API publique ─────────────────────────────────────────────────────────

    /**
     * Attribue des points à un utilisateur (uuid string).
     */
    public function awardPoints(string $userId, int $points): GamificationStat
    {
        return DB::transaction(function () use ($userId, $points): GamificationStat {
            $stat = $this->lockedStat($userId);
            $stat->increment('points', max(0, $points));

            return $this->evaluateBadges($userId);
        });
    }

    /**
     * Incrémente total_sales et recalcule les badges du vendeur.
     */
    public function updateVendorSales(string $sellerId, float $montantTotal = 0.0): GamificationStat
    {
        return DB::transaction(function () use ($sellerId, $montantTotal): GamificationStat {
            $stat = $this->lockedStat($sellerId);
            $stat->increment('total_sales_count');

            if ($montantTotal > 0) {
                $stat->increment('volume_ventes', $montantTotal);
            }

            return $this->evaluateBadges($sellerId);
        });
    }

    /**
     * Met à jour la note qualité du vendeur (moyenne glissante).
     */
    public function updateQualityRating(string $userId, float $newRating): GamificationStat
    {
        return DB::transaction(function () use ($userId, $newRating): GamificationStat {
            $stat = $this->lockedStat($userId);

            $currentRating = (float) ($stat->quality_rating ?? 0.0);
            $salesCount    = max(1, $stat->total_sales);
            $updatedRating = (($currentRating * ($salesCount - 1)) + $newRating) / $salesCount;

            $stat->update(['quality_rating' => round($updatedRating, 2)]);

            return $this->evaluateBadges($userId);
        });
    }

    /**
     * Évalue et met à jour les badges d'un utilisateur.
     * Idempotent — ne duplique jamais un badge.
     */
    public function evaluateBadges(string $userId): GamificationStat
    {
        return DB::transaction(function () use ($userId): GamificationStat {
            $stat   = $this->lockedStat($userId);
            $badges = array_flip($stat->badges_unlocked ?? []);  // set pour O(1) lookup

            $user    = User::with('sellerProfile')->find($userId);
            $profile = $user?->sellerProfile;

            // woman_pioneer
            if (
                !isset($badges['woman_pioneer'])
                && $profile?->is_female_owned
                && $stat->total_sales >= 1
            ) {
                $badges['woman_pioneer'] = 1;
            }

            // trusted_producer
            if (!isset($badges['trusted_producer']) && $stat->total_sales >= 10) {
                $badges['trusted_producer'] = 1;
            }

            // camer_champion
            if (!isset($badges['camer_champion']) && $stat->points >= 500) {
                $badges['camer_champion'] = 1;
            }

            // top_seller
            if (!isset($badges['top_seller']) && $stat->total_sales >= 50) {
                $badges['top_seller'] = 1;
            }

            // quality_star
            if (
                !isset($badges['quality_star'])
                && (float) $stat->quality_rating >= 4.5
                && $stat->total_sales >= 5
            ) {
                $badges['quality_star'] = 1;
            }

            // cooperative_hero
            if (
                !isset($badges['cooperative_hero'])
                && $profile?->is_cooperative
                && $stat->total_sales >= 5
            ) {
                $badges['cooperative_hero'] = 1;
            }

            $stat->badges_unlocked = array_keys($badges);
            $stat->save();

            return $stat->refresh();
        });
    }

    /**
     * Retourne le stat record, le créant si absent.
     */
    private function lockedStat(string $userId): GamificationStat
    {
        return GamificationStat::query()
            ->where('user_id', $userId)
            ->lockForUpdate()
            ->first()
            ?? GamificationStat::create(['user_id' => $userId]);
    }
}
