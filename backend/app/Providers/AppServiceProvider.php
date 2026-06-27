<?php

declare(strict_types=1);

namespace App\Providers;

use App\Events\OrderCompleted;
use App\Events\ProductReviewed;
use App\Listeners\AwardPointsForCompletedOrder;
use App\Listeners\AwardPointsForReview;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Event::listen(OrderCompleted::class, AwardPointsForCompletedOrder::class);
        Event::listen(ProductReviewed::class, AwardPointsForReview::class);
    }
}
