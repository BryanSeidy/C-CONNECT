<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->integer('stock_reserve')->default(0)->after('stock')
                ->comment('Quantité réservée sur commandes en cours');
            $table->integer('stock_minimum')->default(5)->after('stock_reserve')
                ->comment('Seuil d\'alerte pour stock bas');
            $table->string('unite')->default('kg')->after('stock_minimum')
                ->comment('kg, tonnes, litres, sacs, caisses, unites');
            $table->decimal('prix_minimum_commande', 12, 2)->nullable()->after('prix')
                ->comment('Montant minimum de commande en XAF');
            $table->decimal('quantite_minimum', 10, 2)->nullable()->after('prix_minimum_commande')
                ->comment('Quantité minimum de commande');
            $table->boolean('disponible')->default(true)->after('statut')
                ->comment('Calculé depuis stock - stock_reserve > stock_minimum');

            $table->index('disponible');
            $table->index(['statut', 'disponible', 'region']);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->dropColumn([
                'stock_reserve',
                'stock_minimum',
                'unite',
                'prix_minimum_commande',
                'quantite_minimum',
                'disponible',
            ]);
        });
    }
};
