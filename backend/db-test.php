<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $results = DB::select('SELECT 1');
    echo "Connection successful: " . json_encode($results) . "\n";
    
    // Try to create the categories table
    Schema::create('categories_test', function ($table) {
        $table->id();
        $table->string('name');
        $table->timestamps();
    });
    echo "Table created successfully\n";
    Schema::dropIfExists('categories_test');
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
