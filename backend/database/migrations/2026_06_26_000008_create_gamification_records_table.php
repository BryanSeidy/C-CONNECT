<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gamification_records', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('user_id')->unique();
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            // Points et niveau
            $table->integer('points')->default(0);
            $table->integer('lifetime_points')->default(0);
            $table->enum('tier', ['bronze', 'silver', 'gold', 'platinum'])->default('bronze');

            // Stats vendeur (si applicable)
            $table->integer('total_sales_count')->default(0);
            $table->decimal('total_sales_amount', 12, 2)->default(0);
            $table->decimal('average_rating', 3, 2)->default(0.00);
            $table->integer('total_reviews_count')->default(0);

            // Badges débloqués
            $table->jsonb('badges_unlocked')->default('[]');

            // Stats acheteur (si applicable)
            $table->integer('total_orders_count')->default(0);
            $table->integer('total_reviews_written')->default(0);
            $table->integer('referrals_count')->default(0);

            $table->timestamps();

            $table->index('tier');
            $table->index('points');
        });

        DB::statement("COMMENT ON TABLE gamification_records IS 'Scores, badges et niveaux - Système de gamification C-Connect'");
    }

    public function down(): void
    {
        Schema::dropIfExists('gamification_records');
    }
};
