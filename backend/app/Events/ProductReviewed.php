<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProductReviewed
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $reviewerId,
        public readonly string $sellerId,
        public readonly int    $rating,
    ) {}
}
