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
        Schema::create('recurring_orders', function (Blueprint $table): void {
            $table->uuid('id')->primary();

            $table->uuid('buyer_id');
            $table->foreign('buyer_id')->references('id')->on('users')->onDelete('cascade');

            $table->uuid('seller_id');
            $table->foreign('seller_id')->references('id')->on('seller_profiles')->onDelete('cascade');

            $table->uuid('product_id');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');

            $table->decimal('quantite', 12, 2);
            $table->string('unite')->default('kg');

            $table->enum('frequence', ['hebdomadaire', 'bimensuelle', 'mensuelle'])
                ->default('hebdomadaire');

            $table->integer('jour_semaine')->nullable()
                ->comment('0=Dimanche, 1=Lundi ... 6=Samedi (pour hebdomadaire/bimensuelle)');
            $table->integer('jour_mois')->nullable()
                ->comment('1-28 pour les commandes mensuelles');

            $table->date('prochaine_livraison')->nullable();
            $table->date('date_fin')->nullable()->comment('Null = sans date de fin');

            $table->decimal('prix_negocie', 12, 2)->nullable()
                ->comment('Prix convenu entre les parties, sinon prix catalogue');

            $table->text('notes')->nullable();
            $table->enum('statut', ['active', 'en_pause', 'annulee', 'expiree'])
                ->default('active');

            $table->integer('total_commandes_generees')->default(0);
            $table->decimal('volume_total_xaf', 15, 2)->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->index('buyer_id');
            $table->index('seller_id');
            $table->index('product_id');
            $table->index('statut');
            $table->index('prochaine_livraison');
        });

        DB::statement("COMMENT ON TABLE recurring_orders IS 'Commandes récurrentes B2B planifiées — C-Connect'");
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_orders');
    }
};
