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
            $table->id();
            $table->string('sync_ref')->unique();
            $table->boolean('synced')->default(true);

            $table->foreignId('rfq_id')
                ->constrained('rfqs')
                ->cascadeOnDelete();

            $table->foreignId('seller_id')
                ->constrained('seller_profiles')
                ->cascadeOnDelete();

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

        // DB::statement("COMMENT ON TABLE rfq_bids IS 'Offres des fournisseurs sur les RFQ — C-Connect'");
    }

    public function down(): void
    {
        Schema::dropIfExists('rfq_bids');
    }
};
