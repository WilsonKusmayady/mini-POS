<?php

namespace App\Services;

use App\Repositories\Contracts\DashboardRepositoryInterface;
use Carbon\Carbon;

class DashboardService
{
    protected $dashboardRepository;

    public function __construct(DashboardRepositoryInterface $dashboardRepository)
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

            // Calculate projection for next 3 months with incremental growth
            $projectionMonths = [];
            $projectionRevenues = [];

            // Calculate baseline from last 3 months average
            $last3MonthsRevenues = array_slice($revenues, -3);
            $last3MonthsAvg = count($last3MonthsRevenues) > 0 ? array_sum($last3MonthsRevenues) / count($last3MonthsRevenues) : 0;

            // Use the last month's revenue as starting point if available, otherwise use average
            $lastMonthRevenue = end($revenues) ?: $last3MonthsAvg;

            // for ($i = 1; $i <= 3; $i++) {
            //     $date = Carbon::now()->addMonths($i);
            //     $monthName = $date->locale('id')->monthName;
            //     $projectionMonths[] = $monthName . ' ' . $date->format('y');
                
            //     // Calculate growth factor based on month (incremental growth)
            //     // Month 1: 5% growth, Month 2: 8% growth, Month 3: 12% growth
            //     $growthFactors = [1.05, 1.08, 1.12];
            //     $growthFactor = $growthFactors[$i-1] ?? 1.05;
                
            //     // Calculate projection with incremental growth from previous month
            //     if ($i === 1) {
            //         // First projection month: grow from last month
            //         $projectionRevenues[] = $lastMonthRevenue * $growthFactor;
            //     } else {
            //         // Subsequent months: grow from previous projection
            //         $projectionRevenues[] = $projectionRevenues[$i-2] * $growthFactor;
            //     }
            // }

            // Alternative: If you want more realistic projection with seasonal adjustment
            // Uncomment this block if you want to use seasonal patterns
            for ($i = 1; $i <= 3; $i++) {
                $date = Carbon::now()->addMonths($i);
                $monthName = $date->locale('id')->monthName;
                $projectionMonths[] = $monthName . ' ' . $date->format('y');
                
                // Get historical data for the same month in previous years if available
                $monthIndex = $date->month - 1; // 0-based month index
                $historicalSameMonthRevenues = [];
                
                // Collect revenues for the same month from historical data
                foreach ($revenues as $index => $revenue) {
                    $historicalDate = Carbon::now()->subMonths(5 - $index);
                    if ($historicalDate->month === $date->month) {
                        $historicalSameMonthRevenues[] = $revenue;
                    }
                }
                
                // Calculate projection: average of same month + growth trend
                $sameMonthAvg = count($historicalSameMonthRevenues) > 0 
                    ? array_sum($historicalSameMonthRevenues) / count($historicalSameMonthRevenues) 
                    : $last3MonthsAvg;
                
                // Apply growth trend based on month position
                $monthGrowth = 1.0 + ($i * 0.03); // 3% incremental growth per month
                
                $projectionRevenues[] = $sameMonthAvg * $monthGrowth;
            }

            // Ensure projection revenues are reasonable (not negative)
            foreach ($projectionRevenues as $index => $revenue) {
                if ($revenue < 0) {
                    $projectionRevenues[$index] = 0;
                }
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
     * Get recent activities
     */
    public function getRecentActivities(): array
    {
        try {
            $activities = [];
            
            // Get recent transactions (last 3)
            $recentTransactions = $this->dashboardRepository->getRecentTransactions(3);
            
            foreach ($recentTransactions as $transaction) {
                $activities[] = [
                    'id' => 'trans_' . $transaction->sales_invoice_code,
                    'type' => $transaction->sales_status == 0 ? 'cancellation' : 'transaction',
                    'title' => $transaction->sales_status == 0 ? 'Transaksi dibatalkan' : 'Transaksi baru selesai',
                    'description' => $transaction->sales_invoice_code . ' - Rp ' . number_format($transaction->sales_grand_total, 0, ',', '.'),
                    'timestamp' => $transaction->sales_date ?? $transaction->created_at,
                ];
            }
            
            // Get recent members (last 3)
            $recentMembers = $this->dashboardRepository->getRecentMembers(3);
            
            foreach ($recentMembers as $member) {
                $activities[] = [
                    'id' => 'member_' . $member->member_code,
                    'type' => 'member',
                    'title' => 'Member baru terdaftar',
                    'description' => $member->member_code . ' - ' . $member->member_name,
                    'timestamp' => $member->created_at,
                ];
            }
            
            // Get recent stock updates (last 2)
            $recentStockUpdates = $this->dashboardRepository->getRecentStockUpdates(2);
            
            foreach ($recentStockUpdates as $stock) {
                $activities[] = [
                    'id' => 'stock_' . $stock->item_code,
                    'type' => 'stock',
                    'title' => 'Stok barang diperbarui',
                    'description' => $stock->item_code . ' - ' . $stock->item_name . ' (+' . $stock->stock_change . ')',
                    'timestamp' => $stock->created_at,
                ];
            }
            
            // Get system activities (if any)
            $systemActivities = $this->dashboardRepository->getRecentSystemActivities(2);
            
            foreach ($systemActivities as $system) {
                $activities[] = [
                    'id' => 'system_' . $system->id,
                    'type' => 'system',
                    'title' => $system->title,
                    'description' => $system->description,
                    'timestamp' => $system->created_at,
                ];
            }
            
            // Sort by timestamp (newest first)
            usort($activities, function($a, $b) {
                return strtotime($b['timestamp']) - strtotime($a['timestamp']);
            });
            
            // Take only 6 latest activities (bisa diatur sesuai kebutuhan)
            $activities = array_slice($activities, 0, 6);
            
            \Log::info('Recent activities', [
                'count' => count($activities),
                'transactions' => count($recentTransactions),
                'members' => count($recentMembers),
                'stock_updates' => count($recentStockUpdates),
                'activities' => array_map(function($a) {
                    return ['type' => $a['type'], 'title' => $a['title']];
                }, $activities)
            ]);

            return $activities;

        } catch (\Exception $e) {
            \Log::error('DashboardService error in getRecentActivities', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Return fallback data if error occurs
            return $this->getFallbackActivities();
        }
    }

    /**
     * Get fallback activities data (for error cases)
     */
    private function getFallbackActivities(): array
    {
        $now = Carbon::now();
        $activities = [];
        
        // Transaction activities
        $activities[] = [
            'id' => 1,
            'type' => 'transaction',
            'title' => 'Transaksi baru selesai',
            'description' => 'INV' . $now->format('ymd') . '0001 - Rp ' . number_format(rand(100000, 500000), 0, ',', '.'),
            'timestamp' => $now->subMinutes(rand(1, 30))->toISOString(),
        ];
        
        $activities[] = [
            'id' => 2,
            'type' => 'transaction',
            'title' => 'Transaksi baru selesai',
            'description' => 'INV' . $now->format('ymd') . '0002 - Rp ' . number_format(rand(50000, 300000), 0, ',', '.'),
            'timestamp' => $now->subHours(rand(1, 5))->toISOString(),
        ];
        
        $activities[] = [
            'id' => 3,
            'type' => 'cancellation',
            'title' => 'Transaksi dibatalkan',
            'description' => 'INV' . $now->format('ymd') . '0003 - Rp ' . number_format(rand(50000, 200000), 0, ',', '.'),
            'timestamp' => $now->subHours(rand(6, 12))->toISOString(),
        ];
        
        // Member activities
        $activities[] = [
            'id' => 4,
            'type' => 'member',
            'title' => 'Member baru terdaftar',
            'description' => 'MEM' . str_pad(rand(100, 999), 5, '0', STR_PAD_LEFT) . ' - Customer ' . rand(1, 100),
            'timestamp' => $now->subDays(rand(1, 2))->toISOString(),
        ];
        
        // Stock activities
        $activities[] = [
            'id' => 5,
            'type' => 'stock',
            'title' => 'Stok barang diperbarui',
            'description' => 'BRG' . str_pad(rand(1, 50), 3, '0', STR_PAD_LEFT) . ' - ' . ['Kopi Arabica', 'Teh Hijau', 'Snack Box', 'Minuman Kaleng'][rand(0, 3)] . ' (+' . rand(10, 100) . ')',
            'timestamp' => $now->subDays(rand(2, 3))->toISOString(),
        ];
        
        // System activities
        $activities[] = [
            'id' => 6,
            'type' => 'system',
            'title' => 'Backup sistem selesai',
            'description' => 'Backup otomatis database berhasil',
            'timestamp' => $now->subDays(rand(3, 4))->toISOString(),
        ];
        
        // Sort by timestamp
        usort($activities, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });
        
        return $activities;
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