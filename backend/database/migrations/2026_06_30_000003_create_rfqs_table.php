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
        Schema::create('rfqs', function (Blueprint $table): void {
            $table->uuid('id')->primary();

            $table->uuid('buyer_id');
            $table->foreign('buyer_id')->references('id')->on('users')->onDelete('cascade');

            $table->uuid('category_id')->nullable();
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');

            // Détails de la demande
            $table->string('titre');
            $table->text('description');
            $table->decimal('quantite', 12, 2);
            $table->string('unite')->default('kg')->comment('kg, tonnes, sacs, caisses, litres, unites');
            $table->decimal('budget_max', 15, 2)->nullable()->comment('Budget maximum par unité en XAF');
            $table->string('region_livraison')->nullable();
            $table->string('ville_livraison')->nullable();
            $table->date('delai_livraison')->nullable()->comment('Date limite souhaitée');
            $table->date('expire_le')->nullable()->comment('Date d\'expiration de la RFQ');

            // Exigences de confiance
            $table->boolean('vendeur_verifie_requis')->default(false);
            $table->boolean('cooperative_uniquement')->default(false);
            $table->boolean('femmes_entrepreneures_prefere')->default(false);

            $table->enum('statut', ['active', 'en_negociation', 'satisfaite', 'expiree', 'annulee'])
                ->default('active');

            $table->integer('nombre_offres')->default(0)->comment('Compteur dénormalisé');

            $table->timestamps();
            $table->softDeletes();

            $table->index('buyer_id');
            $table->index('category_id');
            $table->index('statut');
            $table->index('region_livraison');
            $table->index('expire_le');
        });

        DB::statement("COMMENT ON TABLE rfqs IS 'Demandes de Devis B2B (Request For Quotation) — C-Connect'");
    }

    public function down(): void
    {
        Schema::dropIfExists('rfqs');
    }
};
