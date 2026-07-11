<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Journal minimal des événements paiement.
 *
 * Chaque interaction avec un agrégateur de paiement (initiation, callback,
 * doublon idempotent, échec de signature) est enregistrée ici pour
 * la traçabilité, le debugging et la réconciliation comptable.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_events', function (Blueprint $table) {
            $table->id();

            // Lien optionnel vers la commande (null si la commande n'a pas été trouvée)
            $table->foreignId('order_id')
                ->nullable()
                ->constrained('orders')
                ->nullOnDelete();

            // Type d'événement
            $table->string('event_type', 50);
            // Valeurs : initiation, webhook_received, webhook_processed,
            //           webhook_idempotent, webhook_invalid_signature,
            //           webhook_amount_mismatch, webhook_offline_fallback

            // Référence de transaction (clé d'idempotence)
            $table->string('transaction_reference')->nullable()->index();

            // Fournisseur de paiement
            $table->string('provider', 30)->nullable();

            // Méthode de paiement
            $table->string('payment_method', 30)->nullable();

            // Montant impliqué
            $table->decimal('amount', 12, 2)->nullable();

            // Statut retourné par le provider ou résultat interne
            $table->string('status', 50)->nullable();

            // Payload brut (JSON) pour audit — tronqué à 2000 caractères
            $table->text('payload_snapshot')->nullable();

            // IP source du webhook
            $table->string('source_ip', 45)->nullable();

            // Résultat du traitement
            $table->boolean('success')->default(false);

            // Message d'erreur si échec
            $table->text('error_message')->nullable();

            $table->timestamps();

            // Index composite pour les requêtes de réconciliation
            $table->index(['event_type', 'created_at']);
            $table->index(['provider', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_events');
    }
};
