<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The "Négociations" dashboard page and its frontend service
 * (services/negotiations.ts) have shipped since early in this branch,
 * calling GET/POST/PATCH `/negotiations` — but no route, controller,
 * model, or table for negotiations has ever existed on the backend.
 * Every request from that page 404s. This migration + the accompanying
 * model/controller/routes close that gap.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('negotiations', function (Blueprint $table): void {
            $table->bigIncrements('id');

            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();

            $table->foreignId('buyer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('seller_id')
                ->constrained('seller_profiles')
                ->cascadeOnDelete();

            $table->decimal('quantity', 12, 2);
            $table->decimal('proposed_price', 12, 2)->comment('Prix par unité proposé par l\'acheteur, en XAF');
            $table->decimal('counter_price', 12, 2)->nullable()->comment('Contre-offre du vendeur, en XAF');
            $table->text('message')->nullable();

            $table->enum('status', ['PENDING', 'ACCEPTED', 'DECLINED', 'COUNTERED'])
                ->default('PENDING');

            $table->timestamps();
            $table->softDeletes();

            $table->index('buyer_id');
            $table->index('seller_id');
            $table->index('product_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('negotiations');
    }
};
