<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        User::create([
            'nom' => 'Admin',
            'prenom' => 'C-Connect',
            'email' => 'admin@cconnect.cm',
            'telephone' => '237600000000',
            'password' => Hash::make('password'), //Admin@2026!
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        // Vendeuses (femmes entrepreneures)
        $vendeuses = [
            ['nom' => 'Manga', 'prenom' => 'Cécile', 'email' => 'cecile@example.cm', 'telephone' => '237691111111'],
            ['nom' => 'Ngo', 'prenom' => 'Pauline', 'email' => 'pauline@example.cm', 'telephone' => '237692222222'],
            ['nom' => 'Fotso', 'prenom' => 'Esther', 'email' => 'esther@example.cm', 'telephone' => '237693333333'],
        ];

        foreach ($vendeuses as $v) {
            User::create([
                'nom' => $v['nom'],
                'prenom' => $v['prenom'],
                'email' => $v['email'],
                'telephone' => $v['telephone'],
                'password' => Hash::make('password'), //Password@123!
                'role' => 'seller',
                'email_verified_at' => now(),
            ]);
        }

        // Vendeurs (producteurs locaux)
        $vendeurs = [
            ['nom' => 'Tchinda', 'prenom' => 'Jean', 'email' => 'jean@example.cm', 'telephone' => '237694444444'],
            ['nom' => 'Kamga', 'prenom' => 'Pierre', 'email' => 'pierre@example.cm', 'telephone' => '237695555555'],
        ];

        foreach ($vendeurs as $v) {
            User::create([
                'nom' => $v['nom'],
                'prenom' => $v['prenom'],
                'email' => $v['email'],
                'telephone' => $v['telephone'],
                'password' => Hash::make('Password@123!'),
                'role' => 'seller',
                'email_verified_at' => now(),
            ]);
        }

        // Acheteurs
        $acheteurs = [
            ['nom' => 'Eyango', 'prenom' => 'Marie', 'email' => 'marie@example.cm', 'telephone' => '237696666666'],
            ['nom' => 'Nkoulou', 'prenom' => 'David', 'email' => 'david@example.cm', 'telephone' => '237697777777'],
            ['nom' => 'Biya', 'prenom' => 'Sophie', 'email' => 'sophie@example.cm', 'telephone' => '237698888888'],
        ];

        foreach ($acheteurs as $a) {
            User::create([
                'nom' => $a['nom'],
                'prenom' => $a['prenom'],
                'email' => $a['email'],
                'telephone' => $a['telephone'],
                'password' => Hash::make('Password@123!'),
                'role' => 'buyer',
                'email_verified_at' => now(),
            ]);
        }
    }
}
