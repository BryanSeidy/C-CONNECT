<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\FundsReleased;
use App\Events\OrderCompleted;

/**
 * Quand les fonds sont libérés de l'escrow, on déclenche OrderCompleted
 * pour que la gamification et les notifications s'exécutent.
 */
class DispatchOrderCompletedOnRelease
{
    public function handle(FundsReleased $event): void
    {
        OrderCompleted::dispatch($event->order);
    }
}
