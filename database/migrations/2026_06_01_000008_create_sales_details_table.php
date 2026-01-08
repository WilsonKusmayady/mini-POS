<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_details', function (Blueprint $table) {
            $table->id('sales_detail_id');
            
            $table->string('sales_invoice_code');
            $table->foreign('sales_invoice_code')->references('sales_invoice_code')->on('sales')->onDelete('cascade');

            $table->string('item_code');
            $table->foreign('item_code')->references('item_code')->on('items');
            
            $table->integer('sales_quantity');
            $table->decimal('sell_price', 15, 2);
            $table->decimal('sales_discount_item', 15, 2)->default(0);
            $table->decimal('sales_hasil_diskon_item', 15, 2)->default(0);
            $table->decimal('total_item_price', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_details');
    }
};