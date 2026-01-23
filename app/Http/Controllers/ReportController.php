<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ReportController extends Controller
{
    protected ReportService $reportService;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    /**
     * Get reports data
     */
    public function index(Request $request)
    {
        try {
            Log::info('Report API called', $request->all());

            $request->validate([
                'type' => 'sometimes|in:all,sales,purchase',
                'customer_type' => 'sometimes|in:all,member,nonmember',
                'member_code' => 'nullable|string',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            $reports = $this->reportService->getReports($request->all());
            
            return response()->json($reports);
            
        } catch (\Exception $e) {
            Log::error('Error in ReportController@index: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
                'params' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data laporan: ' . $e->getMessage(),
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Export reports to Excel
     */
    public function export(Request $request)
    {
        try {
            Log::info('Report export called', $request->all());

            $request->validate([
                'type' => 'sometimes|in:all,sales,purchase',
                'customer_type' => 'sometimes|in:all,member,nonmember',
                'member_code' => 'nullable|string',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            return $this->reportService->exportReports($request->all());
            
        } catch (\Exception $e) {
            Log::error('Error in ReportController@export: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
                'params' => $request->all(),
            ]);

            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal export data: ' . $e->getMessage(),
                    'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
                ], 500);
            }

            // Untuk non-JSON response, return error text
            return response()->stream(function () use ($e) {
                echo "Error exporting data: " . htmlspecialchars($e->getMessage()) . "\n\n";
                if (config('app.debug')) {
                    echo "Debug Info:\n";
                    echo "File: " . $e->getFile() . "\n";
                    echo "Line: " . $e->getLine() . "\n";
                }
            }, 500, [
                'Content-Type' => 'text/plain',
                'Cache-Control' => 'no-cache',
            ]);
        }
    }
}