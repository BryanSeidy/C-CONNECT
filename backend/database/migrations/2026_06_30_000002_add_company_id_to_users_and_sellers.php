<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->foreignId('company_id')
                ->nullable()
                ->after('role')
                ->constrained('companies')
                ->onDelete('set null');
            $table->index('company_id');
        });

        Schema::table('seller_profiles', function (Blueprint $table): void {
            $table->foreignId('company_id')->nullable()->after('user_id')
                ->constrained('companies')
                ->onDelete('set null');
            $table->string('rccm')->nullable()->after('company_id');
            $table->string('niu')->nullable()->after('rccm');
            $table->index('company_id');
        });
    }

    public function down(): void
    {
        Schema::table('seller_profiles', function (Blueprint $table): void {
            $table->dropConstrainedForeignIdFor(['company_id']);
            $table->dropColumn(['company_id', 'rccm', 'niu']);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropConstrainedForeignIdFor(['company_id']);
            $table->dropColumn('company_id');
        });
    }
};
