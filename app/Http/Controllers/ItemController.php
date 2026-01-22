<?php

namespace App\Http\Controllers;

use App\Services\ItemService;
use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;


class ItemController extends Controller
{
    protected $itemService;

    public function __construct(ItemService $itemService)
    {
        $this->itemService = $itemService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $sortBy = $request->input('sort_by', 'item_name'); 
        $sortDirection = $request->input('sort_direction', 'asc'); 

        // filter show inactive -> boolean
        $showInactive = $request->boolean('show_inactive');

        $items = $this->itemService->getItemsPaginated(10, $search, $sortBy, $sortDirection, $showInactive);
        
        $items->appends($request->query());

        return Inertia::render('Items/Index', [
            'items' => $items,
            'filters' => [
                'search' => $search,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
                'show_inactive' => $showInactive
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreItemRequest $request)
    {
        $this->itemService->createItem($request->validated());
        return redirect()->back()->with('success', 'Barang berhasil ditambahkan');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
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
    public function update(UpdateItemRequest $request, $itemCode)
    {
        $this->itemService->updateItem($itemCode, $request->validated());
        return redirect()->back()->with('success', 'Barang berhasil diperbaharui');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($itemCode)
    {
        $this->itemService->deleteItem($itemCode);
        return redirect()->back()->with('success', 'Barang berhasil dinonaktifkan');
    }

    public function forceDestroy($itemCode) {
        try {
            $this->itemService->forceDeleteItem($itemCode);
            return redirect()->back()->with('success', 'Barang berhasil dihapus');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function restore($itemCode) {
        $this->itemService->restoreItem($itemCode);
        return redirect()->back()->with('success', 'Barang berhasil diaktifkan kembali');
    }   

    public function search(Request $request) {
        $search = $request->input('q');
        $items = $this->itemService->getItemsForDropdown($request->page, $search);
        return response()->json($items);
    }
}
