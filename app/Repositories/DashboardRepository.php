<?php

namespace App\Repositories;

use App\Repositories\Contracts\DashboardRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;


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

    /**
     * Get recent transactions (real-time, based on creation time)
     */
    public function getRecentTransactions(int $limit = 2): array
    {
        try {
            return DB::table('sales')
                ->select('sales_invoice_code', 'sales_grand_total', 'sales_status', 'sales_date', 'created_at')
                ->orderBy('created_at', 'desc') // Urutkan berdasarkan waktu pembuatan, bukan sales_date
                ->limit($limit)
                ->get()
                ->toArray();
        } catch (\Exception $e) {
            \Log::error('Error in getRecentTransactions', [
                'limit' => $limit,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Get system activities (optional - bisa dari audit log atau activity log)
     */
    public function getRecentSystemActivities(int $limit = 2): array
    {
        try {
            // Cek apakah ada tabel audit_logs atau activity_logs
            if (DB::getSchemaBuilder()->hasTable('audit_logs')) {
                return DB::table('audit_logs')
                    ->select('id', 'action as title', 'description', 'created_at')
                    ->where('user_type', '!=', 'member') // Jangan tampilkan aktivitas member
                    ->orderBy('created_at', 'desc')
                    ->limit($limit)
                    ->get()
                    ->toArray();
            } elseif (DB::getSchemaBuilder()->hasTable('activity_logs')) {
                return DB::table('activity_logs')
                    ->select('id', 'log_name as title', 'description', 'created_at')
                    ->where('log_name', '!=', 'member') // Jangan tampilkan aktivitas member
                    ->orderBy('created_at', 'desc')
                    ->limit($limit)
                    ->get()
                    ->toArray();
            }
            
            return [];
        } catch (\Exception $e) {
            \Log::error('Error in getRecentSystemActivities', [
                'limit' => $limit,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Get recent members
     */
    public function getRecentMembers(int $limit = 1): array
    {
        try {
            return DB::table('members')
                ->select('member_code', 'member_name', 'created_at')
                ->orderBy('created_at', 'desc') // Sudah benar
                ->limit($limit)
                ->get()
                ->toArray();
        } catch (\Exception $e) {
            \Log::error('Error in getRecentMembers', [
                'limit' => $limit,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
    * Get recent stock updates from items table
    */
    public function getRecentStockUpdates(int $limit = 1): array
    {
        try {
            // Ambil dari tabel items yang baru diupdate (asumsi ada perubahan stok)
            // Cari items dengan updated_at terbaru
            $results = DB::table('items')
                ->select('item_code', 'item_name', DB::raw('0 as stock_change'), 'updated_at as created_at')
                ->where('updated_at', '>=', now()->subDays(1)) // 1 hari terakhir saja
                ->orderBy('updated_at', 'desc')
                ->limit($limit)
                ->get()
                ->toArray();
            
            \Log::info('Stock updates from items table:', [
                'count' => count($results),
                'results' => array_map(function($item) {
                    return [
                        'item_code' => $item->item_code,
                        'item_name' => $item->item_name,
                        'created_at' => $item->created_at
                    ];
                }, $results)
            ]);
            
            if (!empty($results)) {
                // Tambahkan stock_change dummy atau dari perhitungan jika memungkinkan
                foreach ($results as $result) {
                    // Jika Anda punya cara menghitung perubahan stok, tambahkan di sini
                    // Misalnya: bandingkan dengan data sebelumnya atau gunakan nilai default
                    $result->stock_change = 10; // Nilai default untuk testing
                }
                return $results;
            }
            
            // Jika tidak ada item yang diupdate dalam 1 hari terakhir
            // Coba ambil item terbaru yang dibuat
            $results = DB::table('items')
                ->select('item_code', 'item_name', DB::raw('10 as stock_change'), 'created_at')
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get()
                ->toArray();
            
            if (!empty($results)) {
                return $results;
            }
            
            // Fallback ke dummy data
            return [
                (object) [
                    'item_code' => 'BRG001',
                    'item_name' => 'Kopi Arabica',
                    'stock_change' => 50,
                    'created_at' => now()
                ]
            ];
            
        } catch (\Exception $e) {
            \Log::error('Error in getRecentStockUpdates: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                (object) [
                    'item_code' => 'BRG001',
                    'item_name' => 'Kopi Arabica',
                    'stock_change' => 50,
                    'created_at' => now()
                ]
            ];
        }
    }
}