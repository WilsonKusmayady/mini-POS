<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\SummaryService;
use App\Http\Requests\SummaryRequest;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SummaryController extends Controller
{
    protected $summaryService;

    public function __construct(SummaryService $summaryService)
    {
        $this->summaryService = $summaryService;
    }

    /**
     * Get summary data
     */
    public function index(Request $request)
    {
        try {
            // validasi manual (opsional & fleksibel)
            $validated = $request->validate([
                'type' => 'sometimes|in:all,sales,purchase',
                'start_date' => 'sometimes|date',
                'end_date' => 'sometimes|date|after_or_equal:start_date',
            ]);

            $data = $this->summaryService->getSummaryData($validated);

            return response()->json([
                'success' => true,
                'summary' => $data['summary'],
                'transaction_summary' => $data['transaction_summary'],
                'message' => 'Data summary berhasil diambil'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data summary: ' . $e->getMessage()
            ], 500);
        }
    }

     public function salesDetails(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        try {
            $date = Carbon::parse($request->date);
            $data = $this->summaryService->getSalesDetails($date);
            
            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Data detail penjualan berhasil diambil'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data detail: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get top selling items
     */
    public function topItems(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'limit' => 'sometimes|integer|min:1|max:50',
        ]);

        try {
            $data = $this->summaryService->getTopItems($request->all());
            
            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Data item terlaris berhasil diambil'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data item terlaris: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get sales trend
     */
    public function salesTrend(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        try {
            $data = $this->summaryService->getSalesTrend($request->all());
            
            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Data trend penjualan berhasil diambil'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data trend: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get payment method analysis
     */
    public function paymentMethodAnalysis(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        try {
            $data = $this->summaryService->getPaymentMethodAnalysis($request->all());
            
            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Analisis metode pembayaran berhasil diambil'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil analisis metode pembayaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get customer type analysis
     */
    public function customerTypeAnalysis(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        try {
            $data = $this->summaryService->getCustomerTypeAnalysis($request->all());
            
            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Analisis tipe pelanggan berhasil diambil'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil analisis tipe pelanggan: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Export summary to Excel
     */
    public function export(Request $request)
    {
        $request->validate([
            'type' => 'sometimes|in:all,sales,purchase',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        try {
            return $this->summaryService->exportSummary($request->all());
        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal mengexport data: ' . $e->getMessage(),
                    'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan internal'
                ], 500);
            }

            // For non-JSON requests, show simple error
            return response()->stream(function () use ($e) {
                echo "Error exporting data: " . $e->getMessage() . "\n\n";
                if (config('app.debug')) {
                    echo "Debug Info:\n";
                    echo "File: " . $e->getFile() . "\n";
                    echo "Line: " . $e->getLine() . "\n";
                    echo "Trace:\n" . $e->getTraceAsString();
                }
            }, 500, [
                'Content-Type' => 'text/plain',
                'Cache-Control' => 'no-cache',
            ]);
        }
    }

    /**
     * Get summary statistics
     */
    public function getStats(Request $request)
    {
        $request->validate([
            'period' => 'sometimes|in:today,week,month,year',
        ]);

        try {
            $period = $request->get('period', 'today');
            $stats = $this->summaryService->getSummaryStats($period);
            
            return response()->json([
                'success' => true,
                'stats' => $stats
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil statistik: ' . $e->getMessage()
            ], 500);
        }
    }
}