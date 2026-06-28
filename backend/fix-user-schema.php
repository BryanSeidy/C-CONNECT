<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    echo "Aligning 'users' table schema...\n";

    // Add new columns first
    DB::statement("ALTER TABLE \"User\" ADD COLUMN IF NOT EXISTS prenom VARCHAR(255)");
    DB::statement("ALTER TABLE \"User\" ADD COLUMN IF NOT EXISTS telephone VARCHAR(255)");
    DB::statement("ALTER TABLE \"User\" ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NULL");
    DB::statement("ALTER TABLE \"User\" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL");

    // Copy data from legacy columns if they exist
    DB::statement("UPDATE \"User\" SET nom = \"fullName\" WHERE \"fullName\" IS NOT NULL AND nom IS NULL");
    DB::statement("UPDATE \"User\" SET created_at = \"createdAt\" WHERE \"createdAt\" IS NOT NULL AND created_at IS NULL");
    DB::statement("UPDATE \"User\" SET updated_at = \"updatedAt\" WHERE \"updatedAt\" IS NOT NULL AND updated_at IS NULL");

    // Rename fullName to nom if nom doesn't exist yet (already handled above by ADD/SET, but let's be explicit)
    // Actually, ALIGN-SCHEMA.PHP in previous turns might have partially run.
    
    // Check if 'nom' column exists, if not, rename 'fullName'
    $columns = DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'nom'");
    if (empty($columns)) {
        DB::statement("ALTER TABLE \"User\" RENAME COLUMN \"fullName\" TO nom");
    }

    echo "Schema alignment successful.\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
