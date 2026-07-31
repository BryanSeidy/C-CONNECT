<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fixe le bug critique identifié dans docs/ISSUES-LOG.md (2026-07-10, Claude2) :
 * OrderController::store ignorait totalement le prix négocié — un acheteur
 * négociait un tarif, obtenait un accord, puis payait quand même le prix
 * catalogue plein tarif au moment de commander. Cette colonne permet de
 * savoir si une négociation acceptée a déjà été convertie en commande,
 * pour empêcher qu'elle serve deux fois (double-dépense d'un même accord).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('negotiations', function (Blueprint $table): void {
            $table->foreignId('order_id')
                ->nullable()
                ->after('status')
                ->constrained('orders')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('negotiations', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('order_id');
        });
    }
};
