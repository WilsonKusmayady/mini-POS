<?php
namespace App\Repositories;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Repositories\Contracts\PurchaseRepositoryInterface;

class PurchaseRepository implements PurchaseRepositoryInterface {
    public function createPurchase(array $data) {
        return Purchase::create($data);
    }

    public function createDetail(array $data) {
        return PurchaseDetail::create($data);
    }

    public function getLatestByPrefix($prefix) {
        return Purchase::where('purchase_invoice_number', 'like', $prefix . '%')
        ->orderBy('purchase_invoice_number', 'desc')->first();
    }

    public function getPurchaseWithDetails($invoiceNumber) {
        return Purchase::with(['details.item', 'user', 'supplier'])
        ->where('purchase_invoice_number', $invoiceNumber)->first();
    }

    public function getAllPurchasesPaginated($perPage = 10) {
        return Purchase::with(['supplier', 'user'])->orderBy('purchase_invoice_number', 'asc')->paginate($perPage);
    }
}