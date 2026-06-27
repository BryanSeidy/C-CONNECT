<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

function try_sql($sql) {
    try {
        DB::statement($sql);
        echo "SUCCESS: $sql\n";
    } catch (\Exception $e) {
        echo "FAIL: $sql -> " . $e->getMessage() . "\n";
    }
}

echo "Force Aligning 'User' table...\n";

// Add and rename columns. Using double quotes for table and column names to ensure case sensitivity compliance.
try_sql("ALTER TABLE \"User\" ADD COLUMN IF NOT EXISTS nom VARCHAR(255)");
try_sql("ALTER TABLE \"User\" ADD COLUMN IF NOT EXISTS prenom VARCHAR(255)");
try_sql("ALTER TABLE \"User\" ADD COLUMN IF NOT EXISTS telephone VARCHAR(255)");
try_sql("ALTER TABLE \"User\" ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NULL");
try_sql("ALTER TABLE \"User\" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL");

// Transfer data if possible
try_sql("UPDATE \"User\" SET nom = \"fullName\" WHERE nom IS NULL AND \"fullName\" IS NOT NULL");
try_sql("UPDATE \"User\" SET created_at = \"createdAt\" WHERE created_at IS NULL AND \"createdAt\" IS NOT NULL");
try_sql("UPDATE \"User\" SET updated_at = \"updatedAt\" WHERE updated_at IS NULL AND \"updatedAt\" IS NOT NULL");

echo "Force Alignment Done.\n";
