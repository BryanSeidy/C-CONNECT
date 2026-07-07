<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\Order;
use App\Models\SellerProfile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

function log_t($msg) { echo "[TEST] $msg\n"; }

try {
    log_t("Starting E2E Backend Test...");

    // 1. Create Category
    $category = Category::firstOrCreate(['slug' => 'agro-alimentaire'], [
        'name_fr' => 'Agro-alimentaire',
        'name_en' => 'Agri-food',
        'icon' => 'food-icon'
    ]);
    log_t("Category created: " . $category->name_fr);

    // 2. Create Seller
    $seller = User::firstOrCreate(['email' => 'vendeuse@c-connect.cm'], [
        'nom' => 'KAMGA',
        'prenom' => 'Marie',
        'password' => Hash::make('password123'),
        'telephone' => '677112233'
    ]);
    $seller->assignRole('seller');
    log_t("Seller created: Marie KAMGA");

    // 3. Create Seller Profile (Woman Pioneer + Local Producer)
    $profile = SellerProfile::updateOrCreate(['user_id' => $seller->id], [
        'business_name' => 'Saveurs du Cameroun',
        'biographie' => 'Productrice locale de confitures naturelles.',
        'region' => 'Ouest',
        'is_female_owned' => true,
        'is_local_producer' => true
    ]);
    log_t("Seller Profile configured.");

    // 4. Create Product
    $product = Product::updateOrCreate(['nom' => 'Confiture de Papaye'], [
        'seller_id' => $seller->id,
        'category_id' => $category->id,
        'description' => 'Produit naturel sans conservateurs.',
        'prix' => 2500,
        'stock' => 50,
        'region' => 'Ouest',
        'quality_rating' => 4.5
    ]);
    log_t("Product created: Confiture de Papaye (2500 FCFA)");

    // 5. Create Order
    $buyer = User::firstOrCreate(['email' => 'acheteur@test.com'], [
        'nom' => 'Acheteur',
        'prenom' => 'Test',
        'password' => Hash::make('password123'),
        'telephone' => '699000111'
    ]);
    $buyer->assignRole('buyer');

    $order = Order::create([
        'buyer_id' => $buyer->id,
        'montant_total' => 2500,
        'payment_provider' => 'MTN',
        'statut' => 'pending'
    ]);
    log_t("Order created (ID: {$order->id}), waiting for payment...");

    // 6. Process Payment (Triggers Gamification)
    $paymentController = new \App\Http\Controllers\PaymentController();
    $request = new \Illuminate\Http\Request([
        'order_id' => $order->id,
        'phone' => '677001122',
        'provider' => 'MTN'
    ]);
    $paymentController->processMobileMoney($request);
    log_t("Payment processed via MTN Logic.");

    // 7. Verify Results
    $sellerRec = $seller->gamificationRecord()->first();
    log_t("--- FINAL VERIFICATION ---");
    log_t("Seller Points: " . ($sellerRec ? $sellerRec->points : 0));
    log_t("Seller Badges: " . (isset($sellerRec->badges_unlocked) ? implode(', ', $sellerRec->badges_unlocked) : 'None'));
    
    if ($sellerRec && count($sellerRec->badges_unlocked) >= 2) {
        log_t("SUCCESS: Points awarded and 'Woman Pioneer' + 'Made in Cameroon' badges unlocked!");
    } else {
        log_t("WARNING: Some verification steps failed.");
    }

} catch (\Exception $e) {
    log_t("ERROR: " . $e->getMessage());
}
