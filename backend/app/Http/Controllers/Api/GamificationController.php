<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GamificationStat;
use App\Services\GamificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GamificationController extends Controller
{
    public function __construct(private readonly GamificationService $gamificationService) {}

    /**
     * GET /api/gamification/me — stats & badges de l'utilisateur connecté.
     */
    public function show(Request $request): JsonResponse
    {
        $userId = (string) $request->user()->id;

        /** @var GamificationStat $stat */
        $stat = GamificationStat::firstOrCreate(['user_id' => $userId]);

        // Recalculer les badges au cas où ils seraient obsolètes
        $stat = $this->gamificationService->evaluateBadges($userId);

        return response()->json([
            'success' => true,
            'data' => [
                'points'         => $stat->points,
                'total_sales'    => $stat->total_sales,
                'volume_ventes'  => $stat->volume_ventes ?? 0,
                'quality_rating' => (float) ($stat->quality_rating ?? 0),
                'badges'         => $stat->badges_unlocked ?? [],
                'badges_meta'    => $this->buildBadgesMeta($stat->badges_unlocked ?? []),
                'next_badge'     => $this->nextBadgeHint($stat),
            ],
        ]);
    }

    private function buildBadgesMeta(array $badges): array
    {
        $definitions = [
            'woman_pioneer'    => ['label' => 'Pionnière', 'description' => 'Productrice locale — première vente réussie', 'color' => '#D9A441'],
            'trusted_producer' => ['label' => 'Fournisseur fiable', 'description' => '10 commandes complétées avec succès', 'color' => '#13352E'],
            'camer_champion'   => ['label' => 'Champion Cameroun', 'description' => '500 points d\'engagement atteints', 'color' => '#D9A441'],
            'top_seller'       => ['label' => 'Top Vendeur', 'description' => '50 ventes accomplies', 'color' => '#406A5A'],
            'quality_star'     => ['label' => 'Étoile Qualité', 'description' => 'Note moyenne de 4.5+ sur 5 ventes', 'color' => '#D9A441'],
            'cooperative_hero' => ['label' => 'Héros Coopératif', 'description' => 'Coopérative avec 5+ commandes', 'color' => '#406A5A'],
            'fast_responder'   => ['label' => 'Réactif', 'description' => 'Reconnu pour la réactivité', 'color' => '#1D6FA4'],
        ];

        return array_map(
            fn (string $code) => array_merge(['code' => $code], $definitions[$code] ?? ['label' => $code, 'color' => '#64748B']),
            $badges
        );
    }

    private function nextBadgeHint(GamificationStat $stat): ?array
    {
        if ($stat->total_sales < 10) {
            return ['badge' => 'trusted_producer', 'progress' => $stat->total_sales, 'target' => 10, 'label' => 'Fournisseur fiable'];
        }
        if ($stat->points < 500) {
            return ['badge' => 'camer_champion', 'progress' => $stat->points, 'target' => 500, 'label' => 'Champion Cameroun'];
        }
        if ($stat->total_sales < 50) {
            return ['badge' => 'top_seller', 'progress' => $stat->total_sales, 'target' => 50, 'label' => 'Top Vendeur'];
        }
        return null;
    }
}
