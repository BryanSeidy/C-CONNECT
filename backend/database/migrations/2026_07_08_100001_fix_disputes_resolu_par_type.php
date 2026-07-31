<?php

/**
 * Migration corrective : aligne `disputes.resolu_par` sur le type de `users.id`.
 *
 * La migration d'origine créait `resolu_par` en `uuid`, alors que `users.id`
 * est un `bigint`. La résolution d'un litige par un admin échouait donc
 * (impossible de stocker l'identifiant admin dans une colonne uuid).
 *
 * On passe la colonne en `foreignId` (bigInteger) aligné sur `users.id`.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Sur PostgreSQL, on ne peut pas directement changer le type uuid -> bigint
        // si la colonne contient des données uuid ; on drop puis recrée.
        if (Schema::hasColumn('disputes', 'resolu_par')) {
            Schema::table('disputes', function (Blueprint $table): void {
                $table->dropColumn('resolu_par');
            });
        }

        Schema::table('disputes', function (Blueprint $table): void {
            $table->foreignId('resolu_par')
                ->nullable()
                ->after('statut')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('disputes', function (Blueprint $table): void {
            $table->dropForeign(['resolu_par']);
            $table->dropColumn('resolu_par');
        });

        Schema::table('disputes', function (Blueprint $table): void {
            $table->uuid('resolu_par')->nullable()->after('statut');
        });
    }
};
