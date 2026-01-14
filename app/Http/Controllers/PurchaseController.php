<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\PurchaseService;
use App\Models\Item;
use App\Services\ItemService;
use App\Models\Supplier; // Bisa diganti SupplierService/Repository jika ada
use App\Models\SupplierRepository; // Bisa diganti SupplierService/Repository jika ada
use App\Http\Requests\StorePurchaseRequest;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    protected $purchaseService;
    protected $itemService;

    public function __construct(PurchaseService $purchaseService, ItemService $itemService) {
        $this->purchaseService = $purchaseService;
        $this->itemService = $itemService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        $purchases = $this->purchaseService->getPurchaseHistory();
        return Inertia::render('Purchase/Index', [
            'purchases' => $purchases
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
        //
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
    }
}
