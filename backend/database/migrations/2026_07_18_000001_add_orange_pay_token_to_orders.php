<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Colonnes OMAPI pour le flux Merchant Payment Orange Money.
 * pay_token = identifiant retourné par /mp/init, utilisé pour push + status.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            if (!Schema::hasColumn('orders', 'pay_token')) {
                $table->string('pay_token', 255)->nullable()->after('transaction_reference');
                $table->index('pay_token');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            if (Schema::hasColumn('orders', 'pay_token')) {
                $table->dropIndex(['pay_token']);
                $table->dropColumn('pay_token');
            }
        });
    }
};
