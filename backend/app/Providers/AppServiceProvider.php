<?php

declare(strict_types=1);

namespace App\Providers;

use App\Events\FundsReleased;
use App\Events\OrderCompleted;
use App\Events\ProductReviewed;
use App\Listeners\AwardPointsForCompletedOrder;
use App\Listeners\AwardPointsForReview;
use App\Listeners\DispatchOrderCompletedOnRelease;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Escrow libéré → marquer la commande comme complète → gamification
        Event::listen(FundsReleased::class, DispatchOrderCompletedOnRelease::class);

        // Commande complétée → attribuer les points
        Event::listen(OrderCompleted::class, AwardPointsForCompletedOrder::class);

        // Avis déposé → attribuer les points + mise à jour qualité
        Event::listen(ProductReviewed::class, AwardPointsForReview::class);
    }
}
