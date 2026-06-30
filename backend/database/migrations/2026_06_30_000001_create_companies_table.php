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
        Schema::create('companies', function (Blueprint $table): void {
            $table->uuid('id')->primary();

            // Identité légale
            $table->string('nom');
            $table->string('slug')->unique();
            $table->string('rccm')->nullable()->comment('Registre du Commerce et du Crédit Mobilier');
            $table->string('niu')->nullable()->comment('Numéro d\'Identifiant Unique fiscal');
            $table->enum('type_entreprise', [
                'cooperative',
                'producteur',
                'fabricant',
                'restaurant',
                'hotel',
                'supermarche',
                'grossiste',
                'distributeur',
                'ong',
                'institution',
                'pme',
                'autre',
            ])->default('autre');

            // Localisation
            $table->string('ville')->nullable();
            $table->string('quartier')->nullable();
            $table->string('region')->nullable();

            // Contact
            $table->string('telephone')->nullable();
            $table->string('email_professionnel')->nullable();
            $table->string('site_web')->nullable();

            // Présentation
            $table->text('description')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('banniere_url')->nullable();
            $table->json('certifications')->nullable()->comment('Liste des certifications officielles');

            // Badges de confiance
            $table->boolean('badge_entreprise_verifiee')->default(false);
            $table->boolean('badge_cooperative_verifiee')->default(false);
            $table->boolean('badge_femmes_entrepreneures')->default(false);
            $table->boolean('badge_made_in_cameroon')->default(false);

            // Métriques dynamiques
            $table->integer('trust_score')->default(50)->comment('Score de confiance 0-100');
            $table->integer('total_transactions')->default(0);
            $table->decimal('volume_transactions', 15, 2)->default(0);

            // Statut de vérification
            $table->enum('statut_verification', ['non_verifie', 'en_attente', 'verifie', 'rejete'])
                ->default('non_verifie');
            $table->timestamp('verifie_le')->nullable();
            $table->uuid('verifie_par')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('region');
            $table->index('type_entreprise');
            $table->index('statut_verification');
            $table->index('badge_entreprise_verifiee');
            $table->index('badge_cooperative_verifiee');
            $table->index('badge_femmes_entrepreneures');
            $table->index('trust_score');
        });

        DB::statement("COMMENT ON TABLE companies IS 'Entités commerciales B2B — C-Connect'");
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
