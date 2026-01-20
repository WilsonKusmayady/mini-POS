<?php

namespace App\Repositories;

use App\Repositories\Contracts\DashboardRepositoryInterface;
use Illuminate\Support\Facades\DB;

class DashboardRepository implements DashboardRepositoryInterface
{
    /**
     * Get sales count for specific month and year
     */
    public function getSalesCount(int $month, int $year): int
    {
        try {
            return DB::table('sales')
                ->whereMonth('sales_date', $month)
                ->whereYear('sales_date', $year)
                ->where('sales_status', 1)
                ->count();
        } catch (\Exception $e) {
            \Log::error('Error in getSalesCount', [
                'month' => $month,
                'year' => $year,
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    /**
     * Get revenue for specific month and year
     */
    public function getRevenue(int $month, int $year): float
    {
        try {
            return (float) DB::table('sales')
                ->whereMonth('sales_date', $month)
                ->whereYear('sales_date', $year)
                ->where('sales_status', 1)
                ->sum('sales_grand_total');
        } catch (\Exception $e) {
            \Log::error('Error in getRevenue', [
                'month' => $month,
                'year' => $year,
                'error' => $e->getMessage()
            ]);
            return 0.0;
        }
    }

    /**
     * Get total members count
     */
    public function getTotalMembersCount(): int
    {
        try {
            return DB::table('members')->count();
        } catch (\Exception $e) {
            \Log::error('Error in getTotalMembersCount', [
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    /**
     * Get new members count for specific month and year
     */
    public function getNewMembersCount(int $month, int $year): int
    {
        try {
            return DB::table('members')
                ->whereMonth('created_at', $month)
                ->whereYear('created_at', $year)
                ->count();
        } catch (\Exception $e) {
            \Log::error('Error in getNewMembersCount', [
                'month' => $month,
                'year' => $year,
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    /**
     * Get new customers count (non-member) for specific month and year
     */
    public function getNewCustomersCount(int $month, int $year): int
    {
        try {
            return DB::table('sales')
                ->whereMonth('sales_date', $month)
                ->whereYear('sales_date', $year)
                ->where('sales_status', 1)
                ->whereNull('member_code')
                ->whereNotNull('customer_name')
                ->distinct('customer_name')
                ->count('customer_name');
        } catch (\Exception $e) {
            \Log::error('Error in getNewCustomersCount', [
                'month' => $month,
                'year' => $year,
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    /**
     * Get top selling items
     */
    public function getTopSellingItems(int $limit = 5): array
    {
        try {
            return DB::table('sales_details as sd')
                ->join('items as i', 'sd.item_code', '=', 'i.item_code')
                ->join('sales as s', 'sd.sales_invoice_code', '=', 's.sales_invoice_code')
                ->select(
                    'i.item_code',
                    'i.item_name',
                    DB::raw('SUM(sd.sales_quantity) as total_quantity'),
                    DB::raw('SUM(sd.total_item_price) as total_revenue')
                )
                ->where('s.sales_status', 1)
                ->groupBy('i.item_code', 'i.item_name')
                ->orderByDesc('total_quantity')
                ->limit($limit)
                ->get()
                ->toArray();
        } catch (\Exception $e) {
            \Log::error('Error in getTopSellingItems', [
                'limit' => $limit,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }
}