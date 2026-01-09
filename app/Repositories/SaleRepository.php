<?php
namespace App\Repositories;
use App\Models\Sale;
use App\Models\SalesDetail;

class SaleRepository {
    public function createSale(array $data) {
        return Sale::create($data);
    }

    public function createDetail(array $data) {
        return SalesDetail::create($data);
    }

    // untuk Service Code/INVOICE
    public function getLatestByPrefix($prefix) {
        return Sale::where('sales_invoice_code', 'like', $prefix . '%')
        ->orderBy('sales_invoice_code', 'desc')->first();
    }

    public function getSaleWithDetails($invoiceCode) {
        return Sale::with(['details.item', 'user', 'member'])
        ->where('sales_invoice_code', $invoiceCode)->first();
    }
}