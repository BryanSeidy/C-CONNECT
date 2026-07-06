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
        $order = $event->order;

        // Acheteur : 25 points fixes + bonus proportionnel au montant
        $buyerPoints = 25 + (int) floor((float) $order->montant_total / 1000);
        $this->gamificationService->awardPoints((string) $order->buyer_id, $buyerPoints);

        // Vendeur : 50 points + mise à jour ventes
        if ($order->seller_id) {
            $this->gamificationService->awardPoints((string) $order->seller_id, 50);
            $this->gamificationService->updateVendorSales(
                (string) $order->seller_id,
                (float) $order->montant_total
            );

            // Bonus productrice locale
            $sellerUser = $order->seller?->user;
            if ($sellerUser && $order->seller?->is_female_owned) {
                $this->gamificationService->awardPoints((string) $sellerUser->id, 15);
            }

            // Bonus coopérative
            if ($sellerUser && $order->seller?->is_cooperative) {
                $this->gamificationService->awardPoints((string) $sellerUser->id, 10);
            }
        }
    }
}
