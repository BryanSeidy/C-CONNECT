<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Spatie\Permission\Models\Role;

try {
    echo "Seeding Roles...\n";
    Role::updateOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::updateOrCreate(['name' => 'seller', 'guard_name' => 'web']);
    Role::updateOrCreate(['name' => 'buyer', 'guard_name' => 'web']);
    
    // Also for API
    Role::updateOrCreate(['name' => 'admin', 'guard_name' => 'api']);
    Role::updateOrCreate(['name' => 'seller', 'guard_name' => 'api']);
    Role::updateOrCreate(['name' => 'buyer', 'guard_name' => 'api']);
    
    echo "Roles seeded successfully.\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
