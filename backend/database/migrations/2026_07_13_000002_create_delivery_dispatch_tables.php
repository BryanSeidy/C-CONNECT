<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Livreurs sous-traitants — pas des utilisateurs de la plateforme
        // (pas de compte/login), gérés par l'admin. Contact par email pour
        // l'instant (voir DeliveryDispatchService) : pas d'intégration SMS
        // faute de credentials fournisseur (Twilio ou équivalent local).
        Schema::create('delivery_partners', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->string('nom');
            $table->string('telephone');
            $table->string('email')->nullable();
            $table->string('region'); // zone de couverture — mêmes valeurs que companies.region
            $table->boolean('actif')->default(true);
            $table->unsignedInteger('livraisons_en_cours')->default(0); // pour la répartition round-robin
            $table->timestamps();

            $table->index(['region', 'actif']);
        });

        Schema::create('delivery_requests', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('delivery_partner_id')->nullable()->constrained('delivery_partners')->nullOnDelete();
            $table->decimal('frais_livraison', 10, 2)->default(0);
            $table->string('ville_livraison');
            $table->string('adresse_livraison')->nullable();
            $table->string('telephone_livraison');
            $table->enum('statut', [
                'en_attente_assignation', // aucun livreur dispo trouvé
                'assignee',               // livreur notifié, pas encore répondu
                'acceptee',
                'refusee',
                'en_transit',
                'livree',
                'echouee',
            ])->default('en_attente_assignation');
            $table->string('token_reponse', 64)->unique(); // lien signé public pour accepter/refuser sans compte
            $table->timestamp('assignee_le')->nullable();
            $table->timestamp('repondue_le')->nullable();
            $table->timestamp('livree_le')->nullable();
            $table->timestamps();

            $table->index('statut');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_requests');
        Schema::dropIfExists('delivery_partners');
    }
};
