<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\OrderCompleted;
use App\Services\GamificationService;

class AwardPointsForCompletedOrder
{
    public function __construct(private readonly GamificationService $gamificationService) {}

    public function handle(OrderCompleted $event): void
    {
        $this->gamificationService->awardPoints($event->order->buyer_id, 25);
        $this->gamificationService->awardPoints($event->order->seller_id, 50);
        $this->gamificationService->updateVendorSales($event->order->seller_id);
    }
}
