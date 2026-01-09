<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\PurchaseController; // [Baru] Import Controller

// [Ubah] Route utama '/' sekarang menggunakan Controller Purchase
Route::get('/', [PurchaseController::class, 'create'])->name('dashboard');

// [Baru] Route untuk menyimpan transaksi (POST)
Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchases.store');


// --- Route Lainnya (Biarkan tetap ada) ---

Route::get('/login-karyawan', function () {
    return Inertia::render('auth/login'); 
})->name('login.temp');

// Route::middleware(['auth', 'verified'])->group(function () {
//     ...
// });