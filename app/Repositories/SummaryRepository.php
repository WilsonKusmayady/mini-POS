<?php

namespace App\Repositories;

use App\Repositories\Contracts\SummaryRepositoryInterface;
use App\Models\Sales;
use App\Models\Purchase;
use App\Models\SalesDetail;
use App\Models\Item;
use App\Models\Member;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class SummaryRepository implements SummaryRepositoryInterface
{
    /**
     * Get sales summary data
     */
    public function getSalesSummary(Carbon $startDate, Carbon $endDate): Collection
    {
        return Sales::whereBetween('sales_date', [$startDate, $endDate])
            ->where('sales_status', true)
            ->join('sales_details', 'sales.sales_invoice_code', '=', 'sales_details.sales_invoice_code')
            ->selectRaw('
                DATE(sales.sales_date) as date,
                COUNT(DISTINCT sales.sales_invoice_code) as transaction_count,
                SUM(sales.sales_grand_total) as total_transactions,
                SUM(sales.sales_hasil_discount_value) as total_discount,
                AVG(sales.sales_grand_total) as average_transaction,
                SUM(sales_details.sales_quantity) as items_sold
            ')
            ->groupByRaw('DATE(sales.sales_date)')
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($sale) {
                return [
                    'date' => $sale->date,
                    'transaction_count' => (int) $sale->transaction_count,
                    'total_transactions' => (float) $sale->total_transactions,
                    'total_discount' => (float) $sale->total_discount,
                    'average_transaction' => (float) $sale->average_transaction,
                    'items_sold' => (int) $sale->items_sold,
                ];
            });
    }


    /**
     * Get purchase summary data
     */
    public function getPurchaseSummary(Carbon $startDate, Carbon $endDate): Collection
    {
        return Purchase::whereBetween('purchase_date', [$startDate, $endDate])
            ->where('purchase_status', true)
            ->selectRaw('
                DATE(purchase_date) as date,
                COUNT(*) as transaction_count,
                SUM(purchase_total) as total_transactions,
                0 as total_discount,
                AVG(purchase_total) as average_transaction
            ')
            ->with(['sales_details' => function ($query) {
                $query->selectRaw('
                    purchase_invoice_code,
                    SUM(purchase_quantity) as total_items
                ')
                ->groupBy('purchase_invoice_code');
            }])
            ->groupByRaw('DATE(purchase_date)')
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($purchase) {
                return [
                    'date' => $purchase->date,
                    'transaction_count' => (int) $purchase->transaction_count,
                    'total_transactions' => (float) $purchase->total_transactions,
                    'total_discount' => (float) $purchase->total_discount,
                    'average_transaction' => (float) $purchase->average_transaction,
                    'items_sold' => (int) ($purchase->sales_details->first()->total_items ?? 0),
                ];
            });
    }

    /**
     * Get sales statistics
     */
    public function getSalesStats(Carbon $startDate, Carbon $endDate): array
    {
        $stats = Sales::whereBetween('sales_date', [$startDate, $endDate])
            ->where('sales_status', true)
            ->selectRaw('
                COUNT(*) as total_transactions,
                SUM(sales_grand_total) as total_amount,
                SUM(sales_hasil_discount_value) as total_discount,
                AVG(sales_grand_total) as average_transaction,
                MAX(sales_grand_total) as max_transaction,
                MIN(sales_grand_total) as min_transaction,
                COUNT(DISTINCT customer_name) as unique_customers
            ')
            ->first();

        return [
            'total_transactions' => (int) ($stats->total_transactions ?? 0),
            'total_amount' => (float) ($stats->total_amount ?? 0),
            'total_discount' => (float) ($stats->total_discount ?? 0),
            'average_transaction' => (float) ($stats->average_transaction ?? 0),
            'max_transaction' => (float) ($stats->max_transaction ?? 0),
            'min_transaction' => (float) ($stats->min_transaction ?? 0),
            'unique_customers' => (int) ($stats->unique_customers ?? 0),
        ];
    }

    /**
     * Get purchase statistics
     */
    public function getPurchaseStats(Carbon $startDate, Carbon $endDate): array
    {
        $stats = Purchase::whereBetween('purchase_date', [$startDate, $endDate])
            ->where('purchase_status', true)
            ->selectRaw('
                COUNT(*) as total_transactions,
                SUM(purchase_total) as total_amount,
                AVG(purchase_total) as average_transaction,
                MAX(purchase_total) as max_transaction,
                MIN(purchase_total) as min_transaction
            ')
            ->first();

        return [
            'total_transactions' => (int) ($stats->total_transactions ?? 0),
            'total_amount' => (float) ($stats->total_amount ?? 0),
            'average_transaction' => (float) ($stats->average_transaction ?? 0),
            'max_transaction' => (float) ($stats->max_transaction ?? 0),
            'min_transaction' => (float) ($stats->min_transaction ?? 0),
        ];
    }

    /**
     * Get detailed sales data for a specific date
     */
    public function getSalesByDate(Carbon $date): Collection
    {
        return Sales::whereDate('sales_date', $date)
            ->where('sales_status', true)
            ->with(['sales_details.item', 'member'])
            ->orderBy('sales_date', 'desc')
            ->get()
            ->map(function ($sale) {
                return [
                    'invoice_code' => $sale->sales_invoice_code,
                    'customer_name' => $sale->customer_name,
                    'member_code' => $sale->member_code,
                    'member_name' => $sale->member->member_name ?? null,
                    'sales_date' => $sale->sales_date,
                    'subtotal' => $sale->sales_subtotal,
                    'discount' => $sale->sales_hasil_discount_value,
                    'grand_total' => $sale->sales_grand_total,
                    'payment_method' => $sale->sales_payment_method,
                    'items_count' => $sale->sales_details->sum('sales_quantity'),
                    'items' => $sale->sales_details->map(function ($detail) {
                        return [
                            'item_code' => $detail->item_code,
                            'item_name' => $detail->item->item_name ?? null,
                            'quantity' => $detail->sales_quantity,
                            'price' => $detail->sell_price,
                            'discount' => $detail->sales_hasil_diskon_item,
                            'total' => $detail->total_item_price,
                        ];
                    }),
                ];
            });
    }

    /**
     * Get top selling items in date range
     */
    public function getTopSellingItems(Carbon $startDate, Carbon $endDate, int $limit = 10): Collection
    {
        return SalesDetail::whereHas('sale', function ($query) use ($startDate, $endDate) {
                $query->whereBetween('sales_date', [$startDate, $endDate])
                    ->where('sales_status', true);
            })
            ->selectRaw('
                item_code,
                SUM(sales_quantity) as total_quantity,
                SUM(total_item_price) as total_revenue,
                COUNT(DISTINCT sales_invoice_code) as transaction_count
            ')
            ->with('item')
            ->groupBy('item_code')
            ->orderBy('total_quantity', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($detail) {
                return [
                    'item_code' => $detail->item_code,
                    'item_name' => $detail->item->item_name ?? null,
                    'total_quantity' => (int) $detail->total_quantity,
                    'total_revenue' => (float) $detail->total_revenue,
                    'transaction_count' => (int) $detail->transaction_count,
                    'average_quantity' => $detail->transaction_count > 0 
                        ? $detail->total_quantity / $detail->transaction_count 
                        : 0,
                ];
            });
    }

    /**
     * Get daily sales trend
     */
    public function getDailySalesTrend(Carbon $startDate, Carbon $endDate): Collection
    {
        $dates = collect();
        $currentDate = $startDate->copy();
        
        while ($currentDate <= $endDate) {
            $dailyTotal = Sales::whereDate('sales_date', $currentDate)
                ->where('sales_status', true)
                ->sum('sales_grand_total');
                
            $dates->push([
                'date' => $currentDate->toDateString(),
                'day_name' => $currentDate->locale('id')->dayName,
                'total_sales' => (float) $dailyTotal,
                'transaction_count' => Sales::whereDate('sales_date', $currentDate)
                    ->where('sales_status', true)
                    ->count(),
            ]);
            
            $currentDate->addDay();
        }
        
        return $dates;
    }

    /**
     * Get payment method distribution
     */
    public function getPaymentMethodDistribution(Carbon $startDate, Carbon $endDate): Collection
    {
        return Sales::whereBetween('sales_date', [$startDate, $endDate])
            ->where('sales_status', true)
            ->selectRaw('
                sales_payment_method,
                COUNT(*) as transaction_count,
                SUM(sales_grand_total) as total_amount
            ')
            ->groupBy('sales_payment_method')
            ->get()
            ->map(function ($sale) {
                return [
                    'payment_method' => $sale->sales_payment_method,
                    'transaction_count' => (int) $sale->transaction_count,
                    'total_amount' => (float) $sale->total_amount,
                    'percentage' => 0, // akan dihitung di service
                ];
            });
    }

    /**
     * Get member vs non-member sales
     */
    public function getCustomerTypeDistribution(Carbon $startDate, Carbon $endDate): Collection
    {
        return Sales::whereBetween('sales_date', [$startDate, $endDate])
            ->where('sales_status', true)
            ->selectRaw('
                CASE 
                    WHEN member_code IS NOT NULL THEN "member"
                    ELSE "non-member"
                END as customer_type,
                COUNT(*) as transaction_count,
                SUM(sales_grand_total) as total_amount,
                AVG(sales_grand_total) as average_transaction
            ')
            ->groupByRaw('CASE WHEN member_code IS NOT NULL THEN "member" ELSE "non-member" END')
            ->get()
            ->map(function ($sale) {
                return [
                    'customer_type' => $sale->customer_type,
                    'transaction_count' => (int) $sale->transaction_count,
                    'total_amount' => (float) $sale->total_amount,
                    'average_transaction' => (float) $sale->average_transaction,
                ];
            });
    }

    /**
     * Get hourly sales distribution
     */
    public function getHourlySalesDistribution(Carbon $startDate, Carbon $endDate): Collection
    {
        return Sales::whereBetween('sales_date', [$startDate, $endDate])
            ->where('sales_status', true)
            ->selectRaw('
                HOUR(sales_date) as hour,
                COUNT(*) as transaction_count,
                SUM(sales_grand_total) as total_amount
            ')
            ->groupByRaw('HOUR(sales_date)')
            ->orderBy('hour')
            ->get()
            ->map(function ($sale) {
                return [
                    'hour' => (int) $sale->hour,
                    'hour_label' => sprintf('%02d:00', $sale->hour),
                    'transaction_count' => (int) $sale->transaction_count,
                    'total_amount' => (float) $sale->total_amount,
                ];
            });
    }

    /**
     * Get sales by member type
     */
    public function getSalesByMember(Carbon $startDate, Carbon $endDate, int $limit = 10): Collection
    {
        return Sales::whereBetween('sales_date', [$startDate, $endDate])
            ->where('sales_status', true)
            ->whereNotNull('member_code')
            ->selectRaw('
                member_code,
                COUNT(*) as transaction_count,
                SUM(sales_grand_total) as total_amount,
                AVG(sales_grand_total) as average_transaction
            ')
            ->with('member')
            ->groupBy('member_code')
            ->orderBy('total_amount', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($sale) {
                return [
                    'member_code' => $sale->member_code,
                    'member_name' => $sale->member->member_name ?? null,
                    'transaction_count' => (int) $sale->transaction_count,
                    'total_amount' => (float) $sale->total_amount,
                    'average_transaction' => (float) $sale->average_transaction,
                ];
            });
    }
}