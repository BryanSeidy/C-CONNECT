<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

function run_sql($sql) {
    try {
        DB::statement($sql);
        echo "SUCCESS: " . substr($sql, 0, 50) . "...\n";
    } catch (\Exception $e) {
        echo "FAILED: " . $e->getMessage() . "\n";
    }
}

echo "Starting Manual Schema Deployment for C-CONNECT Métier...\n";

// 1. Categories
run_sql("CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name_fr VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    icon VARCHAR(255) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
)");

// 2. Seller Profiles
run_sql("CREATE TABLE IF NOT EXISTS seller_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES \"User\"(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    biographie TEXT NULL,
    region VARCHAR(255) NULL,
    is_female_owned BOOLEAN DEFAULT false,
    is_local_producer BOOLEAN DEFAULT false,
    quality_score DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
)");

// 3. Gamification Records
run_sql("CREATE TABLE IF NOT EXISTS gamification_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES \"User\"(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    quality_rating DECIMAL(3,2) DEFAULT 0.00,
    tier VARCHAR(50) DEFAULT 'Bronze',
    badges_unlocked JSONB DEFAULT '[]',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
)");

echo "Schema deployment finished.\n";
