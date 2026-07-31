<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table): void {
            // Vérification automatique du FORMAT du RCCM (structure légale
            // camerounaise, ex: RC/DLA/2020/B/1234) — pas une consultation du
            // registre officiel (aucune API publique connue pour ça), mais un
            // vrai contrôle de conformité structurelle avant passage en revue
            // humaine. Voir App\Services\RccmValidator.
            $table->boolean('rccm_format_valide')->nullable()->after('rccm');
            $table->timestamp('rccm_verifie_le')->nullable()->after('rccm_format_valide');

            // Aide à l'enregistrement RCCM pour les entreprises non encore
            // immatriculées — checklist persistée pour ne pas perdre la
            // progression entre deux sessions.
            $table->enum('registration_status', ['non_demarre', 'en_cours', 'termine'])
                ->default('non_demarre')
                ->after('statut_verification');
            $table->json('registration_checklist')->nullable()->after('registration_status');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table): void {
            $table->dropColumn([
                'rccm_format_valide',
                'rccm_verifie_le',
                'registration_status',
                'registration_checklist',
            ]);
        });
    }
};
