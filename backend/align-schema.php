<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

function log_msg($msg) {
    echo "[" . date('H:i:s') . "] $msg\n";
}

try {
    log_msg("Starting Schema Alignment...");

    // 1. Align User Table
    if (!Schema::hasColumn('users', 'telephone')) {
        log_msg("Adding columns to User table...");
        Schema::table('users', function (Blueprint $table) {
            $table->string('telephone')->nullable();
            $table->string('nom')->nullable();
            $table->string('prenom')->nullable();
        });
        log_msg("User table aligned.");
    }

    // 2. Categories
    if (!Schema::hasTable('categories')) {
        log_msg("Creating categories table...");
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name_fr');
            $table->string('name_en');
            $table->string('slug')->unique();
            $table->string('icon')->nullable();
            $table->timestamps();
        });
        log_msg("Categories table created.");
    }

    // 3. Seller Profiles
    if (!Schema::hasTable('seller_profiles')) {
        log_msg("Creating seller_profiles table...");
        Schema::create('seller_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('business_name');
            $table->text('biographie')->nullable();
            $table->string('region')->nullable();
            $table->boolean('is_female_owned')->default(false);
            $table->boolean('is_local_producer')->default(false);
            $table->decimal('quality_score', 3, 2)->default(0.00);
            $table->timestamps();
        });
        log_msg("Seller Profiles table created.");
    }

    // 4. Gamification Records
    if (!Schema::hasTable('gamification_records')) {
        log_msg("Creating gamification_records table...");
        Schema::create('gamification_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('points')->default(0);
            $table->integer('total_sales')->default(0);
            $table->decimal('quality_rating', 3, 2)->default(0.00);
            $table->string('tier')->default('Bronze');
            $table->json('badges_unlocked')->nullable();
            $table->timestamps();
        });
        log_msg("Gamification Records table created.");
    }

    log_msg("Alignment completed successfully.");

} catch (\Exception $e) {
    log_msg("ERROR during alignment: " . $e->getMessage());
}
