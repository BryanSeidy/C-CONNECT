<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nom');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->index('is_active');
        });

        DB::statement("COMMENT ON TABLE categories IS 'Catégories de produits Made in Cameroon'");
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
