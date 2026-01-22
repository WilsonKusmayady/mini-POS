<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\PurchaseService;
use App\Services\ItemService;
use App\Models\Item;
use App\Models\User; 
use App\Models\Supplier; 
use App\Http\Requests\StorePurchaseRequest;
use Illuminate\Support\Facades\Validator; 
use Inertia\Inertia;

class PurchaseController extends Controller
{
    protected $purchaseService;
    protected $itemService;

    public function __construct(PurchaseService $purchaseService, ItemService $itemService) {
        $this->purchaseService = $purchaseService;
        $this->itemService = $itemService;
    }

    public function export(Request $request)
    {
        // 1. Ambil filter dari URL
        $filters = $request->only([
            'search', 'supplier_id', 'user_id', 
            'start_date', 'end_date', 'min_total', 'max_total', 'show_inactive'
        ]);

        if (isset($filters['show_inactive'])) {
            $filters['show_inactive'] = filter_var($filters['show_inactive'], FILTER_VALIDATE_BOOLEAN);
        }

        $fileName = 'purchases_export_' . date('Y-m-d_H-i-s') . '.csv';

        return response()->streamDownload(function() use ($filters) {
            $handle = fopen('php://output', 'w');
            
            // Header CSV
            fputcsv($handle, ['No Invoice', 'Tanggal', 'Supplier', 'Operator', 'Status', 'Total']);

            // 2. Panggil Service method BARU (getExportData)
            $purchases = $this->purchaseService->getExportData($filters);

            foreach ($purchases as $purchase) {
                fputcsv($handle, [
                    $purchase->purchase_invoice_number,
                    $purchase->purchase_date,
                    $purchase->supplier ? $purchase->supplier->supplier_name : '-',
                    $purchase->user ? $purchase->user->user_name : '-',
                    $purchase->purchase_status,
                    $purchase->purchase_grand_total
                ]);
            }
            fclose($handle);
        }, $fileName, ['Content-Type' => 'text/csv']);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // UBAHAN: Kita tidak fetch purchase history di sini lagi.
        // Frontend akan fetch via API (apiIndex).
        // Kita kirim data master untuk dropdown filter.
        
        return Inertia::render('Purchase/Index', [
            'suppliers_list' => Supplier::select('supplier_id', 'supplier_name')->orderBy('supplier_name')->get(),
            'users_list' => User::select('user_id', 'user_name')->orderBy('user_name')->get(),
        ]);
    }

    /**
     * API: Get paginated purchases with filters
     * Method BARU untuk handle filter ajax
     */
    public function apiIndex(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'page' => 'nullable|integer',
            'per_page' => 'nullable|integer',
            'search' => 'nullable|string',
            'supplier_id' => 'nullable|integer',
            'user_id' => 'nullable|integer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'min_total' => 'nullable|numeric',
            'max_total' => 'nullable|numeric',
            'show_inactive' => 'nullable',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Ambil hanya field yang relevan untuk filter
            $filters = $request->only([
                'search', 
                'supplier_id', 
                'user_id', 
                'start_date', 
                'end_date', 
                'min_total', 
                'max_total',
                'show_inactive'
            ]);

            if (isset($filters['show_inactive'])) {
                $filters['show_inactive'] = filter_var($filters['show_inactive'], FILTER_VALIDATE_BOOLEAN);
            }
            
            $perPage = $request->get('per_page', 10);

            // Panggil service yang sudah kita update sebelumnya
            // Pastikan method getPaginatedPurchases sudah ada di PurchaseService
            $purchases = $this->purchaseService->getPaginatedPurchases($filters, $perPage);

            return response()->json($purchases);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch purchases: ' . $e->getMessage()
            ], 500);
        }
    }

    public function restore($id) {
        $this->purchaseService->restorePurchase($id);
        return response()->json([
            'success' => true,
            'message' => 'Pembelian berhasil dipulihkan (restored).'
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Purchase/Create', [
            'suppliers' => Supplier::all(),
            'items' => Item::all()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePurchaseRequest $request)
    {
        $this->purchaseService->createPurchase($request->validated());
        return redirect()->route('purchases.index')->with('success', 'Pembelian berhasil ditambahkan');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $purchase = $this->purchaseService->getPurchaseByInvoice($id);

        if (!$purchase) {
            return redirect()->route('purchases.index')->with('error', 'Pembelian tidak ditemukan');
        } 

        return Inertia::render('Purchase/Show', [
            'purchase' => $purchase
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
        $this->purchaseService->deletePurchase($id);
        
        return response()->json([
            'success' => true,
            'message' => 'Pembelian berhasil dinonaktifkan'
        ]);
    }
}