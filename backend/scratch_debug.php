<?php
declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

// Force testing environment configurations
putenv('APP_ENV=testing');
putenv('DB_CONNECTION=sqlite');
putenv('DB_DATABASE=:memory:');
putenv('MAIL_MAILER=array');

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

try {
    echo "Running migrations in-memory...\n";
    Artisan::call('migrate:fresh');
    echo "Migrations done.\n";

    echo "Attempting to create a user...\n";
    $user = User::create([
        'nom' => 'Ngono',
        'prenom' => 'Marie',
        'email' => 'marie.ngono@example.cm',
        'password' => Hash::make('Password@123!'),
        'role' => 'buyer',
    ]);
    echo "User created: ID = {$user->id}, Role = {$user->role}\n";

    echo "Attempting to send verification email...\n";
    $user->sendEmailVerificationNotification();
    echo "Notification method called successfully.\n";

} catch (\Throwable $e) {
    echo "\n=== EXCEPTION CAUGHT ===\n";
    echo $e->getMessage() . "\n";
    echo $e->getFile() . ":" . $e->getLine() . "\n";
    echo $e->getTraceAsString() . "\n";
}
