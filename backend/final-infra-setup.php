<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Spatie\Permission\Models\Role;

try {
    echo "Creating cache tables...\n";
    if (!Schema::hasTable('cache')) {
        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });
    }
    if (!Schema::hasTable('cache_locks')) {
        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });
    }
    
    echo "Seeding/Updating Roles...\n";
    Role::updateOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::updateOrCreate(['name' => 'seller', 'guard_name' => 'web']);
    Role::updateOrCreate(['name' => 'buyer', 'guard_name' => 'web']);
    Role::updateOrCreate(['name' => 'admin', 'guard_name' => 'api']);
    Role::updateOrCreate(['name' => 'seller', 'guard_name' => 'api']);
    Role::updateOrCreate(['name' => 'buyer', 'guard_name' => 'api']);
    
    echo "Cleanup complete.\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
