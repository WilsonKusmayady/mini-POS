<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->string('purchase_invoice_number')->primary();
            
            $table->foreignId('supplier_id')->constrained('suppliers', 'supplier_id');
            $table->foreignId('user_id')->constrained('users', 'user_id');
            
            $table->date('purchase_date');
            $table->decimal('purchase_subtotal', 15, 2);
            $table->decimal('purchase_discount_value', 15, 2)->default(0);
            $table->decimal('purchase_hasil_discount_value', 15, 2)->default(0);
            $table->decimal('purchase_grand_total', 15, 2);
            $table->enum('purchase_status', ['paid', 'pending', 'cancelled'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};