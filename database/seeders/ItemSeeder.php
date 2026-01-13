<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Item;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema; 

class ItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        Item::truncate();
        Schema::enableForeignKeyConstraints();
        // Daftar 160+ Barang ATK Realistis (Nama & Harga Jual)
        $atkItems = [
            // --- Kategori: Buku & Kertas ---
            ['name' => 'Buku Tulis Sinar Dunia 38 Lembar', 'price' => 3500],
            ['name' => 'Buku Tulis Sinar Dunia 58 Lembar', 'price' => 5000],
            ['name' => 'Buku Tulis Sinar Dunia 100 Lembar', 'price' => 9000],
            ['name' => 'Buku Tulis Kiky 38 Lembar (Campus)', 'price' => 4500],
            ['name' => 'Buku Tulis Kiky 58 Lembar (Campus)', 'price' => 6000],
            ['name' => 'Buku Gambar A4 Sinar Dunia', 'price' => 4000],
            ['name' => 'Buku Gambar A3 Sinar Dunia', 'price' => 7500],
            ['name' => 'Buku Hardcover Folio 100 Lembar', 'price' => 18000],
            ['name' => 'Buku Hardcover Folio 200 Lembar', 'price' => 32000],
            ['name' => 'Buku Hardcover Batik 100 Lembar', 'price' => 16000],
            ['name' => 'Buku Ekspedisi Panjang 100 Lembar', 'price' => 12000],
            ['name' => 'Buku Kwitansi Kecil', 'price' => 3000],
            ['name' => 'Buku Kwitansi Sedang', 'price' => 4500],
            ['name' => 'Buku Kwitansi Besar', 'price' => 6000],
            ['name' => 'Nota Kontan 1 Ply Kecil', 'price' => 2500],
            ['name' => 'Nota Kontan 2 Ply (NCR) Kecil', 'price' => 4000],
            ['name' => 'Nota Kontan 2 Ply (NCR) Besar', 'price' => 7000],
            ['name' => 'Surat Jalan 3 Ply (NCR)', 'price' => 12000],
            ['name' => 'Kertas HVS A4 70gr Sinar Dunia (1 Rim)', 'price' => 48000],
            ['name' => 'Kertas HVS A4 80gr Sinar Dunia (1 Rim)', 'price' => 55000],
            ['name' => 'Kertas HVS F4 70gr Sinar Dunia (1 Rim)', 'price' => 52000],
            ['name' => 'Kertas HVS F4 80gr Sinar Dunia (1 Rim)', 'price' => 58000],
            ['name' => 'Kertas A4 Sinar Dunia Warna (Mix)', 'price' => 60000],
            ['name' => 'Kertas Folio Bergaris (1 Pack/100 lbr)', 'price' => 18000],
            ['name' => 'Amplop Putih 90 Polos (1 Box)', 'price' => 18000],
            ['name' => 'Amplop Putih 104 Jendela (1 Box)', 'price' => 22000],
            ['name' => 'Amplop Coklat Kabinet (1 Pack/100)', 'price' => 25000],
            ['name' => 'Amplop Coklat Folio (1 Pack/100)', 'price' => 35000],
            ['name' => 'Amplop Coklat A3 (Per Lembar)', 'price' => 2000],
            
            // --- Kategori: Alat Tulis (Pulpen & Pensil) ---
            ['name' => 'Pulpen Standard AE7 Hitam', 'price' => 2500],
            ['name' => 'Pulpen Standard AE7 Biru', 'price' => 2500],
            ['name' => 'Pulpen Standard AE7 Merah', 'price' => 2500],
            ['name' => 'Pulpen Pilot Ballliner Hitam', 'price' => 14000],
            ['name' => 'Pulpen Pilot G-2 0.5 Hitam', 'price' => 18000],
            ['name' => 'Pulpen Pilot G-2 0.5 Biru', 'price' => 18000],
            ['name' => 'Pulpen Snowman V-1 Hitam', 'price' => 3000],
            ['name' => 'Pulpen Zebra Sarasa 0.5 Hitam', 'price' => 11000],
            ['name' => 'Pulpen Kenko Gel K-1', 'price' => 4000],
            ['name' => 'Pensil 2B Faber Castell (Hijau)', 'price' => 4500],
            ['name' => 'Pensil 2B Staedtler (Biru)', 'price' => 5000],
            ['name' => 'Pensil 2B Joyko', 'price' => 2500],
            ['name' => 'Pensil Mekanik Pilot 0.5', 'price' => 7000],
            ['name' => 'Pensil Mekanik Kenko 0.5', 'price' => 5000],
            ['name' => 'Isi Pensil Mekanik 0.5 2B (Tube)', 'price' => 3000],
            ['name' => 'Rautan Pensil Joyko Kecil', 'price' => 1500],
            ['name' => 'Rautan Pensil Meja (Putar)', 'price' => 35000],
            ['name' => 'Penghapus Joyko Hitam Kecil', 'price' => 1500],
            ['name' => 'Penghapus Faber Castell Putih', 'price' => 3000],
            ['name' => 'Correction Tape Joyko (Kertas)', 'price' => 8000],
            ['name' => 'Correction Tape Kenko (Kertas)', 'price' => 7500],
            ['name' => 'Correction Fluid / Tipe-X Cair Kenko', 'price' => 5000],
            
            // --- Kategori: Spidol & Pewarna ---
            ['name' => 'Spidol Boardmarker Snowman Hitam', 'price' => 8500],
            ['name' => 'Spidol Boardmarker Snowman Biru', 'price' => 8500],
            ['name' => 'Spidol Boardmarker Snowman Merah', 'price' => 8500],
            ['name' => 'Isi Ulang Tinta Boardmarker Hitam', 'price' => 15000],
            ['name' => 'Spidol Permanent Snowman Hitam', 'price' => 8000],
            ['name' => 'Spidol Permanent Snowman Biru', 'price' => 8000],
            ['name' => 'Spidol Kecil Snowman (1 Lusin/Warna-warni)', 'price' => 15000],
            ['name' => 'Spidol Paint Marker Emas (Gold)', 'price' => 22000],
            ['name' => 'Spidol Paint Marker Perak (Silver)', 'price' => 22000],
            ['name' => 'Stabilo Boss Kuning', 'price' => 12000],
            ['name' => 'Stabilo Boss Hijau', 'price' => 12000],
            ['name' => 'Stabilo Boss Pink', 'price' => 12000],
            ['name' => 'Stabilo Boss Orange', 'price' => 12000],
            ['name' => 'Pensil Warna Faber Castell 12 Warna', 'price' => 25000],
            ['name' => 'Pensil Warna Faber Castell 24 Warna', 'price' => 55000],
            ['name' => 'Crayon Titi 12 Warna', 'price' => 18000],
            ['name' => 'Crayon Titi 24 Warna', 'price' => 35000],
            
            // --- Kategori: Map & Filing ---
            ['name' => 'Map Kertas Batik (1 Pack/50)', 'price' => 45000],
            ['name' => 'Map Biola / Buffalo (Per Pcs)', 'price' => 2500],
            ['name' => 'Map Snelhecter Plastik Business File', 'price' => 3500],
            ['name' => 'Map L / Clear Sleeve A4', 'price' => 1500],
            ['name' => 'Map Kancing 1 Plastik (Clear)', 'price' => 4000],
            ['name' => 'Map Zipper Bag Jaring A4', 'price' => 6000],
            ['name' => 'Ordner Bantex Folio 7cm (Biru)', 'price' => 38000],
            ['name' => 'Ordner Bantex Folio 7cm (Hitam)', 'price' => 38000],
            ['name' => 'Ordner Bantex Folio 5cm (Tipis)', 'price' => 35000],
            ['name' => 'Box File Plastik (Magazine File)', 'price' => 25000],
            ['name' => 'Clear Holder 20 Lembar A4', 'price' => 18000],
            ['name' => 'Clear Holder 40 Lembar A4', 'price' => 28000],
            ['name' => 'Clear Holder 60 Lembar A4', 'price' => 38000],
            ['name' => 'Binder Note A5 Joyko', 'price' => 22000],
            ['name' => 'Binder Note B5 Joyko', 'price' => 28000],
            ['name' => 'Isi Binder A5 (50 Lembar)', 'price' => 6000],
            ['name' => 'Isi Binder B5 (50 Lembar)', 'price' => 8000],
            
            // --- Kategori: Perekat & Lakban ---
            ['name' => 'Lem Glukol Sedang', 'price' => 4000],
            ['name' => 'Lem Glukol Besar', 'price' => 7000],
            ['name' => 'Lem Stick Kenko 8gr', 'price' => 4000],
            ['name' => 'Lem Stick Kenko 25gr', 'price' => 9000],
            ['name' => 'Lem Cair Povinal Kecil', 'price' => 3000],
            ['name' => 'Lem Fox Putih PVAc 150gr', 'price' => 12000],
            ['name' => 'Lem Alteco / Power Glue', 'price' => 8000],
            ['name' => 'Lem UHU Cair 35ml', 'price' => 15000],
            ['name' => 'Double Tape 1 Inch (24mm)', 'price' => 6500],
            ['name' => 'Double Tape 1/2 Inch (12mm)', 'price' => 4000],
            ['name' => 'Double Tape Foam Hijau (3M)', 'price' => 15000],
            ['name' => 'Lakban Bening 2 Inch (48mm)', 'price' => 11000],
            ['name' => 'Lakban Coklat 2 Inch (48mm)', 'price' => 11000],
            ['name' => 'Lakban Hitam Kain (Cloth Tape)', 'price' => 16000],
            ['name' => 'Lakban Kertas (Masking Tape) 1 Inch', 'price' => 7000],
            ['name' => 'Lakban Kertas (Masking Tape) 2 Inch', 'price' => 13000],
            ['name' => 'Dispenser Lakban Besi', 'price' => 25000],
            
            // --- Kategori: Alat Potong (Cutting) ---
            ['name' => 'Gunting Joyko Kecil (SC-828)', 'price' => 6000],
            ['name' => 'Gunting Joyko Sedang (SC-838)', 'price' => 9000],
            ['name' => 'Gunting Joyko Besar (SC-848)', 'price' => 14000],
            ['name' => 'Cutter Kenko L-500 (Besar)', 'price' => 15000],
            ['name' => 'Cutter Kenko A-300 (Kecil)', 'price' => 6000],
            ['name' => 'Isi Cutter Besar L-150 (Tube)', 'price' => 7000],
            ['name' => 'Isi Cutter Kecil A-100 (Tube)', 'price' => 4000],
            ['name' => 'Cutting Mat A3 (Alas Potong)', 'price' => 45000],
            
            // --- Kategori: Stapler & Klip ---
            ['name' => 'Stapler HD-10 (Kecil) Joyko', 'price' => 12000],
            ['name' => 'Stapler HD-50 (Sedang) Joyko', 'price' => 45000],
            ['name' => 'Isi Staples No. 10 (Kecil)', 'price' => 2500],
            ['name' => 'Isi Staples No. 3 (Untuk HD-50)', 'price' => 4500],
            ['name' => 'Stapler Tembak / Gun Tacker', 'price' => 85000],
            ['name' => 'Paper Clip No. 3 (Kecil/Box)', 'price' => 3000],
            ['name' => 'Paper Clip No. 5 (Besar/Box)', 'price' => 5000],
            ['name' => 'Binder Clip No. 105 (Kecil)', 'price' => 3000],
            ['name' => 'Binder Clip No. 107', 'price' => 4000],
            ['name' => 'Binder Clip No. 111', 'price' => 5500],
            ['name' => 'Binder Clip No. 155', 'price' => 8000],
            ['name' => 'Binder Clip No. 200', 'price' => 11000],
            ['name' => 'Binder Clip No. 260 (Jumbo)', 'price' => 16000],
            ['name' => 'Pembolong Kertas (Perforator) Kecil', 'price' => 12000],
            ['name' => 'Pembolong Kertas (Perforator) Besar', 'price' => 25000],
            
            // --- Kategori: Perlengkapan Meja & Lainnya ---
            ['name' => 'Penggaris Besi 30cm', 'price' => 6000],
            ['name' => 'Penggaris Plastik 30cm Butterfly', 'price' => 3000],
            ['name' => 'Penggaris Besi 60cm', 'price' => 15000],
            ['name' => 'Busur Derajat Butterfly', 'price' => 2000],
            ['name' => 'Jangka Sekolah Joyko', 'price' => 12000],
            ['name' => 'Bak Stempel (Stamp Pad) No. 1 Ungu', 'price' => 15000],
            ['name' => 'Bak Stempel (Stamp Pad) No. 1 Hitam', 'price' => 15000],
            ['name' => 'Tinta Stempel (Ungu) 50cc', 'price' => 8000],
            ['name' => 'Tinta Stempel (Hitam) 50cc', 'price' => 8000],
            ['name' => 'Kalkulator Citizen 12 Digit (Besar)', 'price' => 95000],
            ['name' => 'Kalkulator Casio Scientific FX-991', 'price' => 220000],
            ['name' => 'ID Card Holder Plastik (Tali)', 'price' => 3500],
            ['name' => 'Lanyard / Tali ID Card Polos', 'price' => 4000],
            ['name' => 'Paku Payung (Box)', 'price' => 3000],
            ['name' => 'Push Pin (Box/Warna-warni)', 'price' => 5000],
            ['name' => 'Sticky Notes 3x3 (Post-it) Kuning', 'price' => 6000],
            ['name' => 'Sticky Notes 3x3 (Post-it) 5 Warna', 'price' => 12000],
            ['name' => 'Pembatas Buku (Page Marker) Plastik', 'price' => 8000],
            ['name' => 'Karet Gelang (500gr)', 'price' => 35000],
            ['name' => 'Baterai AA Alkaline (Isi 2)', 'price' => 12000],
            ['name' => 'Baterai AAA Alkaline (Isi 2)', 'price' => 12000],
        ];

        foreach ($atkItems as $index => $data) {
            // Simulasi Logic CodeGeneratorService
            // Kita mulai dari 1 karena ini seeding awal
            $number = $index + 1;
            $code = 'ITM' . str_pad($number, 5, '0', STR_PAD_LEFT);

            Item::create([
                'item_code'        => $code,
                'item_name'        => $data['name'],
                'item_description' => 'Stok awal untuk barang ' . $data['name'],
                'item_price'       => $data['price'],
                'item_stock'       => rand(10, 100), // Stok acak antara 10 - 100
                'item_min_stock'   => 5,             // Minimal stok 5
            ]);
        }
    }
}
