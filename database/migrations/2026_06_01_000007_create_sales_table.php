<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->string('sales_invoice_code')->primary();
            
            $table->foreignId('user_id')->constrained('users', 'user_id');
            $table->string('member_code')->nullable();
            $table->foreign('member_code')->references('member_code')->on('members');
            
            $table->string('customer_name')->nullable(); // Untuk Non-Member
            $table->date('sales_date');
            $table->decimal('sales_subtotal', 15, 2);
            $table->decimal('sales_discount_value', 15, 2)->default(0);
            $table->decimal('sales_hasil_discount_value', 15, 2)->default(0);
            $table->decimal('sales_grand_total', 15, 2);
            $table->enum('sales_payment_method', ['cash', 'debit', 'qris']);
            $table->boolean('sales_status')->default(1)->comment('0: Cancelled, 1: Paid');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};