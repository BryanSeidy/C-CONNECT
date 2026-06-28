<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('User', function (Blueprint $table) {
            $table->string('telephone')->nullable();
            $table->string('nom')->nullable();
            $table->string('prenom')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('User', function (Blueprint $table) {
            $table->dropColumn(['telephone', 'nom', 'prenom']);
        });
    }
};
