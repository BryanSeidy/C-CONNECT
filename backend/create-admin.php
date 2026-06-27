<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

try {
    // Ensure admin role exists
    Role::updateOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::updateOrCreate(['name' => 'admin', 'guard_name' => 'api']);

    $user = User::updateOrCreate(
        ['email' => 'admin@cconnect.com'],
        [
            'nom' => 'Admin',
            'prenom' => 'C-Connect',
            'fullName' => 'Admin C-Connect',
            'password' => Hash::make('admin123'),
            'role' => 'admin'
        ]
    );

    $user->assignRole('admin');

    echo "Admin user created successfully.\n";
    echo "Email: admin@cconnect.com\n";
    echo "Password: admin123\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
