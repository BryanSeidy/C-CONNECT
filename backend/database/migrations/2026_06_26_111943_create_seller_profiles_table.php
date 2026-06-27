<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('seller_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('User')->onDelete('cascade');
            $table->string('business_name');
            $table->text('biographie')->nullable();
            $table->string('region')->nullable();
            $table->boolean('is_female_owned')->default(false);
            $table->boolean('is_local_producer')->default(false);
            $table->decimal('quality_score', 3, 2)->default(0.00);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seller_profiles');
    }
};
