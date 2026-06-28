<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('buyer_id');
            $table->foreign('buyer_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->uuid('product_id');
            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->onDelete('cascade');

            $table->uuid('order_id')->nullable();
            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->onDelete('set null');

            $table->integer('note'); // 1 à 5
            $table->text('commentaire')->nullable();
            $table->boolean('is_verified_purchase')->default(false);

            $table->timestamps();

            $table->unique(['buyer_id', 'product_id']); // Un seul avis par produit par acheteur
            $table->index('product_id');
            $table->index('note');
        });

        DB::statement("COMMENT ON TABLE reviews IS 'Avis et notations des produits - C-Connect'");
        DB::statement("ALTER TABLE reviews ADD CONSTRAINT check_note_range CHECK (note >= 1 AND note <= 5)");
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
