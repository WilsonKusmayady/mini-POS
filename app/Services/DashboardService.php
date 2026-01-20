<?php

namespace App\Services;

use App\Repositories\DashboardRepository;
use Carbon\Carbon;

class DashboardService
{
    protected $dashboardRepository;

    public function __construct(DashboardRepository $dashboardRepository)
    {
        $this->dashboardRepository = $dashboardRepository;
    }

    /**
     * Get dashboard statistics
     */
    public function getDashboardStats(): array
    {
        try {
            $currentMonth = Carbon::now()->month;
            $currentYear = Carbon::now()->year;
            $lastMonth = Carbon::now()->subMonth()->month;
            $lastYear = Carbon::now()->subMonth()->year;

            // Debug: log parameter
            \Log::info('DashboardService parameters', [
                'currentMonth' => $currentMonth,
                'currentYear' => $currentYear,
                'lastMonth' => $lastMonth,
                'lastYear' => $lastYear
            ]);

            // Get sales data
            $currentMonthSales = $this->dashboardRepository->getSalesCount($currentMonth, $currentYear);
            $lastMonthSales = $this->dashboardRepository->getSalesCount($lastMonth, $lastYear);
            
            \Log::info('Sales data', [
                'currentMonthSales' => $currentMonthSales,
                'lastMonthSales' => $lastMonthSales
            ]);

            // Calculate sales change percentage
            $salesChangePercentage = $this->calculateChangePercentage($currentMonthSales, $lastMonthSales);

            // Get members data
            $totalMembers = $this->dashboardRepository->getTotalMembersCount();
            $newMembersThisMonth = $this->dashboardRepository->getNewMembersCount($currentMonth, $currentYear);
            $newMembersLastMonth = $this->dashboardRepository->getNewMembersCount($lastMonth, $lastYear);
            
            \Log::info('Members data', [
                'totalMembers' => $totalMembers,
                'newMembersThisMonth' => $newMembersThisMonth,
                'newMembersLastMonth' => $newMembersLastMonth
            ]);

            // Calculate members change percentage
            $membersChangePercentage = $this->calculateChangePercentage($newMembersThisMonth, $newMembersLastMonth);

            // Get new customers data (non-member)
            $newCustomersThisMonth = $this->dashboardRepository->getNewCustomersCount($currentMonth, $currentYear);
            $newCustomersLastMonth = $this->dashboardRepository->getNewCustomersCount($lastMonth, $lastYear);
            
            \Log::info('Customers data', [
                'newCustomersThisMonth' => $newCustomersThisMonth,
                'newCustomersLastMonth' => $newCustomersLastMonth
            ]);

            // Calculate customers change percentage
            $customersChangePercentage = $this->calculateChangePercentage($newCustomersThisMonth, $newCustomersLastMonth);

            // Get revenue data
            $currentMonthRevenue = $this->dashboardRepository->getRevenue($currentMonth, $currentYear);
            $lastMonthRevenue = $this->dashboardRepository->getRevenue($lastMonth, $lastYear);
            
            \Log::info('Revenue data', [
                'currentMonthRevenue' => $currentMonthRevenue,
                'lastMonthRevenue' => $lastMonthRevenue
            ]);

            // Calculate revenue change percentage
            $revenueChangePercentage = $this->calculateChangePercentage($currentMonthRevenue, $lastMonthRevenue);

            $result = [
                'sales' => [
                    'total' => $currentMonthSales,
                    'change_percentage' => round($salesChangePercentage, 2),
                    'is_positive' => $salesChangePercentage >= 0
                ],
                'members' => [
                    'total' => $totalMembers,
                    'new_this_month' => $newMembersThisMonth,
                    'change_percentage' => round($membersChangePercentage, 2),
                    'is_positive' => $membersChangePercentage >= 0
                ],
                'customers' => [
                    'new_this_month' => $newCustomersThisMonth,
                    'change_percentage' => round($customersChangePercentage, 2),
                    'is_positive' => $customersChangePercentage >= 0
                ],
                'revenue' => [
                    'current_month' => (float) $currentMonthRevenue,
                    'last_month' => (float) $lastMonthRevenue,
                    'change_percentage' => round($revenueChangePercentage, 2),
                    'is_positive' => $revenueChangePercentage >= 0
                ]
            ];

            \Log::info('Dashboard stats result', $result);

            return $result;

        } catch (\Exception $e) {
            \Log::error('DashboardService error in getDashboardStats', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e; // Re-throw untuk ditangani oleh controller
        }
    }

    /**
     * Get sales chart data for last 6 months
     */
    public function getSalesChartData(): array
    {
        try {
            $months = [];
            $revenues = [];
            $transactions = [];
            $targets = [];

            // Get data for last 6 months
            for ($i = 5; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $month = $date->month;
                $year = $date->year;
                
                // Format bulan untuk display
                $monthName = $date->locale('id')->monthName;
                $months[] = $monthName . ' ' . $date->format('y');
                
                // Get revenue and transactions for this month
                $revenue = $this->dashboardRepository->getRevenue($month, $year);
                $transactionCount = $this->dashboardRepository->getSalesCount($month, $year);
                
                $revenues[] = (float) $revenue;
                $transactions[] = $transactionCount;
                
                // Calculate target (use actual revenue for historical data)
                $targets[] = (float) $revenue;
            }

            \Log::info('Chart data', [
                'months' => $months,
                'revenues' => $revenues,
                'transactions' => $transactions
            ]);

            // Calculate projection for next 3 months (simplified version)
            $projectionMonths = [];
            $projectionRevenues = [];
            
            for ($i = 1; $i <= 3; $i++) {
                $date = Carbon::now()->addMonths($i);
                $monthName = $date->locale('id')->monthName;
                $projectionMonths[] = $monthName . ' ' . $date->format('y');
                
                // Simple projection: average of last 3 months
                $last3MonthsAvg = array_sum(array_slice($revenues, -3)) / 3;
                $projectionRevenues[] = $last3MonthsAvg * 1.10; // 10% growth
            }

            $result = [
                'historical' => [
                    'months' => $months,
                    'revenues' => $revenues,
                    'transactions' => $transactions,
                    'targets' => $targets
                ],
                'projection' => [
                    'months' => $projectionMonths,
                    'revenues' => $projectionRevenues
                ]
            ];

            return $result;

        } catch (\Exception $e) {
            \Log::error('DashboardService error in getSalesChartData', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Calculate percentage change between two values
     */
    private function calculateChangePercentage(float $currentValue, float $previousValue): float
    {
        if ($previousValue > 0) {
            return (($currentValue - $previousValue) / $previousValue) * 100;
        }
        
        return $currentValue > 0 ? 100 : 0;
    }
}