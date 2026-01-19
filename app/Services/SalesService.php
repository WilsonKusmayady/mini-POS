<?php

namespace App\Services;

use App\Repositories\Contracts\SaleRepositoryInterface;
use App\Repositories\Contracts\ItemRepositoryInterface;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\Sales;

class SalesService
{
    protected $saleRepository;
    protected $itemRepository;

    public function __construct(
        SaleRepositoryInterface $saleRepository,
        ItemRepositoryInterface $itemRepository
    ) {
        $this->saleRepository = $saleRepository;
        $this->itemRepository = $itemRepository;
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

    /**
    * Create new sale transaction
    */
    public function createSale(array $data)
    {
        // Business logic validation
        $this->validateSaleData($data);
        
        // Generate invoice code
        $invoiceCode = $this->generateInvoiceCode();
        
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

    /**
     * Cancel sale transaction
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
        
        if (!empty($filters['status'])) {
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

    /**
     * Format sale response
     */
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
                return [
                    'item_code' => $detail->item_code,
                    'item_name' => $detail->item->item_name ?? 'Unknown Item',
                    'sales_quantity' => $detail->sales_quantity,
                    'sell_price' => (float) $detail->sell_price,
                    'sales_discount_item' => (float) $detail->sales_discount_item,
                    'sales_hasil_diskon_item' => (float) $detail->sales_hasil_diskon_item,
                    'total_item_price' => (float) $detail->total_item_price,
                ];
            })->toArray(),
            'user' => $sale->user ? [
                'user_id' => $sale->user->user_id,
                'name' => $sale->user->name,
            ] : null,
            'member' => $sale->member ? [
                'member_code' => $sale->member->member_code,
                'member_name' => $sale->member->member_name,
            ] : null,
        ];
    }

    private function formatSaleList($sale): array
    {
        return [
            'sales_invoice_code' => $sale->sales_invoice_code,
            'customer_name' => $sale->customer_name,
            'member_code' => $sale->member_code,
            'sales_date' => $sale->sales_date,
            'sales_subtotal' => (float) $sale->sales_subtotal, // TAMBAHKAN
            'sales_discount_value' => (float) $sale->sales_discount_value, // TAMBAHKAN
            'sales_hasil_discount_value' => (float) $sale->sales_hasil_discount_value, // TAMBAHKAN
            'sales_grand_total' => (float) $sale->sales_grand_total,
            'sales_payment_method' => $sale->sales_payment_method,
            'sales_status' => (bool) $sale->sales_status,
            'user_id' => $sale->user_id, // TAMBAHKAN jika perlu
            'created_at' => $sale->created_at,
            'items' => $sale->sales_details->map(function ($detail) {
                return [
                    'item_code' => $detail->item_code,
                    'item_name' => $detail->item->item_name ?? 'Unknown',
                    'sales_quantity' => $detail->sales_quantity,
                    'sell_price' => (float) $detail->sell_price, // TAMBAHKAN
                    'sales_discount_item' => (float) $detail->sales_discount_item, // TAMBAHKAN
                    'sales_hasil_diskon_item' => (float) $detail->sales_hasil_diskon_item, // TAMBAHKAN
                    'total_item_price' => (float) $detail->total_item_price, // TAMBAHKAN
                ];
            })->toArray(),
        ];
    }

}