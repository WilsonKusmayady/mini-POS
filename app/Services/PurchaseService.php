<?php

namespace App\Services;

// use App\Repositories\PurchaseRepository;
// use App\Repositories\ItemRepository;
use App\Repositories\Contracts\ItemRepositoryInterface;
use App\Repositories\Contracts\PurchaseRepositoryInterface;
use App\Services\CodeGeneratorService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class PurchaseService
{
    protected $purchaseRepository;
    protected $itemRepository;
    protected $codeGeneratorService;

    public function __construct(
        PurchaseRepositoryInterface $purchaseRepository,
        ItemRepositoryInterface $itemRepository,
        CodeGeneratorService $codeGeneratorService
    ) {
        $this->purchaseRepository = $purchaseRepository;
        $this->itemRepository = $itemRepository;
        $this->codeGeneratorService = $codeGeneratorService;
    }

    public function getPurchaseHistory() {
        return $this->purchaseRepository->getAllPurchasesPaginated(10);
    }

    public function getPurchaseByInvoice($invoiceNumber) {
        return $this->purchaseRepository->getPurchaseWithDetails($invoiceNumber);
    }

    public function getPurchaseById($id) 
    {
        return $this->purchaseRepository->getPurchaseWithDetails($id);
    }

    public function updatePurchase($id, array $data)
    {
        $totalAmount = 0;

        // Hitung Grand Total baru
        foreach ($data['items'] as $item) {
            $discount = $item['discount_item'] ?? 0;
            $priceAfterDiscount = $item['buy_price'] - ($item['buy_price'] * ($discount / 100));
            $subtotal = $priceAfterDiscount * $item['quantity'];
            $totalAmount += $subtotal;
        }

        // Siapkan data untuk repository
        $updateData = [
            'supplier_id' => $data['supplier_id'],
            'date' => $data['purchase_date'], 
            'total_amount' => $totalAmount,
            'items' => $data['items']
        ];

        return $this->purchaseRepository->update($id, $updateData);
    }

    public function createPurchase(array $data)
    {
        return DB::transaction(function () use ($data) {
            $invoiceNumber = $this->codeGeneratorService->generatePurchaseInvoiceCode();

            // 1. Hitung Total dengan Diskonf
            $grandTotal = 0;
            
            // Siapkan data detail untuk disimpan nanti (agar tidak loop 2x untuk hitung total)
            $detailsToSave = [];

            foreach ($data['items'] as $item) {
                $buyPrice = $item['buy_price'];
                $quantity = $item['quantity'];
                $discountPercentage = $item['discount_item'] ?? 0; // Default 0 jika kosong

                // 1. Hitung Nominal Diskon per Item
                // Rumus: Harga * (Persen / 100)
                $discountAmountPerItem = $buyPrice * ($discountPercentage / 100);

                // 2. Hitung Harga Netto per Item (Setelah Diskon)
                $priceAfterDiscount = $buyPrice - $discountAmountPerItem;

                // 3. Hitung Subtotal Baris (Netto * Jumlah)
                $rowTotal = $priceAfterDiscount * $quantity;

                $grandTotal += $rowTotal;

                $detailsToSave[] = [
                    'item_code' => $item['item_code'],
                    'quantity' => $quantity,
                    'buy_price' => $buyPrice,
                    'purchase_discount_item' => $discountPercentage,
                    'purchase_hasil_diskon_item' => $priceAfterDiscount, // Harga netto satuan
                    'total_item_price' => $rowTotal, // Subtotal baris
                ];
            }

            // 2. Simpan Header Purchase
            $purchase = $this->purchaseRepository->createPurchase([
                'purchase_invoice_number' => $invoiceNumber,
                'supplier_id' => $data['supplier_id'],
                'user_id' => Auth::id(),
                'purchase_date' => $data['purchase_date'],
                'purchase_subtotal' => $grandTotal, // Asumsi subtotal = grand total (sebelum pajak global)
                'purchase_grand_total' => $grandTotal,
                'purchase_status' => 'paid', 
            ]);

            // 3. Simpan Details & Update Stok
            foreach ($detailsToSave as $detail) {
                $this->purchaseRepository->createDetail(array_merge($detail, [
                    'purchase_invoice_number' => $invoiceNumber,
                ]));

                // Update Stok
                $currentItem = $this->itemRepository->findByCode($detail['item_code']);
                if ($currentItem) {
                    $newStock = $currentItem->item_stock + $detail['quantity'];
                    $this->itemRepository->update($detail['item_code'], ['item_stock' => $newStock]);
                }
            }

            return $purchase;
        });
    }

    public function getPaginatedPurchases(array $filters, int $perPage = 10) {
        return $this->purchaseRepository->getPaginated($filters, $perPage);
    }

    public function restorePurchase($invoiceNumber) {
        return $this->purchaseRepository->restore($invoiceNumber);
    }

    public function deletePurchase($invoiceNumber) {
        return $this->purchaseRepository->destroy($invoiceNumber);
    }

public function getExportData(array $filters) 
    {
        // Ambil data raw dari repository
        $purchases = $this->purchaseRepository->getForExport($filters);
        
        $formattedData = [];
        
        foreach ($purchases as $purchase) {
            $formattedData[] = $this->formatPurchaseForExport($purchase);
        }
        
        return $formattedData;
    }

    // [NEW] Helper untuk format data export (Private)
    private function formatPurchaseForExport($purchase): array
    {
        // Format items menjadi string atau array structure sesuai kebutuhan Excel
        $items = $purchase->details->map(function ($detail) {
            return [
                'item_code' => $detail->item_code,
                'item_name' => $detail->item->item_name ?? 'Unknown',
                'quantity' => $detail->quantity,
                'price' => number_format($detail->buy_price, 0, ',', '.'),
                'total' => number_format($detail->total_item_price, 0, ',', '.'),
            ];
        });

        return [
            'invoice_number' => $purchase->purchase_invoice_number,
            'date' => Carbon::parse($purchase->purchase_date)->format('d/m/Y'),
            'supplier_name' => $purchase->supplier->supplier_name ?? 'Unknown',
            'user_name' => $purchase->user->name ?? 'Unknown', // Sesuaikan field name di User model
            'status' => ucfirst($purchase->purchase_status),
            'items_count' => $purchase->details->count(),
            'subtotal' => number_format($purchase->purchase_subtotal, 0, ',', '.'),
            'grand_total' => number_format($purchase->purchase_grand_total, 0, ',', '.'),
            'items' => $items->toArray(),
        ];
    }

    public function getStatistics(array $filters = []): array {
        return $this->purchaseRepository->getPurchaseStatistics($filters);
    }
}