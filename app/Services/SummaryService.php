<?php

namespace App\Services;

use App\Repositories\Contracts\SummaryRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
        $startDate = Carbon::parse($params['start_date'])->startOfDay();
        $endDate = Carbon::parse($params['end_date'])->endOfDay();

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
            $summaryData = $this->combineTransactionData($salesSummary, $purchaseSummary);
            $transactionSummary = $this->getTransactionTypeSummary($salesSummary, $purchaseSummary);
        } elseif ($type === 'sales') {
            $summaryData = $salesSummary;
            $transactionSummary = collect();
        } else {
            $summaryData = $purchaseSummary;
            $transactionSummary = collect();
        }

        return [
            'summary' => $summaryData,
            'transaction_summary' => $transactionSummary
        ];
    }

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

    /**
     * Get top selling items
     */
    public function getTopItems(array $params): array
    {
        $startDate = Carbon::parse($params['start_date'])->startOfDay();
        $endDate = Carbon::parse($params['end_date'])->endOfDay();
        $limit = $params['limit'] ?? 10;
        
        $items = $this->summaryRepository->getTopSellingItems($startDate, $endDate, $limit);
        
        $totalRevenue = $items->sum('total_revenue');
        
        // Hitung persentase
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

    /**
     * Get sales trend
     */
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

    /**
     * Get payment method analysis
     */
    public function getPaymentMethodAnalysis(array $params): array
    {
        $startDate = Carbon::parse($params['start_date'])->startOfDay();
        $endDate = Carbon::parse($params['end_date'])->endOfDay();
        
        $distribution = $this->summaryRepository->getPaymentMethodDistribution($startDate, $endDate);
        
        $totalTransactions = $distribution->sum('transaction_count');
        $totalAmount = $distribution->sum('total_amount');
        
        // Hitung persentase
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

    /**
     * Get customer type analysis
     */
    public function getCustomerTypeAnalysis(array $params): array
    {
        $startDate = Carbon::parse($params['start_date'])->startOfDay();
        $endDate = Carbon::parse($params['end_date'])->endOfDay();
        
        $distribution = $this->summaryRepository->getCustomerTypeDistribution($startDate, $endDate);
        
        $totalTransactions = $distribution->sum('transaction_count');
        $totalAmount = $distribution->sum('total_amount');
        
        // Hitung persentase
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

    /**
     * Export summary to Excel
     */
    public function exportSummary(array $params): StreamedResponse
    {
        $data = $this->getSummaryData($params);
        
        $fileName = 'summary_' . $params['start_date'] . '_to_' . $params['end_date'] . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ];

        return new StreamedResponse(function () use ($data, $params) {
            $handle = fopen('php://output', 'w');
            
            // Write BOM for UTF-8
            fwrite($handle, "\xEF\xBB\xBF");
            
            // Write headers
            fputcsv($handle, [
                'Tanggal',
                'Jumlah Transaksi',
                'Total Transaksi (Rp)',
                'Total Diskon (Rp)',
                'Rata-rata/Transaksi (Rp)',
                'Item Terjual'
            ]);
            
            // Write data
            foreach ($data['summary'] as $row) {
                fputcsv($handle, [
                    $row['date'],
                    $row['transaction_count'],
                    $row['total_transactions'],
                    $row['total_discount'],
                    $row['average_transaction'],
                    $row['items_sold'] ?? 0
                ]);
            }
            
            // Write summary row
            fputcsv($handle, []);
            fputcsv($handle, ['TOTAL', '', '', '', '']);
            
            $totals = [
                'transactions' => collect($data['summary'])->sum('transaction_count'),
                'total' => collect($data['summary'])->sum('total_transactions'),
                'discount' => collect($data['summary'])->sum('total_discount'),
                'items' => collect($data['summary'])->sum('items_sold'),
            ];
            
            fputcsv($handle, [
                'Total Transaksi',
                $totals['transactions'],
                $totals['total'],
                $totals['discount'],
                '',
                $totals['items']
            ]);
            
            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Get summary statistics
     */
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