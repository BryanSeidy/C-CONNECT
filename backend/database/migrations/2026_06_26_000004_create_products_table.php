<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('seller_id');
            $table->foreign('seller_id')
                ->references('id')
                ->on('seller_profiles')
                ->onDelete('cascade');
            $table->uuid('category_id')->nullable();
            $table->foreign('category_id')
                ->references('id')
                ->on('categories')
                ->onDelete('set null');
            $table->string('nom');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('prix', 12, 2);
            $table->integer('stock')->default(0);
            $table->string('region')->nullable();
            $table->string('image_url')->nullable();
            $table->decimal('quality_rating', 3, 2)->default(0.00); // Note moyenne (ex: 4.85)
            $table->integer('reviews_count')->default(0); // Compteur dénormalisé pour la performance
            $table->integer('sales_count')->default(0);    // Compteur dénormalisé pour le ranking
            $table->enum('statut', ['active', 'pending', 'disabled', 'flagged'])
                ->default('pending');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['statut', 'category_id', 'region']);
            $table->index('seller_id');
            $table->index(['statut', 'quality_rating']);
            $table->index(['statut', 'sales_count']);
            $table->fullText(['nom', 'description']);
        });
        
        DB::statement("COMMENT ON TABLE products IS 'Catalogue des produits Made in Cameroon - C-Connect'");
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
