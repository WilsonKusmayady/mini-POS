<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\Item;
use App\Models\Supplier;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PurchaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ambil data master yang diperlukan
        $items = Item::all();
        $suppliers = Supplier::all();
        $users = User::all();

        // Pastikan data master ada
        if ($items->isEmpty() || $suppliers->isEmpty() || $users->isEmpty()) {
            $this->command->warn('Mohon seed Items, Suppliers, dan Users terlebih dahulu.');
            return;
        }

        // Tentukan prefix invoice (INV-P + YYMM)
        $prefix = 'INV-P' . date('ym');

        // Cari nomor terakhir di database untuk prefix ini
        $latest = Purchase::withTrashed() // Gunakan withTrashed agar sequence tidak bentrok
            ->where('purchase_invoice_number', 'like', $prefix . '%')
            ->orderBy('purchase_invoice_number', 'desc')
            ->first();

        // Tentukan start number
        $currentNumber = $latest ? intval(substr($latest->purchase_invoice_number, -4)) + 1 : 1;

        $totalSeeder = 100;

        $this->command->info("Membuat {$totalSeeder} data pembelian...");

        DB::beginTransaction();
        try {
            for ($i = 0; $i < $totalSeeder; $i++) {
                // Generate nomor invoice
                $sequence = str_pad($currentNumber + $i, 4, '0', STR_PAD_LEFT);
                $invoiceNumber = $prefix . $sequence;

                // Random Data
                $supplier = $suppliers->random();
                $user = $users->random();
                
                // Random tanggal (dalam 30 hari terakhir)
                $date = Carbon::now()->subDays(rand(0, 30));
                
                // Pilih item random (1 sampai 5 jenis item per transaksi)
                $transactionItems = $items->random(rand(1, 5));
                
                $subtotal = 0;
                
                // Buat Header dulu
                $purchase = Purchase::create([
                    'purchase_invoice_number' => $invoiceNumber,
                    'supplier_id' => $supplier->supplier_id,
                    'user_id' => $user->user_id,
                    'purchase_date' => $date,
                    'purchase_subtotal' => 0,
                    'purchase_grand_total' => 0,
                    'purchase_status' => 'paid', // Status paid agar logis stok bertambah
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);

                foreach ($transactionItems as $item) {
                    // Random quantity (10 - 100)
                    $qty = rand(10, 100);
                    
                    // Harga beli simulasi: 60-80% dari harga jual item tersebut
                    $baseBuyPrice = $item->item_price * (rand(60, 80) / 100);
                    // Bulatkan harga ke ratusan terdekat agar rapi
                    $buyPrice = ceil($baseBuyPrice / 100) * 100;

                    // Random diskon (0 - 10%)
                    $discountPercent = rand(0, 1) ? rand(5, 10) : 0;
                    
                    // Hitung nominal
                    $discountAmountPerItem = $buyPrice * ($discountPercent / 100);
                    $priceAfterDiscount = $buyPrice - $discountAmountPerItem;
                    $totalItemPrice = $priceAfterDiscount * $qty;

                    $subtotal += $totalItemPrice;

                    // Buat Detail
                    PurchaseDetail::create([
                        'purchase_invoice_number' => $invoiceNumber,
                        'item_code' => $item->item_code,
                        'quantity' => $qty,
                        'buy_price' => $buyPrice,
                        'purchase_discount_item' => $discountPercent,
                        'purchase_hasil_diskon_item' => $priceAfterDiscount, // Harga net per item
                        'total_item_price' => $totalItemPrice,
                        'created_at' => $date,
                        'updated_at' => $date,
                    ]);

                    // Update Stok Item (Karena status paid)
                    $item->increment('item_stock', $qty);
                }

                // Update Total di Header
                $purchase->update([
                    'purchase_subtotal' => $subtotal,
                    'purchase_grand_total' => $subtotal,
                ]);
            }

            DB::commit();
            $this->command->info("Berhasil membuat {$totalSeeder} data pembelian.");
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("Gagal membuat seeder: " . $e->getMessage());
        }
    }
}