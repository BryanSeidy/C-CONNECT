<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\SellerProfile;
use App\Models\User;

class SellerDashboardPolicy
{
    public function view(User $user, SellerProfile $sellerProfile): bool
    {
        return $user->isAdmin() || ($user->isSeller() && $sellerProfile->user_id === $user->id);
    }
}
