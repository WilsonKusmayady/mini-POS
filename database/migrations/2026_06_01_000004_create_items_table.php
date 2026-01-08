<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->string('item_code')->primary(); // Barcode as PK
            $table->string('item_name');
            $table->text('item_description')->nullable();
            $table->decimal('item_price', 15, 2); // Harga Jual Dasar
            $table->integer('item_stock')->default(0);
            $table->integer('item_min_stock')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};