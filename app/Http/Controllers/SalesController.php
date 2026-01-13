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
            $sales = $this->saleService->getSalesHistory($filters);
            $statistics = $this->saleService->getStatistics($filters);
            
            return Inertia::render('sales/history', [
                'sales' => $sales,
                'statistics' => $statistics,
                'filters' => $filters,
            ]);
            
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to load sales data: ' . $e->getMessage());
        }
    }
}
