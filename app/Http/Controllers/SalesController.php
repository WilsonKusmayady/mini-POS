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
}