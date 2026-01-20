<?php

namespace App\Http\Controllers;

use App\Services\SalesService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;

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
}