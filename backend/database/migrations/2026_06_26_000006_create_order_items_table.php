<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Lien vers la commande
            $table->uuid('order_id');
            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->onDelete('cascade');

            // Lien vers le produit
            $table->uuid('product_id');
            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->onDelete('restrict'); // On ne supprime pas un produit déjà commandé

            // Détails de la ligne de commande
            $table->integer('quantite');
            $table->decimal('prix_unitaire', 12, 2); // Prix au moment de l'achat (historique)
            $table->decimal('sous_total', 12, 2);    // quantite * prix_unitaire

            // Informations du vendeur au moment de la commande
            $table->uuid('seller_id');
            $table->foreign('seller_id')
                ->references('id')
                ->on('seller_profiles')
                ->onDelete('restrict');

            $table->timestamps();

            // Index
            $table->index('order_id');
            $table->index('product_id');
            $table->index('seller_id');
            $table->unique(['order_id', 'product_id']); // Un produit ne peut apparaître qu'une fois par commande
        });

        DB::statement("COMMENT ON TABLE order_items IS 'Articles individuels de chaque commande - C-Connect'");
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
