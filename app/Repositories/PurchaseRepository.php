<?php
namespace App\Repositories;
use App\Models\Purchase;
use App\Models\PurchaseDetail;

class PurchaseRepository {
    public function createPurchase(array $data) {
        return Purchase::create($data);
    }

    public function createDetail(array $data) {
        return PurchaseDetail::create($data);
    }

    public function getLatestByPrefix($prefix) {
        return purchase::where('purchase_invoice_number', 'like', $prefix . '%')
        ->orderBy('purchase_invoice_number', 'desc')->first();
    }

    public function getPurchaseWithDetails($invoiceNumber) {
        return purchase::with(['details.item', 'user', 'supplier'])
        ->where('purchase_invoice_number', $invoiceNumber)->first();
    }
}