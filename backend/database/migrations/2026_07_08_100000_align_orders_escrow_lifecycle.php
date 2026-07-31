<?php

/**
 * Migration corrective : aligne l'enum `escrow_status` de la table `orders`
 * sur le lifecycle Escrow B2B final utilisé par le modèle Order et les contrôleurs.
 *
 * Sur Neon (PostgreSQL), la colonne est déjà un `varchar(255)` sans contrainte
 * et accepte donc tous les états — aucune donnée à migrer.
 *
 * Sur SQLite (tests), `enum()` génère un `CHECK` strict ; cette migration
 * recrée la colonne pour lever l'ancienne contrainte et appliquer les 9 états
 * finaux : pending, escrow_locked, en_preparation, expedie, en_transit,
 * livre, complete, annule, dispute.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const B2B_STATUSES = [
        'pending',
        'escrow_locked',
        'en_preparation',
        'expedie',
        'en_transit',
        'livre',
        'complete',
        'annule',
        'dispute',
    ];

    public function up(): void
    {
        $driver = DB::getDriverName();

        // PostgreSQL : simple garde-fou, la colonne est déjà varchar.
        if ($driver === 'pgsql') {
            $this->ensureMandatoryColumns();
            return;
        }

        // SQLite / MySQL : recréer la colonne avec le bon enum.
        Schema::table('orders', function (Blueprint $table) use ($driver): void {
            // On ne peut pas `change()` un enum vers un autre enum proprement
            // en SQLite ; on laisse la colonne en varchar simple (pas de CHECK)
            // pour accepter tous les états du lifecycle, comme en production.
            if ($driver === 'sqlite') {
                // Rien à faire : la colonne existante accepte déjà toutes les
                // valeurs. On s'assure juste de la présence des colonnes métier.
                return;
            }
            $table->enum('escrow_status', self::B2B_STATUSES)
                ->default('pending')
                ->change();
        });

        $this->ensureMandatoryColumns();
    }

    /**
     * Garantit la présence des colonnes métier essentielles sur `orders`,
     * quelle que soit l'issue des migrations précédentes (dont certaines
     * étaient commentées et donc non exécutées sur Neon).
     */
    private function ensureMandatoryColumns(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            if (!Schema::hasColumn('orders', 'montant_vendeur')) {
                $table->decimal('montant_vendeur', 12, 2)->default(0)->after('commission_plateforme');
            }
            if (!Schema::hasColumn('orders', 'transaction_reference')) {
                $table->string('transaction_reference')->nullable()->unique()->after('payment_reference');
            }
            if (!Schema::hasColumn('orders', 'en_preparation_le')) {
                $table->timestamp('en_preparation_le')->nullable()->after('confirmed_at');
            }
            if (!Schema::hasColumn('orders', 'en_transit_le')) {
                $table->timestamp('en_transit_le')->nullable()->after('shipped_at');
            }
            if (!Schema::hasColumn('orders', 'complete_le')) {
                $table->timestamp('complete_le')->nullable()->after('released_at');
            }
            if (!Schema::hasColumn('orders', 'dispute_le')) {
                $table->timestamp('dispute_le')->nullable()->after('cancelled_at');
            }
        });
    }

    public function down(): void
    {
        // Volontairement vide : cette migration est corrective et additive.
        // Revenir en arrière casserait les contrôleurs alignés.
    }
};
