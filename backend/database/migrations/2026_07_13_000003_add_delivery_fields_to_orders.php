<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            // Choix de livraison à domicile fait par l'acheteur à la commande
            // (vs retrait). Si true, un livreur sous-traitant est contacté
            // automatiquement dès que le paiement est confirmé — voir
            // App\Services\DeliveryDispatchService.
            $table->boolean('livraison_demandee')->default(false)->after('telephone_livraison');
            $table->decimal('frais_livraison', 10, 2)->default(0)->after('livraison_demandee');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropColumn(['livraison_demandee', 'frais_livraison']);
        });
    }
};
