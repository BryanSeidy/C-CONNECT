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
        $this->gamificationService->awardPoints($event->reviewerId, 10);
        $this->gamificationService->awardPoints($event->sellerId, max(0, $event->rating) * 5);
    }
}
