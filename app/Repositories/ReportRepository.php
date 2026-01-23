<?php

namespace App\Repositories;

use App\Repositories\Contracts\ReportRepositoryInterface;
use App\Models\Sales;
use App\Models\Purchase;
use App\Models\Member;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportRepository implements ReportRepositoryInterface
{
    public function getSalesReports(
        ?Carbon $startDate,
        ?Carbon $endDate,
        string $customerType = 'all',
        ?string $memberCode = null
    ): array {
        try {
            $query = Sales::query()
            ->select([
                'sales.sales_date as date',
                'sales.sales_invoice_code as invoice_code',
                DB::raw('COALESCE(members.member_name, sales.customer_name) as customer_name'),
                'sales.member_code',
                'members.member_name',
                'sales.sales_subtotal as subtotal',
                'sales.sales_discount_value as discount',
                'sales.sales_grand_total as total_amount',
                'sales.sales_payment_method as payment_method',
                DB::raw("CASE WHEN CAST(sales.sales_status AS INTEGER) = 1 THEN 'Paid' ELSE 'Pending' END as status")
            ])
            ->leftJoin('members', 'sales.member_code', '=', 'members.member_code');
            // ->where('sales.sales_status', true);
            
            if ($startDate) {
                $query->whereDate('sales.sales_date', '>=', $startDate->toDateString());
            }

            if ($endDate) {
                $query->whereDate('sales.sales_date', '<=', $endDate->toDateString());
            }

            $query->orderBy('sales.sales_date', 'desc')
                ->orderBy('sales.created_at', 'desc');

            // Filter by customer type
            if ($customerType === 'member') {
                $query->whereNotNull('sales.member_code');
                if ($memberCode) {
                    $query->where('sales.member_code', $memberCode);
                }
            } elseif ($customerType === 'nonmember') {
                $query->whereNull('sales.member_code');
            }

            return $query->get()->toArray();
            
        } catch (\Exception $e) {
            throw new \Exception('Error fetching sales reports: ' . $e->getMessage());
        }
    }

    public function getPurchaseReports(
        ?Carbon $startDate,
        ?Carbon $endDate,
        string $customerType = 'all',
        ?string $memberCode = null
    ): array {
        try {
            $query = Purchase::query()
                ->select([
                    'purchases.purchase_date as date',
                    'purchases.purchase_invoice_code as invoice_code',
                    DB::raw('suppliers.supplier_name as customer_name'),
                    DB::raw('NULL as member_code'),
                    DB::raw('NULL as member_name'),
                    'purchases.purchase_grand_total as total_amount',
                    DB::raw('0 as discount'),
                    DB::raw("'cash' as payment_method"),
                    DB::raw("'Paid' as status")
                ])
                ->leftJoin('suppliers', 'purchases.supplier_id', '=', 'suppliers.id');
            
            if ($startDate) {
                $query->whereDate('purchases.purchase_date', '>=', $startDate->toDateString());
            }

            if ($endDate) {
                $query->whereDate('purchases.purchase_date', '<=', $endDate->toDateString());
            }

            $query->orderBy('purchases.purchase_date', 'desc')
                ->orderBy('purchases.created_at', 'desc');

            return $query->get()->toArray();
            
        } catch (\Exception $e) {
            throw new \Exception('Error fetching purchase reports: ' . $e->getMessage());
        }
    }

    public function getAllReports(
        ?Carbon $startDate,
        ?Carbon $endDate,
        string $customerType = 'all',
        ?string $memberCode = null
    ): array {
        try {
            // Get sales reports
            $salesReports = $this->getSalesReports($startDate, $endDate, $customerType, $memberCode);
            
            // Get purchase reports (ignore member filter for purchase)
            $purchaseCustomerType = ($customerType === 'nonmember') ? 'nonmember' : 'all';
            $purchaseReports = $this->getPurchaseReports($startDate, $endDate, $purchaseCustomerType);

            // Combine and sort by date
            $allReports = array_merge($salesReports, $purchaseReports);
            
            // Sort by date descending
            usort($allReports, function ($a, $b) {
                return strtotime($b['date']) - strtotime($a['date']);
            });

            return $allReports;
            
        } catch (\Exception $e) {
            throw new \Exception('Error fetching all reports: ' . $e->getMessage());
        }
    }

    public function getMembers(): array
    {
        try {
            return Member::query()
                ->select(['member_code', 'member_name', 'member_phone'])
                ->where('member_status', 1) // Only active members
                ->orderBy('member_name')
                ->get()
                ->toArray();
                
        } catch (\Exception $e) {
            throw new \Exception('Error fetching members: ' . $e->getMessage());
        }
    }
}