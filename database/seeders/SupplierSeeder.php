<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        $suppliers = [
            [
                'supplier_name' => 'PT. Sumber Makmur Abadi',
                'supplier_email' => 'sales@sumbermakmur.co.id',
                'supplier_address' => 'Jl. Raya Darmo No. 15, Surabaya',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'supplier_name' => 'CV. Maju Jaya Sentosa',
                'supplier_email' => 'contact@majujaya.com',
                'supplier_address' => 'Kawasan Industri Rungkut Blok A-3, Surabaya',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'supplier_name' => 'UD. Berkah Grosir',
                'supplier_email' => 'berkah.grosir@gmail.com',
                'supplier_address' => 'Pasar Turi Baru Lt. 1 Blok B, Surabaya',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'supplier_name' => 'PT. Distribusi Nusantara',
                'supplier_email' => 'info@disnus.co.id',
                'supplier_address' => 'Jl. Panjang Jiwo No. 88, Surabaya',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'supplier_name' => 'Toko Elektronik Bintang',
                'supplier_email' => 'bintang_elektronik@yahoo.com',
                'supplier_address' => 'Jl. Kertajaya Indah No. 45, Surabaya',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('suppliers')->insert($suppliers);
    }
}