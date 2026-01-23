<?php

namespace App\Services;

use App\Repositories\Contracts\SummaryRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;
use App\Exports\SummaryExport;
use Maatwebsite\Excel\Facades\Excel;

class SummaryService
{
    protected $summaryRepository;

    public function __construct(SummaryRepositoryInterface $summaryRepository)
    {
        $this->summaryRepository = $summaryRepository;
    }

    /**
     * Get summary data
     */
    public function getSummaryData(array $params): array
    {
        $type = $params['type'] ?? 'all';
        // Pastikan tanggal valid
        $startDate = isset($params['start_date']) ? Carbon::parse($params['start_date'])->startOfDay() : Carbon::now()->startOfDay();
        $endDate = isset($params['end_date']) ? Carbon::parse($params['end_date'])->endOfDay() : Carbon::now()->endOfDay();

        if ($type === 'all' || $type === 'sales') {
            $salesSummary = $this->summaryRepository->getSalesSummary($startDate, $endDate);
        } else {
            $salesSummary = collect();
        }

        if ($type === 'all' || $type === 'purchase') {
            $purchaseSummary = $this->summaryRepository->getPurchaseSummary($startDate, $endDate);
        } else {
            $purchaseSummary = collect();
        }

        // Combine data for all transaction types
        if ($type === 'all') {
            // Gabungkan Sales & Purchase untuk tampilan utama (Net Profit/Cashflow)
            $summaryData = $this->combineTransactionData($salesSummary, $purchaseSummary);
            // Siapkan data perbandingan untuk Excel Sheet ke-2
            $transactionSummary = $this->getTransactionTypeSummary($salesSummary, $purchaseSummary);
        } elseif ($type === 'sales') {
            $summaryData = $salesSummary;
            $transactionSummary = collect();
        } else {
            // Jika hanya filter Purchase
            $summaryData = $purchaseSummary;
            $transactionSummary = collect();
        }

        return [
            'summary' => $summaryData,
            'transaction_summary' => $transactionSummary
        ];
    }

    /**
     * [NEW] Helper: Combine Sales and Purchase data by date
     * Digunakan untuk list Summary utama ketika filter = 'all'
     */
    private function combineTransactionData($sales, $purchases)
    {
        // Ambil semua tanggal unik dari kedua collection
        $dates = $sales->pluck('date')
            ->merge($purchases->pluck('date'))
            ->unique()
            ->sortDesc() // Urutkan terbaru
            ->values();

        return $dates->map(function ($date) use ($sales, $purchases) {
            $saleData = $sales->firstWhere('date', $date);
            $purchaseData = $purchases->firstWhere('date', $date);

            // Default nilai jika data tidak ada di tanggal tersebut
            $salesTotal = $saleData['total_transactions'] ?? 0;
            $purchaseTotal = $purchaseData['total_transactions'] ?? 0;
            
            $salesCount = $saleData['transaction_count'] ?? 0;
            $purchaseCount = $purchaseData['transaction_count'] ?? 0;

            // Hitung Net (Pendapatan - Pengeluaran)
            $netTotal = $salesTotal - $purchaseTotal;
            $totalCount = $salesCount + $purchaseCount;

            return [
                'date' => $date,
                'transaction_count' => $totalCount,
                'total_transactions' => $netTotal, // Total Uang (Net)
                'total_discount' => $saleData['total_discount'] ?? 0,
                'items_sold' => $saleData['items_sold'] ?? 0, // Hanya item terjual (sales)
                'average_transaction' => $totalCount > 0 ? $netTotal / $totalCount : 0,
                
                // Tambahan info agar frontend tau detailnya (opsional)
                'sales_nominal' => $salesTotal,
                'purchase_nominal' => $purchaseTotal
            ];
        });
    }

    /**
     * [NEW] Helper: Create side-by-side comparison data
     * Digunakan untuk sheet "Purchase vs Sales" di Excel
     */
    private function getTransactionTypeSummary($sales, $purchases)
    {
        $dates = $sales->pluck('date')
            ->merge($purchases->pluck('date'))
            ->unique()
            ->sortDesc()
            ->values();

        return $dates->map(function ($date) use ($sales, $purchases) {
            $saleData = $sales->firstWhere('date', $date);
            $purchaseData = $purchases->firstWhere('date', $date);

            return [
                'date' => $date,
                'sales_count' => $saleData['transaction_count'] ?? 0,
                'sales_total' => $saleData['total_transactions'] ?? 0,
                'purchase_count' => $purchaseData['transaction_count'] ?? 0,
                'purchase_total' => $purchaseData['total_transactions'] ?? 0,
                'total_discount' => $saleData['total_discount'] ?? 0,
            ];
        });
    }

    // ... Method lainnya (getSalesDetails, getTopItems, dll) tetap sama ...

    public function getSalesDetails(Carbon $date): array
    {
        $sales = $this->summaryRepository->getSalesByDate($date);
        
        $totalSales = $sales->sum('grand_total');
        $totalTransactions = $sales->count();
        $averageTransaction = $totalTransactions > 0 ? $totalSales / $totalTransactions : 0;
        
        return [
            'date' => $date->toDateString(),
            'total_sales' => $totalSales,
            'total_transactions' => $totalTransactions,
            'average_transaction' => $averageTransaction,
            'sales' => $sales,
        ];
    }

    public function getTopItems(array $params): array
    {
        $startDate = Carbon::parse($params['start_date'])->startOfDay();
        $endDate = Carbon::parse($params['end_date'])->endOfDay();
        $limit = $params['limit'] ?? 10;
        
        $items = $this->summaryRepository->getTopSellingItems($startDate, $endDate, $limit);
        $totalRevenue = $items->sum('total_revenue');
        
        $items = $items->map(function ($item) use ($totalRevenue) {
            $item['percentage'] = $totalRevenue > 0 ? ($item['total_revenue'] / $totalRevenue * 100) : 0;
            return $item;
        });
        
        return [
            'items' => $items,
            'total_revenue' => $totalRevenue,
            'total_items_sold' => $items->sum('total_quantity'),
        ];
    }

    public function getSalesTrend(array $params): array
    {
        $startDate = Carbon::parse($params['start_date'])->startOfDay();
        $endDate = Carbon::parse($params['end_date'])->endOfDay();
        
        $trend = $this->summaryRepository->getDailySalesTrend($startDate, $endDate);
        
        $totalSales = $trend->sum('total_sales');
        $totalTransactions = $trend->sum('transaction_count');
        
        return [
            'trend' => $trend,
            'total_sales' => $totalSales,
            'total_transactions' => $totalTransactions,
            'average_daily_sales' => $trend->count() > 0 ? $totalSales / $trend->count() : 0,
        ];
    }

    public function getPaymentMethodAnalysis(array $params): array
    {
        $startDate = Carbon::parse($params['start_date'])->startOfDay();
        $endDate = Carbon::parse($params['end_date'])->endOfDay();
        
        $distribution = $this->summaryRepository->getPaymentMethodDistribution($startDate, $endDate);
        
        $totalTransactions = $distribution->sum('transaction_count');
        $totalAmount = $distribution->sum('total_amount');
        
        $distribution = $distribution->map(function ($item) use ($totalTransactions, $totalAmount) {
            $item['transaction_percentage'] = $totalTransactions > 0 
                ? ($item['transaction_count'] / $totalTransactions * 100) 
                : 0;
            $item['amount_percentage'] = $totalAmount > 0 
                ? ($item['total_amount'] / $totalAmount * 100) 
                : 0;
            return $item;
        });
        
        return [
            'distribution' => $distribution,
            'total_transactions' => $totalTransactions,
            'total_amount' => $totalAmount,
        ];
    }

    public function getCustomerTypeAnalysis(array $params): array
    {
        $startDate = Carbon::parse($params['start_date'])->startOfDay();
        $endDate = Carbon::parse($params['end_date'])->endOfDay();
        
        $distribution = $this->summaryRepository->getCustomerTypeDistribution($startDate, $endDate);
        
        $totalTransactions = $distribution->sum('transaction_count');
        $totalAmount = $distribution->sum('total_amount');
        
        $distribution = $distribution->map(function ($item) use ($totalTransactions, $totalAmount) {
            $item['transaction_percentage'] = $totalTransactions > 0 
                ? ($item['transaction_count'] / $totalTransactions * 100) 
                : 0;
            $item['amount_percentage'] = $totalAmount > 0 
                ? ($item['total_amount'] / $totalAmount * 100) 
                : 0;
            return $item;
        });
        
        return [
            'distribution' => $distribution,
            'total_transactions' => $totalTransactions,
            'total_amount' => $totalAmount,
        ];
    }

    public function exportSummary(array $params)
    {
        try {
            $data = $this->getSummaryData($params);
            $fileName = 'summary_' . $params['start_date'] . '_to_' . $params['end_date'] . '.xlsx';

            return Excel::download(
                new SummaryExport($data, $params),
                $fileName,
            );
        } catch (\Exception $e) {
            \Log::error('Error in exportSummary: ' . $e->getMessage());
            throw $e;
        }
    }

    public function getSummaryStats(string $period): array
    {
        $today = Carbon::now();
        
        switch ($period) {
            case 'today':
                $startDate = $today->copy()->startOfDay();
                $endDate = $today->copy()->endOfDay();
                break;
            case 'week':
                $startDate = $today->copy()->subWeek()->startOfDay();
                $endDate = $today->copy()->endOfDay();
                break;
            case 'month':
                $startDate = $today->copy()->subMonth()->startOfDay();
                $endDate = $today->copy()->endOfDay();
                break;
            case 'year':
                $startDate = $today->copy()->subYear()->startOfDay();
                $endDate = $today->copy()->endOfDay();
                break;
            default:
                $startDate = $today->copy()->startOfDay();
                $endDate = $today->copy()->endOfDay();
        }

        $salesStats = $this->summaryRepository->getSalesStats($startDate, $endDate);
        $purchaseStats = $this->summaryRepository->getPurchaseStats($startDate, $endDate);

        return [
            'sales' => $salesStats,
            'purchase' => $purchaseStats,
            'period' => $period,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
        ];
    }
}