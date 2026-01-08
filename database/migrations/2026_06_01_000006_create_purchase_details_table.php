<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_details', function (Blueprint $table) {
            $table->id('purchase_detail_id');
            
            // Foreign Key ke String PK di purchases
            $table->string('purchase_invoice_number');
            $table->foreign('purchase_invoice_number')->references('purchase_invoice_number')->on('purchases')->onDelete('cascade');
            
            $table->string('item_code');
            $table->foreign('item_code')->references('item_code')->on('items');
            
            $table->integer('quantity');
            $table->decimal('buy_price', 15, 2);
            $table->decimal('purchase_discount_item', 15, 2)->default(0);
            $table->decimal('purchase_hasil_diskon_item', 15, 2)->default(0);
            $table->decimal('total_item_price', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_details');
    }
};