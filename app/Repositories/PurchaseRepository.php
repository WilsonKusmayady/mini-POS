<?php
namespace App\Repositories;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Repositories\Contracts\PurchaseRepositoryInterface;
Use Illuminate\Support\Facades\DB;

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
        try{
            $query = Purchase::with(['supplier', 'user']);

            // Logic Filter show inactvie active
            if (!empty($filters['show_inactive']) && $filters['show_inactive'] == true) {
                $query->onlyTrashed();
            }

            // Search Filter
            if (!empty($filters['search'])) {
                $search = $filters['search'];
                
                $query->where(function($q) use ($search) {
                    $searchParams = ['purchase_invoice_number', 'supplier_name', 'user_name', 'purchase_date'];

                    foreach ($searchParams as $param) {
                        if (in_array($param, ['supplier_name', 'user_name'])) {
                            $relation = $param === 'supplier_name' ? 'supplier' : 'user';
                            $q->orWhereHas($relation, function($sq) use ($param, $search) {
                                $sq->where($param, 'ilike', '%' . $search . '%');
                            });
                        }else if($param === 'purchase_date') {
                            $q->orWhere(DB::raw("to_char(purchase_date, 'DD Mon YYYY')"), 
                            'ilike', '%' . $search . '%');
                    }
                        else {
                            $q->orWhere($param, 'ilike', '%' . $search . '%');
                        }
                    };
                });       
            } 

            return $query->orderBy('purchase_date', 'desc')
                        ->orderBy('purchase_invoice_number', 'desc')
                        ->paginate($perPage);
        } catch (\Exception $e) {
            \Log::error($e);
            return [];
        }
    }

    public function getForExport(array $filters = []) {
        $query = Purchase::with(['supplier', 'user']);

        if (!empty($filters['show_inactive']) && $filters['show_inactive'] == true) {
            $query->onlyTrashed();
        } else {
            $query->whereNull('deleted_at');
        }

        // COPY PASTE LOGIC FILTER
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('purchase_invoice_number', 'ilike', '%' . $search . '%')
                ->orWhereHas('supplier', function($sq) use ($search) {
                    $sq->where('supplier_name', 'ilike', '%' . $search . '%');
                })
                ->orWhereHas('user', function($uq) use ($search) {
                    $uq->where('user_name', 'ilike', '%' . $search . '%');
                });
                if (preg_match("/^\d{4}-\d{2}-\d{2}$/", $search)) {
                   $q->orWhereDate('purchase_date', $search);
                }
            });       
        } 
        if(!empty($filters['start_date'])) {
            $query->whereDate('purchase_date', '>=', $filters['start_date']);
        }
        if(!empty($filters['end_date'])) {
            $query->whereDate('purchase_date', '<=', $filters['end_date']);
        }
        if(!empty($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }
        if(!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }
        if(!empty($filters['min_total'])) {
            $query->where('purchase_grand_total', '>=', $filters['min_total']);
        }
        if(!empty($filters['max_total'])) {
            $query->where('purchase_grand_total', '<=', $filters['max_total']);
        }

        // Return GET (List semua data)
        return $query->orderBy('purchase_date', 'desc')
                     ->orderBy('purchase_invoice_number', 'desc')
                     ->get();
    }

    // Function Restore
    public function restore($invoiceNumber) {
        $purchase = Purchase::withTrashed()->where('purchase_invoice_number', $invoiceNumber)->first();

        if ($purchase) {
            $purchase->restore();
        }
        return $purchase;
    }

    // Logic Hide
    public function destroy($invoiceNumber) {
        $purchase = Purchase::find($invoiceNumber);
        if ($purchase) {
            $purchase->delete();
        }
        return false;
    }
}