<?php

namespace App\Services;

use App\Repositories\Contracts\SaleRepositoryInterface;
use App\Repositories\Contracts\ItemRepositoryInterface;
use App\Services\CodeGeneratorService;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\Item;
use App\Models\Member;
use App\Models\Sales;
use Illuminate\Support\Facades\Log;


class SalesService
{
    protected $saleRepository;
    protected $itemRepository;
    protected $codeGeneratorService;

    public function __construct(
        SaleRepositoryInterface $saleRepository,
        ItemRepositoryInterface $itemRepository,
        CodeGeneratorService $codeGeneratorService
    ) {
        $this->saleRepository = $saleRepository;
        $this->itemRepository = $itemRepository;
        $this->codeGeneratorService = $codeGeneratorService;
    }

    /**
     * Get sales history with filters
     */
    public function getSalesHistory(array $filters = [])
    {
        // Validate and format filters
        $validatedFilters = $this->validateFilters($filters);
        
        return $this->saleRepository->getSalesHistory($validatedFilters);
    }

    /**
     * Get sales with pagination
     */
    public function getAllSalesPaginated(array $filters = [], int $perPage = 10, int $page = 1)
    {
        $validatedFilters = $this->validateFilters($filters);

        $paginated = $this->saleRepository
            ->getAllSalesPaginated($perPage, $validatedFilters, $page);

        $paginated->getCollection()->transform(function ($sale) {
            return $this->formatSaleList($sale);
        });

        return $paginated;
    }

    /**
     * Get sale by invoice code
     */
    public function getSale(string $invoiceCode)
    {
        $sale = $this->saleRepository->getSaleWithDetails($invoiceCode);

        if (!$sale) {
            throw new \Exception('Sale not found');
        }

        return $this->formatSaleResponse($sale);
    }

    public function getSaleForNota(string $invoiceCode): Sales
{
    $sale = $this->saleRepository->getSaleForNota($invoiceCode);

    if (!$sale) {
        throw new \Exception('Sale not found');
    }

    return $sale;
}



    
    /**
    * Create new sale transaction
    */
    public function createSale(array $data)
    {
        // Business logic validation
        $this->validateSaleData($data);
        
        // Generate invoice code
        $invoiceCode = $this->codeGeneratorService->generateSalesInvoiceCode();
        
        // Calculate totals (gunakan dari data yang sudah dihitung di frontend)
        $saleData = [
            'sales_invoice_code' => $invoiceCode,
            'user_id' => auth()->id(),
            'member_code' => $data['member_code'] ?? null,
            'customer_name' => $data['customer_name'] ?? null,
            'sales_date' => $data['sales_date'] ?? Carbon::now()->toDateString(),
            'sales_subtotal' => $data['sales_subtotal'] ?? 0,
            'sales_discount_value' => $data['discount_percentage'] ?? 0,
            'sales_hasil_discount_value' => $data['sales_hasil_discount_value'] ?? 0,
            'sales_grand_total' => $data['sales_grand_total'] ?? 0,
            'sales_payment_method' => $data['payment_method'],
            'sales_status' => 1, // Default to paid
        ];

        // Start transaction
        \DB::beginTransaction();
        
        try {
            $sale = $this->saleRepository->createSale($saleData);
            
            // Create sale details
            foreach ($data['items'] as $item) {
                $this->validateItemStock($item);
                
                $detailData = [
                    'sales_invoice_code' => $invoiceCode,
                    'item_code' => $item['item_code'],
                    'sales_quantity' => (int) $item['sales_quantity'],
                    'sell_price' => (float) $item['sell_price'],
                    'sales_discount_item' => $item['sales_discount_item'] ?? 0,
                    'sales_hasil_diskon_item' => $item['sales_hasil_diskon_item'] ?? 0,
                    'total_item_price' => (float) $item['total_item_price'],
                ];

                $this->saleRepository->createDetail($detailData);
                
                // Update item stock
                $this->itemRepository->decreaseStock(
                    $item['item_code'], 
                    $item['sales_quantity']
                );
            }
            
            \DB::commit();
            
            return $this->getSale($invoiceCode);
            
        } catch (\Exception $e) {
            \DB::rollBack();
            throw $e;
        }
    }

    public function updateSale(string $invoiceCode, array $data)
    {
        \DB::beginTransaction();
        
        try {
            // Validasi data yang diupdate
            $this->validateUpdateData($data);
            
            // Get sale untuk validasi
            $sale = $this->saleRepository->getSaleWithDetails($invoiceCode);
            
            if (!$sale) {
                throw new \Exception('Transaksi tidak ditemukan');
            }

            // Check if sale is cancelled - can't edit cancelled sales
            if ($sale->sales_status == 0 && !isset($data['sales_status'])) {
                throw new \Exception('Transaksi yang sudah dibatalkan tidak dapat diedit');
            }

            // Jika mengubah status dari active (1) ke cancelled (0), restore stock
            if (isset($data['sales_status']) && $data['sales_status'] == 0 && $sale->sales_status == 1) {
                // Restore stock dari semua item
                foreach ($sale->sales_details as $detail) {
                    $this->itemRepository->increaseStock(
                        $detail->item_code,
                        $detail->sales_quantity
                    );
                }
            }
            
            // Jika mengubah status dari cancelled (0) ke active (1), kurangi stock
            if (isset($data['sales_status']) && $data['sales_status'] == 1 && $sale->sales_status == 0) {
                // Kurangi stock untuk semua item
                foreach ($sale->sales_details as $detail) {
                    // Cek stok tersedia
                    $availableStock = $this->itemRepository->getItemStock($detail->item_code);
                    
                    if ($availableStock < $detail->sales_quantity) {
                        throw new \Exception("Stok tidak cukup untuk item: {$detail->item_code}");
                    }
                    
                    $this->itemRepository->decreaseStock(
                        $detail->item_code,
                        $detail->sales_quantity
                    );
                }
            }

            // Jika mengubah member_code, validasi member exists
            if (isset($data['member_code']) && !empty($data['member_code'])) {
                $memberExists = \App\Models\Member::where('member_code', $data['member_code'])->exists();
                if (!$memberExists) {
                    throw new \Exception('Member tidak ditemukan');
                }
                
                // Jika sudah ada member code (transaksi sudah terkait member), tidak bisa diubah
                if ($sale->member_code && $sale->member_code !== $data['member_code']) {
                    throw new \Exception('Transaksi yang sudah terkait member tidak dapat diubah membernya');
                }
            }

            // Handle item modifications if provided
            if (isset($data['items']) && is_array($data['items'])) {
                $this->updateSaleItems($sale, $data['items']);
            }

            // ✅ LOGIC BARU: Update member_name jika sale memiliki member_code dan customer_name diubah
            if (isset($data['customer_name']) && $sale->member_code) {
                $this->updateMemberNameFromSale($sale->member_code, $data['customer_name']);
            }

            // Update sale
            $this->saleRepository->updateSale($invoiceCode, $data);
            
            \DB::commit();
            
            // Return updated sale
            return $this->getSale($invoiceCode);
            
        } catch (\Exception $e) {
            \DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update member name from sale customer_name
     */
    private function updateMemberNameFromSale(string $memberCode, string $customerName): bool
    {
        // Cari member berdasarkan member_code
        $member = Member::where('member_code', $memberCode)->first();
        
        if (!$member) {
            throw new \Exception('Member tidak ditemukan');
        }
        
        // Update member_name dengan customer_name dari sales
        return $member->update([
            'member_name' => $customerName
        ]);
    }

    private function updateSaleItems(Sales $sale, array $items)
    {
        // Validate all items first
        foreach ($items as $item) {
            if (empty($item['item_code'])) {
                throw new \Exception('Item code is required');
            }
            
            if (!isset($item['sales_quantity']) || $item['sales_quantity'] <= 0) {
                throw new \Exception('Item quantity must be greater than 0');
            }
            
            // Check if item exists and get stock
            $itemExists = \App\Models\Item::where('item_code', $item['item_code'])->first();
            if (!$itemExists) {
                throw new \Exception("Item dengan kode {$item['item_code']} tidak ditemukan");
            }
            
            // ✅ Validasi stok jika ada informasi stok di data
            if (isset($item['stock'])) {
                if ($item['sales_quantity'] > $item['stock']) {
                    throw new \Exception("Stok tidak cukup untuk item: {$item['item_code']}. Stok tersedia: {$item['stock']}");
                }
            }
        }
        
        // Get current items to calculate stock differences
        $currentDetails = $sale->sales_details->keyBy('item_code');
        $newItems = collect($items)->keyBy('item_code');
        
        // Calculate stock differences
        foreach ($newItems as $itemCode => $newItem) {
            $newQuantity = (int) $newItem['sales_quantity'];
            
            if (isset($currentDetails[$itemCode])) {
                // Item exists in current sale - calculate quantity difference
                $currentQuantity = $currentDetails[$itemCode]->sales_quantity;
                $quantityDiff = $newQuantity - $currentQuantity;
                
                if ($quantityDiff > 0) {
                    // Need to decrease stock
                    $availableStock = $this->itemRepository->getItemStock($itemCode);
                    if ($availableStock < $quantityDiff) {
                        throw new \Exception("Stok tidak cukup untuk item: {$itemCode}");
                    }
                    $this->itemRepository->decreaseStock($itemCode, $quantityDiff);
                } elseif ($quantityDiff < 0) {
                    // Need to increase stock (return stock)
                    $this->itemRepository->increaseStock($itemCode, abs($quantityDiff));
                }
            } else {
                // New item - check stock
                $availableStock = $this->itemRepository->getItemStock($itemCode);
                if ($availableStock < $newQuantity) {
                    throw new \Exception("Stok tidak cukup untuk item: {$itemCode}");
                }
                $this->itemRepository->decreaseStock($itemCode, $newQuantity);
            }
        }
        
        // Check for removed items - restore their stock
        foreach ($currentDetails as $itemCode => $detail) {
            if (!isset($newItems[$itemCode])) {
                // Item was removed - restore stock
                $this->itemRepository->increaseStock($itemCode, $detail->sales_quantity);
            }
        }
        
        // Delete all existing details and create new ones
        \DB::table('sales_details')
            ->where('sales_invoice_code', $sale->sales_invoice_code)
            ->delete();
        
        // Create new details
        foreach ($items as $item) {
            $detailData = [
                'sales_invoice_code' => $sale->sales_invoice_code,
                'item_code' => $item['item_code'],
                'sales_quantity' => (int) $item['sales_quantity'],
                'sell_price' => (float) $item['sell_price'],
                'sales_discount_item' => $item['sales_discount_item'] ?? 0,
                'sales_hasil_diskon_item' => $item['sales_hasil_diskon_item'] ?? 0,
                'total_item_price' => (float) $item['total_item_price'],
            ];
            
            $this->saleRepository->createDetail($detailData);
        }
        
        // Recalculate totals
        $this->recalculateSaleTotals($sale);
    }

    private function recalculateSaleTotals(Sales $sale)
    {
        $sale->load('sales_details');
        
        $subtotal = $sale->sales_details->sum('total_item_price');
        $itemDiscounts = $sale->sales_details->sum('sales_hasil_diskon_item');
        
        // Calculate transaction discount
        $discountPercentage = $sale->sales_discount_value;
        $transactionDiscount = $subtotal * ($discountPercentage / 100);
        
        $grandTotal = $subtotal - $transactionDiscount;
        
        // Update sale totals
        $sale->update([
            'sales_subtotal' => $subtotal,
            'sales_hasil_discount_value' => $transactionDiscount,
            'sales_grand_total' => $grandTotal,
        ]);
    }

    public function getItemInfo(string $itemCode)
    {
        $item = Item::where('item_code', $itemCode)->first();
        
        if (!$item) {
            throw new \Exception('Item tidak ditemukan');
        }
        
        return [
            'item_code' => $item->item_code,
            'item_name' => $item->item_name,
            'sell_price' => (float) $item->sell_price,
            'stock' => (int) $item->item_stock,
            'unit' => 'pcs',
        ];
    }
   
    private function validateUpdateData(array $data): void
    {
        // Validasi member_code jika diisi
        if (isset($data['member_code']) && $data['member_code'] !== null) {
            if (!is_string($data['member_code'])) {
                throw new \Exception('Member code harus berupa string');
            }
        }

        // Validasi customer_name jika diisi
        if (isset($data['customer_name'])) {
            if (!is_string($data['customer_name'])) {
                throw new \Exception('Nama pelanggan harus berupa string');
            }
            
            if (strlen(trim($data['customer_name'])) < 2) {
                throw new \Exception('Nama pelanggan minimal 2 karakter');
            }
            
            if (strlen(trim($data['customer_name'])) > 255) {
                throw new \Exception('Nama pelanggan maksimal 255 karakter');
            }
        }

        // Validasi sales_date jika diisi
        if (isset($data['sales_date'])) {
            try {
                \Carbon\Carbon::parse($data['sales_date']);
            } catch (\Exception $e) {
                throw new \Exception('Format tanggal tidak valid');
            }
        }

        // Validasi sales_discount_value jika diisi
        if (isset($data['sales_discount_value'])) {
            if (!is_numeric($data['sales_discount_value']) || 
                $data['sales_discount_value'] < 0 || 
                $data['sales_discount_value'] > 100) {
                throw new \Exception('Diskon harus antara 0-100%');
            }
        }

        // Validasi sales_payment_method jika diisi
        if (isset($data['sales_payment_method'])) {
            $validMethods = ['cash', 'debit', 'qris'];
            if (!in_array($data['sales_payment_method'], $validMethods)) {
                throw new \Exception('Metode pembayaran tidak valid');
            }
        }

        // Validasi sales_status jika diisi
        if (isset($data['sales_status'])) {
            if (!is_bool($data['sales_status']) && !in_array($data['sales_status'], [0, 1])) {
                throw new \Exception('Status harus boolean (0 atau 1)');
            }
        }
    }

    /**
     * Cancel sale transaction (restore stock)
     */
    public function cancelSale(string $invoiceCode)
    {
        $sale = $this->saleRepository->getSaleWithDetails($invoiceCode);
        
        if (!$sale) {
            throw new \Exception('Sale not found');
        }
        
        if ($sale->sales_status == 0) {
            throw new \Exception('Sale is already cancelled');
        }
        
        \DB::beginTransaction();
        
        try {
            // Update sale status
            $this->saleRepository->updateSaleStatus($invoiceCode, 0);
            
            // Restore item stock
            foreach ($sale->sales_details as $detail) {
                $this->itemRepository->increaseStock(
                    $detail->item_code,
                    $detail->sales_quantity
                );
            }
            
            \DB::commit();
            
            return true;
            
        } catch (\Exception $e) {
            \DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete sale transaction permanently
     */
    public function deleteSale(string $invoiceCode)
    {
        $sale = $this->saleRepository->getSaleWithDetails($invoiceCode);
        
        if (!$sale) {
            throw new \Exception('Sale not found');
        }
        
        \DB::beginTransaction();
        
        try {
            // Restore item stock before deletion if sale is active
            if ($sale->sales_status == 1) {
                foreach ($sale->sales_details as $detail) {
                    $this->itemRepository->increaseStock(
                        $detail->item_code,
                        $detail->sales_quantity
                    );
                }
            }
            
            // Delete sale and related details (cascade)
            $deleted = $this->saleRepository->deleteSale($invoiceCode);
            
            \DB::commit();
            
            return $deleted;
            
        } catch (\Exception $e) {
            \DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get sales statistics
     */
    public function getStatistics(array $filters = [])
    {
        $validatedFilters = $this->validateFilters($filters);
        
        return $this->saleRepository->getSalesStatistics($validatedFilters);
    }

    /**
     * Generate invoice code
     */
    private function generateInvoiceCode(): string
    {
        $date = Carbon::now()->format('ymd');
        $prefix = "INV{$date}";
        
        $latest = $this->saleRepository->getLatestByPrefix($prefix);
        
        if ($latest) {
            $lastNumber = (int) substr($latest->sales_invoice_code, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }
        
        return "{$prefix}{$newNumber}";
    }

    /**
     * Calculate sale totals
     */
    private function calculateSaleTotals(array $data): array
    {
        $subtotal = 0;
        $itemDiscounts = 0;
        
        foreach ($data['items'] as $item) {
            $itemTotal = $this->calculateItemTotal($item);
            $subtotal += $itemTotal;
            $itemDiscounts += $this->calculateItemDiscount($item);
        }
        
        // Transaction discount
        $discountPercentage = $data['discount_percentage'] ?? 0;
        $transactionDiscount = $subtotal * ($discountPercentage / 100);
        
        $grandTotal = $subtotal - $transactionDiscount;
        
        return [
            'subtotal' => $subtotal,
            'discount_amount' => $transactionDiscount,
            'grand_total' => $grandTotal,
        ];
    }

    /**
     * Calculate item total
     */
    private function calculateItemTotal(array $item): float
    {
        $quantity = $item['quantity'];
        $price = $item['sell_price'];
        $discount = $this->calculateItemDiscount($item);
        
        return ($price * $quantity) - $discount;
    }

    /**
     * Calculate item discount
     */
    private function calculateItemDiscount(array $item): float
    {
        $quantity = $item['quantity'];
        $price = $item['sell_price'];
        $discountPercentage = $item['item_discount'] ?? 0;
        
        return ($price * $quantity) * ($discountPercentage / 100);
    }

    /**
     * Validate sale data
     */
    private function validateSaleData(array $data): void
    {
        if (empty($data['items']) || !is_array($data['items'])) {
            throw new \Exception('Items are required');
        }
        
        if (empty($data['payment_method'])) {
            throw new \Exception('Payment method is required');
        }
        
        if (!in_array($data['payment_method'], ['cash', 'debit', 'qris'])) {
            throw new \Exception('Invalid payment method');
        }
        
        foreach ($data['items'] as $item) {
            if (empty($item['item_code'])) {
                throw new \Exception('Item code is required');
            }
            
            if (
                !isset($item['sales_quantity']) ||
                $item['sales_quantity'] <= 0
            ) {
                throw new \Exception('Item quantity must be greater than 0');
            }
            
            if (empty($item['sell_price']) || $item['sell_price'] < 0) {
                throw new \Exception('Item price is required');
            }
        }
    }

    /**
     * Validate item stock
     */
    private function validateItemStock(array $item): void
    {
        $availableStock = $this->itemRepository->getItemStock($item['item_code']);
        
        if ($availableStock < $item['sales_quantity']) {
            throw new \Exception("Insufficient stock for item: {$item['item_code']}");
        }
    }

    /**
     * Validate filters
     */
    private function validateFilters(array $filters): array
    {
        $validated = [];
        
        if (!empty($filters['search'])) {
            $validated['search'] = trim($filters['search']);
        }
        
        if (isset($filters['status'])) {
            $validated['status'] = (int) $filters['status'];
        }
        
        if (!empty($filters['payment_method'])) {
            $validated['payment_method'] = $filters['payment_method'];
        }
        
        if (!empty($filters['start_date'])) {
            try {
                $validated['start_date'] = Carbon::parse($filters['start_date'])->toDateString();
            } catch (\Exception $e) {
                // Tanggal tidak valid, abaikan
            }
        }
        
        if (!empty($filters['end_date'])) {
            try {
                $validated['end_date'] = Carbon::parse($filters['end_date'])->toDateString();
            } catch (\Exception $e) {
                // Tanggal tidak valid, abaikan
            }
        }
        
        return $validated;
    }

    // Di formatSaleResponse:
    private function formatSaleResponse(Sales $sale): array
    {
        return [
            'sales_invoice_code' => $sale->sales_invoice_code,
            'customer_name' => $sale->customer_name,
            'member_code' => $sale->member_code,
            'sales_date' => $sale->sales_date,
            'sales_subtotal' => (float) $sale->sales_subtotal,
            'sales_discount_value' => (float) $sale->sales_discount_value,
            'sales_hasil_discount_value' => (float) $sale->sales_hasil_discount_value,
            'sales_grand_total' => (float) $sale->sales_grand_total,
            'sales_payment_method' => $sale->sales_payment_method,
            'sales_status' => $sale->sales_status,
            'user_id' => $sale->user_id,
            'created_at' => $sale->created_at->toISOString(),
            'items' => $sale->sales_details->map(function ($detail) {
                // Ambil data item dengan stock
                $item = $detail->item;
                
                return [
                    'item_code' => $detail->item_code,
                    'item_name' => $item->item_name ?? 'Unknown Item',
                    'sales_quantity' => $detail->sales_quantity,
                    'sell_price' => (float) $detail->sell_price,
                    'sales_discount_item' => (float) $detail->sales_discount_item,
                    'sales_hasil_diskon_item' => (float) $detail->sales_hasil_diskon_item,
                    'total_item_price' => (float) $detail->total_item_price,
                    'stock' => $item ? (int) $item->item_stock : 0, // ✅ Gunakan item_stock
                    'unit' => 'pcs', // Item tidak punya kolom unit, default ke 'pcs'
                ];
            })->toArray(),
            'user' => $sale->user ? [
                'user_id' => $sale->user->user_id,
                'name' => $sale->user->name,
            ] : null,
            'member' => $sale->member ? [
                'member_code' => $sale->member->member_code,
                'member_name' => $sale->member->member_name,
                'member_status' => $sale->member?->status,
            ] : null,
        ];
    }

    // Di formatSaleList:
    private function formatSaleList($sale): array
    {
        return [
            'sales_invoice_code' => $sale->sales_invoice_code,
            'customer_name' => $sale->customer_name,
            'member_code' => $sale->member_code,
            'member' => $sale->member ? [
                'member_code' => $sale->member->member_code,
                'member_name' => $sale->member->member_name,
                'member_status' => $sale->member->status,
            ] : null,
            'sales_date' => $sale->sales_date,
            'sales_subtotal' => (float) $sale->sales_subtotal,
            'sales_discount_value' => (float) $sale->sales_discount_value,
            'sales_hasil_discount_value' => (float) $sale->sales_hasil_discount_value,
            'sales_grand_total' => (float) $sale->sales_grand_total,
            'sales_payment_method' => $sale->sales_payment_method,
            'sales_status' => (bool) $sale->sales_status,
            'user_id' => $sale->user_id,
            'created_at' => $sale->created_at,
            'items' => $sale->sales_details->map(function ($detail) {
                $item = $detail->item;
                
                return [
                    'item_code' => $detail->item_code,
                    'item_name' => $item->item_name ?? 'Unknown',
                    'sales_quantity' => $detail->sales_quantity,
                    'sell_price' => (float) $detail->sell_price,
                    'sales_discount_item' => (float) $detail->sales_discount_item,
                    'sales_hasil_diskon_item' => (float) $detail->sales_hasil_diskon_item,
                    'total_item_price' => (float) $detail->total_item_price,
                    'stock' => $item ? (int) $item->item_stock : 0, // ✅ Gunakan item_stock
                    'unit' => 'pcs', // Default unit
                ];
            })->toArray(),
        ];
    }

    public function getExportData(array $filters = []): array
    {
        $validatedFilters = $this->validateFilters($filters);
        
        $sales = $this->saleRepository->getAllSalesPaginated(100000, $validatedFilters); // Get all sales for export
        
        $formattedData = [];
        
        foreach ($sales as $sale) {
            $formattedSale = $this->formatSaleForExport($sale);
            $formattedData[] = $formattedSale;
        }
        
        return $formattedData;
    }

    /**
     * Format sale for export
     */
    private function formatSaleForExport($sale): array
    {
        $items = $sale->sales_details->map(function ($detail) {
            return [
                'item_code' => $detail->item_code,
                'item_name' => $detail->item->item_name ?? 'Unknown',
                'quantity' => $detail->sales_quantity,
                'price' => number_format($detail->sell_price, 0, ',', '.'),
                'discount' => number_format($detail->sales_discount_item, 0, ',', '.'),
                'total' => number_format($detail->total_item_price, 0, ',', '.'),
            ];
        });

        return [
            'invoice_code' => $sale->sales_invoice_code,
            'date' => Carbon::parse($sale->sales_date)->format('d/m/Y'),
            'time' => Carbon::parse($sale->created_at)->format('H:i:s'),
            'customer_name' => $sale->customer_name ?? ($sale->member ? $sale->member->member_name : 'Guest'),
            'member_code' => $sale->member_code ?? '-',
            'payment_method' => $this->formatPaymentMethod($sale->sales_payment_method),
            'status' => $sale->sales_status ? 'Paid' : 'Cancelled',
            'subtotal' => number_format($sale->sales_subtotal, 0, ',', '.'),
            'discount_total' => number_format($sale->sales_hasil_discount_value, 0, ',', '.'),
            'grand_total' => number_format($sale->sales_grand_total, 0, ',', '.'),
            'items_count' => $sale->sales_details->count(),
            'items' => $items->toArray(),
            // 'cashier' => $sale->user->name ?? 'Unknown',
        ];
    }

    private function formatPaymentMethod($method): string
    {
        return match($method) {
            'cash' => 'Cash',
            'debit' => 'Debit Card',
            'qris' => 'QRIS',
            default => $method,
        };
    }
}