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
            $table->id();
            $table->string('sync_ref')->unique();
            $table->boolean('synced')->default(true);

            // Lien vers la commande
            $table->foreignId('order_id')
            ->constrained('orders')
                ->cascadeOnDelete();

            // Lien vers le produit
            $table->foreignId('product_id')
                ->constrained('products')
                ->onDelete('restrict'); // On ne supprime pas un produit déjà commandé

            // Détails de la ligne de commande
            $table->integer('quantite');
            $table->decimal('prix_unitaire', 12, 2); // Prix au moment de l'achat (historique)
            $table->decimal('sous_total', 12, 2);    // quantite * prix_unitaire

            // Informations du vendeur au moment de la commande
            $table->foreignId('seller_id')
                ->constrained('seller_profiles')
                ->onDelete('restrict');

            $table->timestamps();

            // Index
            $table->index('order_id');
            $table->index('product_id');
            $table->index('seller_id');
            $table->unique(['order_id', 'product_id']); // Un produit ne peut apparaître qu'une fois par commande
        });

        // DB::statement("COMMENT ON TABLE order_items IS 'Articles individuels de chaque commande - C-Connect'");
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
