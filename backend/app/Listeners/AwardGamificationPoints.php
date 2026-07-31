<?php

namespace App\Listeners;

use App\Events\OrderPlaced;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class AwardGamificationPoints
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(OrderPlaced $event): void
    {
        $order = $event->order;
        $buyer = $order->buyer;
        $seller = $order->product ? $order->product->seller : null;

        if ($buyer) {
            $buyerRec = \App\Models\GamificationRecord::firstOrCreate(['user_id' => $buyer->id]);
            $buyerRec->increment('points', floor($order->montant_total / 1000));
        }

        if ($seller) {
            $sellerRec = \App\Models\GamificationRecord::firstOrCreate(['user_id' => $seller->id]);
            $sellerRec->increment('points', 10);
            $sellerRec->increment('total_sales', 1);
            $sellerRec->checkBadges();

            $profile = $seller->sellerProfile;
            if ($profile && ($profile->is_female_owned || $profile->is_local_producer)) {
                $sellerRec->increment('points', 15);
            }
        }
    }
}
