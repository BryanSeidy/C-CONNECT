<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migration de hardening multi-base.
 *
 * Ajoute sur chaque table core :
 *   sync_ref  — identifiant unique cross-base (UUID v4), evite les collisions
 *               entre mutations locales SQLite et Neon PostgreSQL
 *   synced    — false = mutation offline non encore reconciliee avec Neon
 *
 * Ajoute sur users :
 *   social_provider / social_id — pour OAuth (Google, etc.)
 *   password nullable — comptes OAuth sans mot de passe traditionnel
 *
 * Guards SQLite sur les index exclusifs PostgreSQL :
 *   fullText — non supporte par SQLite, encapsule dans un bloc conditionnel.
 */
return new class extends Migration
{
    private const TABLES = [
        'users',
        'seller_profiles',
        'products',
        'orders',
        'gamification_stats',
        'companies',
        'rfqs',
        'disputes',
        'recurring_orders',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $t) use ($table): void {
                // sync_ref — UUID unique cross-environment
                if (!Schema::hasColumn($table, 'sync_ref')) {
                    $t->string('sync_ref', 36)
                        ->nullable()
                        ->unique()
                        ->comment('UUID cross-base pour reconciliation offline/online');
                }

                // synced — false = mutation offline en attente de reconciliation
                if (!Schema::hasColumn($table, 'synced')) {
                    $t->boolean('synced')
                        ->default(true)
                        ->comment('false = cree/modifie offline, non encore reconcilie avec Neon');
                }

                // soft deletes si absents
                if (!Schema::hasColumn($table, 'deleted_at')) {
                    $t->softDeletes();
                }
            });
        }

        // OAuth columns sur users
        Schema::table('users', function (Blueprint $t): void {
            if (!Schema::hasColumn('users', 'social_provider')) {
                $t->string('social_provider')->nullable()->after('password')
                    ->comment('Provider OAuth : google, facebook, etc.');
            }
            if (!Schema::hasColumn('users', 'social_id')) {
                $t->string('social_id')->nullable()->after('social_provider')
                    ->comment('ID unique retourne par le provider OAuth');
            }

            // Rendre le password nullable pour les comptes OAuth
            $t->string('password')->nullable()->change();
        });

        // transaction_reference sur orders pour idempotence paiement
        if (!Schema::hasColumn('orders', 'transaction_reference')) {
            Schema::table('orders', function (Blueprint $t): void {
                $t->string('transaction_reference')->nullable()->unique()->after('payment_reference')
                    ->comment('Reference externe unique du provider de paiement — idempotence webhook');
            });
        }

        // Guard SQLite : fullText sur products (uniquement PostgreSQL/MySQL)
        if (DB::getDriverName() !== 'sqlite') {
            try {
                DB::statement('CREATE INDEX IF NOT EXISTS products_fulltext_idx ON products USING gin(to_tsvector(\'french\', nom || \' \' || COALESCE(description, \'\')))');
            } catch (\Throwable) {
                // Index deja present ou non supporte — silencieux
            }
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $t) use ($table): void {
                $toDrop = [];
                foreach (['sync_ref', 'synced', 'deleted_at'] as $col) {
                    if (Schema::hasColumn($table, $col)) {
                        $toDrop[] = $col;
                    }
                }
                if (!empty($toDrop)) {
                    $t->dropColumn($toDrop);
                }
            });
        }

        Schema::table('users', function (Blueprint $t): void {
            foreach (['social_provider', 'social_id'] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $t->dropColumn($col);
                }
            }
        });
    }
};
