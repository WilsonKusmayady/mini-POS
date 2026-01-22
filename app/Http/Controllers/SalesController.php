<?php

namespace App\Http\Controllers;

use App\Services\SalesService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Response;

class SalesController extends Controller
{
    protected $saleService;

    public function __construct(SalesService $saleService)
    {
        $this->saleService = $saleService;
    }

    public function index(Request $request)
    {
        // Validate query parameters
        $validator = Validator::make($request->all(), [
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|integer|in:0,1',
            'payment_method' => 'nullable|string|in:cash,debit,qris',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator);
        }

        $filters = $request->only(['search', 'status', 'payment_method', 'start_date', 'end_date']);
        
        try {
            // Gunakan method paginated untuk tabel
            $perPage = $request->get('per_page', 10);
            $salesPaginated = $this->saleService->getAllSalesPaginated($filters, $perPage);
            $statistics = $this->saleService->getStatistics($filters);
            
            return Inertia::render('sales/history', [
                'sales' => $salesPaginated->items(),
                'pagination' => [
                    'current_page' => $salesPaginated->currentPage(),
                    'per_page' => $salesPaginated->perPage(),
                    'total' => $salesPaginated->total(),
                    'last_page' => $salesPaginated->lastPage(),
                    'from' => $salesPaginated->firstItem(),
                    'to' => $salesPaginated->lastItem(),
                ],
                'statistics' => $statistics,
                'filters' => $filters,
            ]);
            
        } catch (\Throwable $e) {
            throw $e;
        }
    }

    
    /**
     * API: Get paginated sales for AJAX requests
     */
    public function apiIndex(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|in:10,25,50,100',
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|integer|in:0,1',
            'payment_method' => 'nullable|string|in:cash,debit,qris',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $filters = $request->only(['search', 'status', 'payment_method', 'start_date', 'end_date']);
            $perPage = $request->get('per_page', 10);
            $page = $request->get('page', 1);
            
            $sales = $this->saleService->getAllSalesPaginated($filters, $perPage, $page);
            
            return response()->json($sales);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch sales: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        // Validasi data
        $validator = Validator::make($request->all(), [
            'sales_date' => 'required|date',
            'sales_payment_method' => 'required|in:cash,debit,qris',
            'sales_discount_value' => 'nullable|numeric|min:0|max:100',
            'member_code' => 'nullable|string|exists:members,member_code',
            'customer_name' => 'nullable|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.item_code' => 'required|string|exists:items,item_code',
            'items.*.sales_quantity' => 'required|integer|min:1',
            'items.*.sell_price' => 'required|numeric|min:0',
            'items.*.sales_discount_item' => 'nullable|numeric|min:0|max:100',
            'items.*.sales_hasil_diskon_item' => 'nullable|numeric|min:0',
            'items.*.total_item_price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Persiapkan data untuk service
            $saleData = [
                'sales_date' => $request->sales_date,
                'payment_method' => $request->sales_payment_method,
                'discount_percentage' => $request->sales_discount_value ?? 0,
                'member_code' => $request->member_code,
                'customer_name' => $request->customer_name,
                'items' => $request->items,
                'sales_subtotal' => $request->sales_subtotal,
                'sales_hasil_discount_value' => $request->sales_hasil_discount_value,
                'sales_grand_total' => $request->sales_grand_total,
            ];

            // Panggil service untuk membuat transaksi
            $sale = $this->saleService->createSale($saleData);

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil disimpan',
                'sale' => $sale
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan transaksi: ' . $e->getMessage()
            ], 500);
        }
    }
    public function showNota(string $invoiceCode)
    {
        try {
            $sale = $this->saleService->getSaleForNota($invoiceCode);
            // dd($sale);
            return Inertia::render('sales/nota', [
                'sale' => [
                    'sales_invoice_code' => $sale->sales_invoice_code,
                    'customer_name' => $sale->customer_name,
                    'member_code' => $sale->member_code,
                    'member_name' => $sale->member?->member_name,
                    'sales_date' => $sale->sales_date,

                    'sales_subtotal' => (float) $sale->sales_subtotal,
                    'sales_discount_value' => (float) $sale->sales_discount_value,
                    'sales_hasil_discount_value' => (float) $sale->sales_hasil_discount_value,
                    'sales_grand_total' => (float) $sale->sales_grand_total,
                    'sales_payment_method' => $sale->sales_payment_method,

                    'items' => $sale->sales_details->map(fn ($detail) => [
                        'item_name' => $detail->item->item_name ?? 'Unknown Item',
                        'sales_quantity' => $detail->sales_quantity,
                        'sell_price' => (float) $detail->sell_price,
                        'sales_discount_item' => (float) $detail->sales_discount_item,
                        'sales_hasil_diskon_item' => (float) $detail->sales_hasil_diskon_item,
                        'total_item_price' => (float) $detail->total_item_price,
                    ])->toArray(),
                ],
                'companyInfo' => [
                    'name' => env('COMPANY_NAME', 'TOKO RETAIL'),
                    'address' => env('COMPANY_ADDRESS', 'Jl. Contoh No. 123'),
                    'phone' => env('COMPANY_PHONE', '0812-3456-7890'),
                    'footerNote' => 'Terima kasih telah berbelanja',
                ]
            ]);
        } catch (\Exception $e) {
            return redirect()->route('sales.index')
                ->with('error', 'Nota tidak ditemukan: ' . $e->getMessage());
        }
    }

    /**
     * Cancel sale transaction (restore stock)
     */
    public function cancel($invoiceCode)
    {
        try {
            // Cancel sale (restore stock)
            $this->saleService->cancelSale($invoiceCode);
            
            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil dibatalkan'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membatalkan transaksi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete sale permanently
     */
    public function destroy($invoiceCode)
    {
        try {
            // Delete sale
            $deleted = $this->saleService->deleteSale($invoiceCode);
            
            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'Transaksi berhasil dihapus'
                ]);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan'
            ], 404);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus transaksi: ' . $e->getMessage()
            ], 500);
        }
    }

    public function export(Request $request)
    {
        // Validate query parameters
        $validator = Validator::make($request->all(), [
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|integer|in:0,1',
            'payment_method' => 'nullable|string|in:cash,debit,qris',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator);
        }

        $filters = $request->only(['search', 'status', 'payment_method', 'start_date', 'end_date']);
        
        try {
            $exportData = $this->saleService->getExportData($filters);
            
            // Generate CSV content
            $csvContent = $this->generateCSV($exportData, $filters);
            
            $filename = 'sales_export_' . date('Y-m-d_His') . '.csv';
            
            return Response::make($csvContent, 200, [
                'Content-Type' => 'text/csv; charset=utf-8',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);
            
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Gagal export data: ' . $e->getMessage());
        }
    }

    // Di file: SalesController.php
    public function apiUpdate(Request $request, string $invoiceCode)
    {
        $validator = Validator::make($request->all(), [
            'customer_name' => 'nullable|string|max:255',
            'member_code' => 'nullable|string|exists:members,member_code',
            'sales_date' => 'nullable|date',
            'sales_discount_value' => 'nullable|numeric|min:0|max:100',
            'sales_payment_method' => 'nullable|in:cash,debit,qris',
            'sales_status' => 'nullable|boolean',
            'items' => 'nullable|array',
            'items.*.item_code' => 'required|string|exists:items,item_code',
            'items.*.sales_quantity' => 'required|integer|min:1',
            'items.*.sell_price' => 'required|numeric|min:0',
            'items.*.sales_discount_item' => 'nullable|numeric|min:0',
            'items.*.sales_hasil_diskon_item' => 'nullable|numeric|min:0',
            'items.*.total_item_price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Panggil service untuk update
            $updatedSale = $this->saleService->updateSale($invoiceCode, $request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil diperbarui',
                'data' => $updatedSale
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error updating sale: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui transaksi: ' . $e->getMessage()
            ], 500);
        }
    }

    public function apiGetItemInfo(string $itemCode)
    {
        try {
            $itemInfo = $this->saleService->getItemInfo($itemCode);
            
            return response()->json([
                'success' => true,
                'data' => $itemInfo
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function apiSearchItems(Request $request)
    {
        $query = $request->get('q');
        
        if (!$query) {
            return response()->json(['data' => []]);
        }
        
        $items = \App\Models\Item::where(function($q) use ($query) {
                $q->where('item_code', 'LIKE', "%{$query}%")
                ->orWhere('item_name', 'LIKE', "%{$query}%");
            })
            ->where('status', 1)
            ->take(10)
            ->get()
            ->map(function($item) {
                return [
                    'item_code' => $item->item_code,
                    'item_name' => $item->item_name,
                    'sell_price' => (float) $item->sell_price,
                    'stock' => (int) $item->stock,
                    'unit' => $item->unit,
                ];
            });
        
        return response()->json(['data' => $items]);
    }

    /**
     * API Export for AJAX requests
     */
    public function apiExport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|integer|in:0,1',
            'payment_method' => 'nullable|string|in:cash,debit,qris',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $filters = $request->only(['search', 'status', 'payment_method', 'start_date', 'end_date']);
            $exportData = $this->saleService->getExportData($filters);
            
            // Generate CSV content
            $csvContent = $this->generateCSV($exportData, $filters);
            
            $filename = 'sales_export_' . date('Y-m-d_His') . '.csv';
            
            return response()->json([
                'success' => true,
                'data' => base64_encode($csvContent),
                'filename' => $filename
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to export sales: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate CSV content
     */
    private function generateCSV(array $data, array $filters = []): string
    {
        $output = fopen('php://temp', 'r+');
        
        // Header with filter information
        fputcsv($output, ['LAPORAN PENJUALAN']);
        fputcsv($output, ['Tanggal Export', date('d/m/Y H:i:s')]);
        
        // Filter information
        if (!empty($filters)) {
            fputcsv($output, ['']);
            fputcsv($output, ['FILTER YANG DIGUNAKAN:']);
            
            if (!empty($filters['search'])) {
                fputcsv($output, ['Pencarian', $filters['search']]);
            }
            
            if (isset($filters['status'])) {
                $statusText = $filters['status'] == 1 ? 'Paid' : 'Cancelled';
                fputcsv($output, ['Status', $statusText]);
            }
            
            if (!empty($filters['payment_method'])) {
                $paymentText = match($filters['payment_method']) {
                    'cash' => 'Cash',
                    'debit' => 'Debit Card',
                    'qris' => 'QRIS',
                    default => $filters['payment_method']
                };
                fputcsv($output, ['Metode Pembayaran', $paymentText]);
            }
            
            if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
                fputcsv($output, ['Periode', $filters['start_date'] . ' - ' . $filters['end_date']]);
            } elseif (!empty($filters['start_date'])) {
                fputcsv($output, ['Dari Tanggal', $filters['start_date']]);
            } elseif (!empty($filters['end_date'])) {
                fputcsv($output, ['Sampai Tanggal', $filters['end_date']]);
            }
        }
        
        fputcsv($output, ['']);
        fputcsv($output, ['']);
        
        // Main data headers
        $headers = [
            'No.',
            'Kode Invoice',
            'Tanggal',
            'Waktu',
            'Pelanggan',
            'Kode Member',
            'Metode Pembayaran',
            'Status',
            'Subtotal',
            'Diskon',
            'Grand Total',
            'Jumlah Barang',
            // 'Kasir'
        ];
        
        fputcsv($output, $headers);
        
        // Data rows
        $rowNumber = 1;
        foreach ($data as $sale) {
            $row = [
                $rowNumber++,
                $sale['invoice_code'],
                $sale['date'],
                $sale['time'],
                $sale['customer_name'],
                $sale['member_code'],
                $sale['payment_method'],
                $sale['status'],
                $sale['subtotal'],
                $sale['discount_total'],
                $sale['grand_total'],
                $sale['items_count'],
                // $sale['cashier']
            ];
            
            fputcsv($output, $row);
        }
        
        // Add summary
        fputcsv($output, ['']);
        fputcsv($output, ['SUMMARY']);
        fputcsv($output, ['Total Transaksi', count($data)]);
        
        $totalRevenue = array_sum(array_map(function($sale) {
            return (float) str_replace(['.', ','], '', $sale['grand_total']);
        }, $data));
        
        $totalDiscount = array_sum(array_map(function($sale) {
            return (float) str_replace(['.', ','], '', $sale['discount_total']);
        }, $data));
        
        fputcsv($output, ['Total Pendapatan', 'Rp ' . number_format($totalRevenue, 0, ',', '.')]);
        fputcsv($output, ['Total Diskon', 'Rp ' . number_format($totalDiscount, 0, ',', '.')]);
        
        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);
        
        return $csvContent;
    }
}