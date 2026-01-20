<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function index(Request $request)
    {
        return Inertia::render('dashboard');
    }

    /**
     * Get dashboard statistics
     */
    public function getStats(Request $request)
    {
        try {
            $stats = $this->dashboardService->getDashboardStats();

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            \Log::error('Dashboard stats error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage(),
                'error_details' => [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
            ], 500);
        }
    }

    /**
     * Get sales chart data for last 6 months
     */
    public function getSalesChartData(Request $request)
    {
        try {
            $chartData = $this->dashboardService->getSalesChartData();

            return response()->json([
                'success' => true,
                'data' => $chartData
            ]);

        } catch (\Exception $e) {
            \Log::error('Dashboard chart error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch chart data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recent activities data
     */
    public function getActivities(Request $request)
    {
        try {
            $activities = $this->dashboardService->getRecentActivities();

            return response()->json([
                'success' => true,
                'data' => $activities
            ]);

        } catch (\Exception $e) {
            \Log::error('Dashboard activities error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch activities: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get additional dashboard data (top items, recent sales, etc.)
     */
    public function getAdditionalData(Request $request)
    {
        try {
            // You can add more methods to DashboardService for additional data
            $data = [
                'top_items' => [],
                'recent_sales' => [],
                'payment_methods' => []
            ];

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch additional data: ' . $e->getMessage()
            ], 500);
        }
    }
}