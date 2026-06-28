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
            // Add product reference if not already present
            if (! Schema::hasColumn('orders', 'product_id')) {
                $table->foreignId('product_id')
                    ->nullable()
                    ->after('seller_id')
                    ->constrained('products')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('orders', 'quantity')) {
                $table->unsignedInteger('quantity')->default(1)->after('product_id');
            }

            // Extend escrow_status enum to include shipped/received phases
            // PostgreSQL requires a raw ALTER TABLE to add enum values
            // Using string type to avoid enum migration complexity on Neon
        });

        // On PostgreSQL (Neon) we cannot alter an enum easily; instead we change to varchar
        // This is safe because we validate values at the application layer
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            Schema::getConnection()->statement(
                "ALTER TABLE orders ALTER COLUMN escrow_status TYPE VARCHAR(30)"
            );
            Schema::getConnection()->statement(
                "ALTER TABLE orders ALTER COLUMN escrow_status SET DEFAULT 'pending'"
            );
        }
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropForeign(['product_id']);
            $table->dropColumn(['product_id', 'quantity']);
        });
    }
};
