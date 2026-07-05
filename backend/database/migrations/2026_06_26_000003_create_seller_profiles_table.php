<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seller_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->unique();
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->string('business_name');
            $table->string('slug')->unique();
            $table->text('biographie')->nullable();
            $table->string('region');
            $table->string('ville')->nullable();
            $table->string('adresse')->nullable();
            $table->string('telephone_boutique')->nullable();
            $table->string('logo')->nullable();
            $table->string('banniere')->nullable();

            // Champs d'impact SND30
            $table->boolean('is_female_owned')->default(false);
            $table->boolean('is_local_producer')->default(false);
            $table->boolean('is_cooperative')->default(false);

            // Gamification vendeur
            $table->decimal('quality_score', 3, 2)->default(0.00);
            $table->integer('total_sales')->default(0);
            $table->integer('total_products')->default(0);

            // Vérification
            $table->enum('verification_status', ['unverified', 'pending', 'verified', 'rejected'])
                ->default('unverified');
            $table->timestamp('verified_at')->nullable();
            $table->uuid('verified_by')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('region');
            $table->index('is_female_owned');
            $table->index('is_local_producer');
            $table->index('verification_status');
            $table->index('quality_score');
            $table->index('total_sales');
        });

        DB::statement("COMMENT ON TABLE seller_profiles IS 'Profils vendeurs et producteurs de C-Connect'");
    }

    public function down(): void
    {
        Schema::dropIfExists('seller_profiles');
    }
};
