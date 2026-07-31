<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\ProductReviewed;
use App\Services\GamificationService;

class AwardPointsForReview
{
    public function __construct(private readonly GamificationService $gamificationService) {}

    public function handle(ProductReviewed $event): void
    {
        // Acheteur : 10 points pour avoir laissé un avis
        $this->gamificationService->awardPoints((string) $event->reviewerId, 10);

        // Vendeur : note × 5 points + mise à jour du quality_rating
        if ($event->sellerId) {
            $ratingPoints = max(0, (int) round($event->rating * 5));
            $this->gamificationService->awardPoints((string) $event->sellerId, $ratingPoints);
            $this->gamificationService->updateQualityRating((string) $event->sellerId, (float) $event->rating);
        }
    }
}
