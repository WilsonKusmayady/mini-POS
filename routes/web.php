<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;      // Controller untuk Login/Logout
use App\Http\Controllers\PurchaseController;  // Controller untuk Purchase
use App\Http\Controllers\ItemController;      // Controller untuk Inventory

/*
|--------------------------------------------------------------------------
| GUEST ROUTES (Hanya bisa diakses jika BELUM login)
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    // Menampilkan halaman login
    Route::get('/login-karyawan', [UserController::class, 'showLogin'])
        ->name('login');

    // Proses submit login
    Route::post('/login-karyawan', [UserController::class, 'login'])
        ->name('login.process');
});

/*
|--------------------------------------------------------------------------
| AUTHENTICATED ROUTES (Hanya bisa diakses jika SUDAH login)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {

    // 1. Dashboard (Halaman Utama)
    Route::get('/', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // 2. Logout
    Route::post('/logout', [UserController::class, 'logout'])
        ->name('logout');

    // 3. Inventory (Items) - Resource Route (CRUD Lengkap)
    Route::resource('items', ItemController::class);

    // 4. Purchase (Transaksi Pembelian)
    Route::get('/purchase/create', [PurchaseController::class, 'create'])->name('purchase.create');
    Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchases.store');

});