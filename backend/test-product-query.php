<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Product;

try {
    $count = Product::count();
    echo "Total products: " . $count . "\n";
    if ($count > 0) {
        $first = Product::with('seller.user')->first();
        echo "First product:\n";
        echo "Nom: " . $first->nom . "\n";
        echo "Price: " . $first->prix . "\n";
        echo "Seller business: " . ($first->seller ? $first->seller->business_name : 'No seller') . "\n";
        echo "Seller user: " . ($first->seller && $first->seller->user ? $first->seller->user->nom : 'No user') . "\n";
    }
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
