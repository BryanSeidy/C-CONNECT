<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $buyer = User::updateOrCreate(['email' => 'buyer@cconnect.cm'], ['name' => 'C-Connect Buyer', 'password' => 'BuyerPass123', 'role' => 'buyer']);
        $seller = User::updateOrCreate(['email' => 'seller@cconnect.cm'], ['name' => 'C-Connect Seller', 'password' => 'SellerPass123', 'role' => 'seller']);
        User::updateOrCreate(['email' => 'admin@cconnect.cm'], ['name' => 'C-Connect Admin', 'password' => 'AdminPass123', 'role' => 'admin']);

        SellerProfile::updateOrCreate(['user_id' => $seller->id], ['business_name' => 'Made in CMR Cooperative', 'is_female_owned' => true]);
        $buyer->gamificationStat()->firstOrCreate([]);
        $seller->gamificationStat()->firstOrCreate([]);
    }
}
