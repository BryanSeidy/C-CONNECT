<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gamification_stats', function (Blueprint $table): void {
            if (!Schema::hasColumn('gamification_stats', 'volume_ventes')) {
                $table->decimal('volume_ventes', 15, 2)->default(0)->after('total_sales');
            }
        });
    }

    public function down(): void
    {
        Schema::table('gamification_stats', function (Blueprint $table): void {
            $table->dropColumn('volume_ventes');
        });
    }
};
