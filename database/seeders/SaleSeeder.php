<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Sales;
use App\Models\SalesDetail;
use App\Models\Item;
use App\Models\User;
use App\Models\Member;
use App\Services\CodeGeneratorService;
use Carbon\Carbon;

class SaleSeeder extends Seeder
{
    public function run(): void
    {
        $codeGenerator = app(CodeGeneratorService::class);

        $users = User::pluck('user_id')->toArray();
        $members = Member::pluck('member_code')->toArray();
        $items = Item::all();

        if (empty($users)) {
            $this->command->warn('⚠️ Tidak ada user, SaleSeeder dilewati');
            return;
        }

        if ($items->isEmpty()) {
            $this->command->warn('⚠️ Tidak ada item, harap run ItemSeeder terlebih dahulu');
            return;
        }

        // TOTAL TRANSAKSI (6 bulan)
        $totalSales = 300;
        
        // Array untuk menyimpan stock updates
        $stockUpdates = [];

        for ($i = 0; $i < $totalSales; $i++) {
            // TANGGAL ACAK 0–180 HARI KE BELAKANG
            $salesDate = Carbon::now()
                ->subDays(rand(0, 180))
                ->setTime(rand(8, 21), rand(0, 59));

            // Tentukan jumlah item dalam transaksi ini (1-5 item)
            $numItems = rand(1, 5);
            
            $subtotal = 0;
            $totalDiscount = 0;
            $salesDetails = [];

            // Pilih item random untuk transaksi ini
            $selectedItems = $items->random(min($numItems, $items->count()));

            foreach ($selectedItems as $item) {
                // Quantity acak (1-10)
                $quantity = rand(1, 10);
                
                // Harga jual bisa sedikit berbeda dari harga dasar
                $sellPrice = $item->item_price * (rand(95, 105) / 100);
                $sellPrice = round($sellPrice, -3); // Bulatkan ke ribuan
                
                // Diskon item (10% chance untuk diskon 5-20%)
                $itemDiscount = 0;
                $itemDiscountPercent = 0;
                if (rand(0, 10) > 9) {
                    $itemDiscountPercent = rand(5, 20);
                    $itemDiscount = ($sellPrice * $itemDiscountPercent / 100) * $quantity;
                }
                
                $itemTotal = ($sellPrice * $quantity) - $itemDiscount;
                
                $subtotal += $itemTotal;
                $totalDiscount += $itemDiscount;

                // Simpan detail untuk dibuat nanti
                $salesDetails[] = [
                    'item_code' => $item->item_code,
                    'sales_quantity' => $quantity,
                    'sell_price' => $sellPrice,
                    'sales_discount_item' => $itemDiscount,
                    'sales_hasil_diskon_item' => $itemDiscountPercent,
                    'total_item_price' => $itemTotal,
                ];

                // Update stock tracking
                if (!isset($stockUpdates[$item->item_code])) {
                    $stockUpdates[$item->item_code] = 0;
                }
                $stockUpdates[$item->item_code] += $quantity;
            }

            // Diskon tambahan untuk transaksi (10% chance)
            $additionalDiscount = 0;
            if (rand(0, 10) > 9) {
                $additionalDiscount = rand(5_000, 50_000);
            }

            $totalDiscount += $additionalDiscount;
            $grandTotal = max($subtotal - $additionalDiscount, 0);

            $isMember = !empty($members) && rand(0, 1);

            // Buat transaksi sales
            $salesInvoiceCode = $codeGenerator->generateSalesInvoiceCode();
            
            $sales = Sales::create([
                'sales_invoice_code' => $salesInvoiceCode,
                'user_id' => $users[array_rand($users)],
                'member_code' => $isMember ? $members[array_rand($members)] : null,
                'customer_name' => $isMember ? null : fake()->name(),
                'sales_date' => $salesDate->toDateString(),
                'sales_subtotal' => $subtotal,
                'sales_discount_value' => $totalDiscount,
                'sales_hasil_discount_value' => $additionalDiscount > 0 ? $additionalDiscount : 0,
                'sales_grand_total' => $grandTotal,
                'sales_payment_method' => collect(['cash', 'debit', 'qris'])->random(),
                'sales_status' => rand(1, 100) <= 85,
                'created_at' => $salesDate,
                'updated_at' => $salesDate,
            ]);

            // Buat sales details untuk setiap item
            foreach ($salesDetails as $detail) {
                SalesDetail::create([
                    'sales_invoice_code' => $salesInvoiceCode,
                    'item_code' => $detail['item_code'],
                    'sales_quantity' => $detail['sales_quantity'],
                    'sell_price' => $detail['sell_price'],
                    'sales_discount_item' => $detail['sales_discount_item'],
                    'sales_hasil_diskon_item' => $detail['sales_hasil_diskon_item'],
                    'total_item_price' => $detail['total_item_price'],
                    'created_at' => $salesDate,
                    'updated_at' => $salesDate,
                ]);
            }

            // Progress bar
            if ($i % 50 === 0) {
                $this->command->info("Created {$i}/{$totalSales} sales transactions...");
            }
        }

        // Update stock items setelah semua transaksi dibuat
        foreach ($stockUpdates as $itemCode => $quantitySold) {
            $item = Item::find($itemCode);
            if ($item) {
                $newStock = max($item->item_stock - $quantitySold, 0);
                $item->update(['item_stock' => $newStock]);
            }
        }
        
        // Tampilkan top 5 items terlaris
        // arsort($stockUpdates);
        // $topItems = array_slice($stockUpdates, 0, 5, true);
        
        // $counter = 1;
        // foreach ($topItems as $itemCode => $quantity) {
        //     $item = Item::find($itemCode);
        //     $itemName = $item ? $item->item_name : "Item {$itemCode}";
        //     $this->command->info("     {$counter}. {$itemName}: {$quantity} units");
        //     $counter++;
        // }
    }
}