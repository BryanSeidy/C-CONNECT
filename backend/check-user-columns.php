<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$columns = DB::select("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
echo "Columns in 'users' table:\n";
foreach ($columns as $column) {
    echo "- " . $column->column_name . "\n";
}
