<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rfq_bids', function (Blueprint $table): void {
            $table->uuid('id')->primary();

            $table->uuid('rfq_id');
            $table->foreign('rfq_id')->references('id')->on('rfqs')->onDelete('cascade');

            $table->uuid('seller_id');
            $table->foreign('seller_id')->references('id')->on('seller_profiles')->onDelete('cascade');

            // Offre du fournisseur
            $table->decimal('prix_unitaire_propose', 12, 2)->comment('Prix par unité en XAF');
            $table->decimal('quantite_disponible', 12, 2);
            $table->date('date_livraison_proposee')->nullable();
            $table->text('message')->nullable()->comment('Note du fournisseur à l\'acheteur');
            $table->string('conditions')->nullable()->comment('Conditions particulières');

            $table->enum('statut', ['en_attente', 'acceptee', 'refusee', 'retiree'])
                ->default('en_attente');
            $table->timestamp('traitee_le')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['rfq_id', 'seller_id']);
            $table->index('rfq_id');
            $table->index('seller_id');
            $table->index('statut');
        });

        DB::statement("COMMENT ON TABLE rfq_bids IS 'Offres des fournisseurs sur les RFQ — C-Connect'");
    }

    public function down(): void
    {
        Schema::dropIfExists('rfq_bids');
    }
};
