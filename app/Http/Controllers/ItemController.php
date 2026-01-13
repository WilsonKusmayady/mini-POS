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
    public function index()
    {
        $items = $this->itemService->getAllItems();
        // 'Items/Index' adalah file resources/js/pages/Items/Index.tsx
        return Inertia::render('Items/Index', ['items' => $items]);
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
        return redirect()->back()->with('success', 'Barang berhasil dihapus');
    }
}
