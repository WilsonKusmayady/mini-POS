<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Sales;
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

        if (empty($users)) {
            $this->command->warn('⚠️ Tidak ada user, SaleSeeder dilewati');
            return;
        }

        // TOTAL TRANSAKSI (6 bulan)
        $totalSales = 300;

        for ($i = 0; $i < $totalSales; $i++) {

            $subtotal = rand(50_000, 500_000);
            $discount = rand(0, 10) > 7 ? rand(5_000, 50_000) : 0;
            $grandTotal = max($subtotal - $discount, 0);

            $isMember = !empty($members) && rand(0, 1);

            // TANGGAL ACAK 0–180 HARI KE BELAKANG
            $salesDate = Carbon::now()
                ->subDays(rand(0, 180))
                ->setTime(rand(8, 21), rand(0, 59));

            Sales::create([
                'sales_invoice_code' => $codeGenerator->generateSalesInvoiceCode(),

                'user_id' => $users[array_rand($users)],

                'member_code' => $isMember
                    ? $members[array_rand($members)]
                    : null,

                'customer_name' => $isMember
                    ? null
                    : fake()->name(),

                'sales_date' => $salesDate->toDateString(),

                'sales_subtotal' => $subtotal,
                'sales_discount_value' => $discount,
                'sales_hasil_discount_value' => $discount,
                'sales_grand_total' => $grandTotal,

                'sales_payment_method' => collect(['cash', 'debit', 'qris'])->random(),

                // ±85% PAID
                'sales_status' => rand(1, 100) <= 85,

                'created_at' => $salesDate,
                'updated_at' => $salesDate,
            ]);
        }

    }
}
