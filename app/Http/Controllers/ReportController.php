<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\PurchaseService;
use App\Services\SalesService;
use App\Exports\PurchaseExport;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;
use Carbon\Carbon;

class ReportController extends Controller
{
    protected $purchaseService;
    protected $salesService;

    public function __construct(
        PurchaseService $purchaseService,
        SalesService $salesService
    ) {
        $this->purchaseService = $purchaseService;
        $this->salesService = $salesService;
    }

    /**
     * Halaman Laporan Pembelian (Visual)
     */
    public function purchaseReport(Request $request)
    {
        $filters = $request->all();
        
        // Default tanggal bulan ini jika tidak ada filter
        if (empty($filters['start_date'])) {
            $filters['start_date'] = Carbon::now()->startOfMonth()->toDateString();
        }
        if (empty($filters['end_date'])) {
            $filters['end_date'] = Carbon::now()->endOfMonth()->toDateString();
        }

        // 1. Ambil Statistik (Total Beli, Total Pengeluaran)
        $statistics = $this->purchaseService->getStatistics($filters);

        // 2. Ambil Data Tabel (Paginated)
        // Kita gunakan method getPaginatedPurchases yg sudah ada di PurchaseService
        // namun mungkin perlu disesuaikan parameternya agar sesuai dengan view
        $purchases = $this->purchaseService->getPaginatedPurchases($filters, 15);

        return Inertia::render('reports/purchase', [
            'statistics' => $statistics,
            'purchases' => $purchases,
            'filters' => $filters,
        ]);
    }

    /**
     * Download Excel Laporan Pembelian
     */
    public function exportPurchase(Request $request)
    {
        $filters = $request->all();
        
        // Ambil data yang sudah diformat dari Service
        $data = $this->purchaseService->getExportData($filters);
        
        $filename = 'Laporan-Pembelian-' . Carbon::now()->format('Ymd-His') . '.xlsx';
        
        return Excel::download(new PurchaseExport($data, $filters), $filename);
    }
}