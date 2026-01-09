<?php

namespace App\Services;

use App\Models\Item;
use App\Models\Purchase;
use App\Models\Sale;

class CodeGeneratorService
{
    public function generateItemCode(): string
    {
        $latest = Item::orderBy('item_code', 'desc')->first();
        
        if (!$latest) {
            return 'ITM00001';
        }

        $number = intval(substr($latest->item_code, 3)) + 1;
        return 'ITM' . str_pad($number, 5, '0', STR_PAD_LEFT);
    }

    public function generateSalesInvoiceCode(): string
    {
        $prefix = 'INV-S' . date('y') . date('m');
        
        $latest = Sale::where('sales_invoice_code', 'like', $prefix . '%')
            ->orderBy('sales_invoice_code', 'desc')
            ->first();

        $number = $latest ? intval(substr($latest->sales_invoice_code, -4)) + 1 : 1;
        
        return $prefix . str_pad($number, 4, '0', STR_PAD_LEFT);
    }

    public function generatePurchaseInvoiceCode(): string
    {
        $prefix = 'INV-P' . date('y') . date('m');
        
        $latest = Purchase::where('purchase_invoice_number', 'like', $prefix . '%')
            ->orderBy('purchase_invoice_number', 'desc')
            ->first();

        $number = $latest ? intval(substr($latest->purchase_invoice_number, -4)) + 1 : 1;
        
        return $prefix . str_pad($number, 4, '0', STR_PAD_LEFT);
    }
}
