<?php

namespace App\Repositories;

use App\Models\Sales;
use App\Models\SalesDetail;
use App\Repositories\Contracts\SaleRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class SaleRepository implements SaleRepositoryInterface
{
    public function getAllSalesPaginated(int $perPage = 10, array $filters = [], int $page = 1): LengthAwarePaginator
    {
        $query = Sales::with(['sales_details.item', 'user'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(sales_invoice_code) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(customer_name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(member_code) LIKE ?', ["%{$search}%"]);
            });
        }

        if (!empty($filters['status'])) {
            $query->where('sales_status', $filters['status']);
        }

        if (!empty($filters['payment_method'])) {
            $query->where('sales_payment_method', $filters['payment_method']);
        }

        if (!empty($filters['start_date'])) {
            $query->whereDate('sales_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('sales_date', '<=', $filters['end_date']);
        }

        return $query->paginate($perPage, ['*'], 'page', $page);
    }

    public function getSalesHistory(array $filters = [], int $limit = 50): array
    {
        $query = Sales::with(['sales_details.item', 'user'])
            ->orderBy('created_at', 'desc')
            ->limit($limit);

        // Apply filters
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('sales_invoice_code', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('member_code', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('sales_status', $filters['status']);
        }

        return $query->get()->map(function ($sale) {
            return [
                'sales_invoice_code' => $sale->sales_invoice_code,
                'customer_name' => $sale->customer_name,
                'member_code' => $sale->member_code,
                'sales_date' => $sale->sales_date,
                'sales_subtotal' => (float) $sale->sales_subtotal,
                'sales_discount_value' => (float) $sale->sales_discount_value,
                'sales_hasil_discount_value' => (float) $sale->sales_hasil_discount_value,
                'sales_grand_total' => (float) $sale->sales_grand_total,
                'sales_payment_method' => $sale->sales_payment_method,
                'sales_status' => $sale->sales_status,
                'user_id' => $sale->user_id,
                'created_at' => $sale->created_at->toISOString(),
                'items' => $sale->sales_details->map(function ($detail) {
                    return [
                        'item_code' => $detail->item_code,
                        'item_name' => $detail->item->item_name ?? 'Unknown Item',
                        'sales_quantity' => $detail->sales_quantity,
                        'sell_price' => (float) $detail->sell_price,
                        'sales_discount_item' => (float) $detail->sales_discount_item,
                        'sales_hasil_diskon_item' => (float) $detail->sales_hasil_diskon_item,
                        'total_item_price' => (float) $detail->total_item_price,
                    ];
                })->toArray(),
            ];
        })->toArray();
    }

    public function getSaleWithDetails(string $invoiceCode)
    {
        return Sales::with(['sales_details.item', 'user', 'member'])
            ->where('sales_invoice_code', $invoiceCode)
            ->first();
    }

    public function createSale(array $data)
    {
        return Sales::create($data);
    }

    public function createDetail(array $data)
    {
        return SalesDetail::create($data);
    }

    public function updateSaleStatus(string $invoiceCode, int $status): bool
    {
        return Sales::where('sales_invoice_code', $invoiceCode)
            ->update(['sales_status' => $status]);
    }

    public function getLatestByPrefix(string $prefix)
    {
        return Sales::where('sales_invoice_code', 'like', $prefix . '%')
            ->orderBy('sales_invoice_code', 'desc')
            ->first();
    }

    public function getSalesStatistics(array $filters = []): array
    {
        $query = Sales::query();

        if (!empty($filters['start_date'])) {
            $query->whereDate('sales_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('sales_date', '<=', $filters['end_date']);
        }

        if (!empty($filters['status'])) {
            $query->where('sales_status', $filters['status']);
        }

        $totalSales = $query->count();
        $totalRevenue = $query->sum('sales_grand_total');
        $totalDiscount = $query->sum('sales_hasil_discount_value');
        $averageTransaction = $totalSales > 0 ? $totalRevenue / $totalSales : 0;

        return [
            'total_sales' => $totalSales,
            'total_revenue' => (float) $totalRevenue,
            'total_discount' => (float) $totalDiscount,
            'average_transaction' => (float) $averageTransaction,
        ];
    }

    public function deleteSale(string $invoiceCode): bool
    {
        return Sales::where('sales_invoice_code', $invoiceCode)->delete();
    }
}