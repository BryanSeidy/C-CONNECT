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
        Schema::create('disputes', function (Blueprint $table): void {
            $table->uuid('id')->primary();

            $table->uuid('order_id');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');

            $table->uuid('initiateur_id')->comment('Utilisateur ayant ouvert le litige');
            $table->foreign('initiateur_id')->references('id')->on('users')->onDelete('cascade');

            $table->enum('raison', [
                'marchandise_non_recue',
                'qualite_non_conforme',
                'quantite_incorrecte',
                'produit_endommage',
                'retard_livraison',
                'autre',
            ])->default('autre');

            $table->text('description');
            $table->json('preuves_urls')->nullable()->comment('URLs des photos/documents justificatifs');

            $table->enum('statut', [
                'ouvert',
                'en_instruction',
                'resolu_rembourse',
                'resolu_libere',
                'clos',
            ])->default('ouvert');

            $table->text('notes_resolution')->nullable();
            $table->uuid('resolu_par')->nullable()->comment('Administrateur ayant clôturé');
            $table->timestamp('resolu_le')->nullable();

            $table->timestamps();

            $table->index('order_id');
            $table->index('initiateur_id');
            $table->index('statut');
        });

        DB::statement("COMMENT ON TABLE disputes IS 'Litiges clients et résolution d\'escrow — C-Connect'");
    }

    public function down(): void
    {
        Schema::dropIfExists('disputes');
    }
};
