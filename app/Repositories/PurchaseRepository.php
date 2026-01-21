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

    public function getPaginated(array $filters = [], int $perPage = 10) {
        $query = Purchase::with(['supplier', 'user']);

        // Search Filter
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            
            $query->where(function($q) use ($search) {
                // A. Cari berdasarkan No Invoice
                $q->where('purchase_invoice_number', 'ilike', '%' . $search . '%')
                
                // B. Cari berdasarkan Nama Supplier (Relasi)
                ->orWhereHas('supplier', function($sq) use ($search) {
                    $sq->where('supplier_name', 'ilike', '%' . $search . '%');
                })
                
                // C. Cari berdasarkan Nama User/Operator (Relasi)
                ->orWhereHas('user', function($uq) use ($search) {
                    $uq->where('user_name', 'ilike', '%' . $search . '%');
                });

                // D. (Opsional) Cari berdasarkan Tanggal jika input format tanggal (YYYY-MM-DD)
                if (preg_match("/^\d{4}-\d{2}-\d{2}$/", $search)) {
                   $q->orWhereDate('purchase_date', $search);
                }
            });       
        } 

        // Date Range Filter
        if(!empty($filters['start_date'])) {
            $query->whereDate('purchase_date', '>=', $filters['start_date']);
        }
        if(!empty($filters['end_date'])) {
            $query->whereDate('purchase_date', '<=', $filters['end_date']);
        }

        // Supplier Filter
        if(!empty($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }

        // Operator/User Filter
        if(!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        // Price Range Filter
        if(!empty($filters['min_total'])) {
            $query->where('purchase_grand_total', '>=', $filters['min_total']);
        }
        if(!empty($filters['max_total'])) {
            $query->where('purchase_grand_total', '<=', $filters['max_total']);
        }

        return $query->orderBy('purchase_date', 'desc')->orderBy('purchase_invoice_number', 'desc')
                     ->paginate($perPage);
    }
}