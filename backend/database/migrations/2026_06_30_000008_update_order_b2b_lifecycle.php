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
        // PostgreSQL: rename old column, create new enum with B2B lifecycle values
        DB::statement("ALTER TABLE orders RENAME COLUMN escrow_status TO escrow_status_old");

        DB::statement("
            ALTER TABLE orders
            ADD COLUMN escrow_status VARCHAR(30)
            CHECK (escrow_status IN (
                'pending',
                'escrow_locked',
                'en_preparation',
                'expedie',
                'en_transit',
                'livre',
                'complete',
                'annule',
                'dispute'
            ))
            NOT NULL DEFAULT 'pending'
        ");

        // Migrate existing data
        DB::statement("
            UPDATE orders SET escrow_status = CASE escrow_status_old
                WHEN 'pending'       THEN 'pending'
                WHEN 'escrow_locked' THEN 'escrow_locked'
                WHEN 'confirmed'     THEN 'en_preparation'
                WHEN 'shipped'       THEN 'expedie'
                WHEN 'delivered'     THEN 'livre'
                WHEN 'released'      THEN 'complete'
                WHEN 'disputed'      THEN 'dispute'
                WHEN 'cancelled'     THEN 'annule'
                WHEN 'refunded'      THEN 'annule'
                ELSE 'pending'
            END
        ");

        DB::statement("ALTER TABLE orders DROP COLUMN escrow_status_old");

        // Add B2B lifecycle timestamps
        Schema::table('orders', function (Blueprint $table): void {
            $table->timestamp('en_preparation_le')->nullable()->after('confirmed_at');
            $table->timestamp('en_transit_le')->nullable()->after('shipped_at');
            $table->timestamp('complete_le')->nullable()->after('released_at');
            $table->timestamp('dispute_le')->nullable()->after('cancelled_at');

            // Commission fields (ensure they exist)
            if (!Schema::hasColumn('orders', 'commission_plateforme')) {
                $table->decimal('commission_plateforme', 12, 2)->default(0)->after('montant_total');
            }
            if (!Schema::hasColumn('orders', 'montant_vendeur')) {
                $table->decimal('montant_vendeur', 12, 2)->default(0)->after('commission_plateforme');
            }
        });

        DB::statement("CREATE INDEX IF NOT EXISTS orders_escrow_status_idx ON orders (escrow_status)");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE orders RENAME COLUMN escrow_status TO escrow_status_b2b");
        DB::statement("
            ALTER TABLE orders
            ADD COLUMN escrow_status VARCHAR(20)
            CHECK (escrow_status IN ('pending','escrow_locked','confirmed','shipped','delivered','released','disputed','cancelled','refunded'))
            NOT NULL DEFAULT 'pending'
        ");
        DB::statement("
            UPDATE orders SET escrow_status = CASE escrow_status_b2b
                WHEN 'pending'       THEN 'pending'
                WHEN 'escrow_locked' THEN 'escrow_locked'
                WHEN 'en_preparation' THEN 'confirmed'
                WHEN 'expedie'       THEN 'shipped'
                WHEN 'en_transit'    THEN 'shipped'
                WHEN 'livre'         THEN 'delivered'
                WHEN 'complete'      THEN 'released'
                WHEN 'annule'        THEN 'cancelled'
                WHEN 'dispute'       THEN 'disputed'
                ELSE 'pending'
            END
        ");
        DB::statement("ALTER TABLE orders DROP COLUMN escrow_status_b2b");

        Schema::table('orders', function (Blueprint $table): void {
            $table->dropColumn(['en_preparation_le', 'en_transit_le', 'complete_le', 'dispute_le']);
        });
    }
};
