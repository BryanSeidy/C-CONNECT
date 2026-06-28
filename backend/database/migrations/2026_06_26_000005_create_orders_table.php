<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Acheteur
            $table->uuid('buyer_id');
            $table->foreign('buyer_id')
                ->references('id')
                ->on('users')
                ->onDelete('restrict');

            // Vendeur (pour le calcul de commission et les stats vendeur)
            $table->uuid('seller_id');
            $table->foreign('seller_id')
                ->references('id')
                ->on('seller_profiles')
                ->onDelete('restrict');

            // Informations financières
            $table->decimal('montant_total', 12, 2);
            $table->decimal('commission_plateforme', 12, 2)->default(0);
            $table->decimal('montant_vendeur', 12, 2)->default(0);

            // Statut de la commande (aligné sur l'Escrow)
            $table->enum('escrow_status', [
                'pending',
                'escrow_locked',
                'confirmed',
                'shipped',
                'delivered',
                'released',
                'disputed',
                'cancelled',
                'refunded'
            ])->default('pending');

            // Fournisseur de paiement
            $table->string('payment_provider')->nullable(); // 'mtn_momo', 'orange_money'
            $table->string('payment_reference')->nullable(); // Référence externe de la transaction
            $table->string('payment_status')->nullable();   // Statut retourné par le provider

            // Livraison
            $table->text('adresse_livraison')->nullable();
            $table->string('ville_livraison')->nullable();
            $table->string('telephone_livraison')->nullable();
            $table->date('date_livraison_estimee')->nullable();

            // Timestamps
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();


            $table->timestamps();
            $table->softDeletes();

            // Index
            $table->index('buyer_id');
            $table->index('seller_id');
            $table->index('escrow_status');
            $table->index('payment_provider');
            $table->index('payment_reference');
            $table->index('paid_at');
        });

        DB::statement("COMMENT ON TABLE orders IS 'Commandes avec workflow Escrow - C-Connect'");
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
