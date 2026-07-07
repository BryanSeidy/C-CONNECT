<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->integerIncrements('id');
            // $table->string('sync_ref')->unique(); // Reference unique globale
            // $table->boolean('synced')->default(true);
            $table->string('nom');
            $table->string('prenom');
            $table->string('email')->unique();
            $table->string('telephone')->unique()->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('role', ['buyer', 'seller', 'admin'])->default('buyer');
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            Schema::create('password_reset_tokens', function (Blueprint $table) {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });

            $table->index('role');
            $table->index('telephone');
        });

        // DB::statement("COMMENT ON TABLE users IS 'Utilisateurs de la plateforme C-Connect'");
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
    }
};
