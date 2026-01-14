<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;      
use App\Http\Controllers\PurchaseController; 
use App\Http\Controllers\ItemController;     

/*
|--------------------------------------------------------------------------
| GUEST ROUTES 
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
| AUTHENTICATED ROUTES
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

    // --- ROUTE API SEARCH ---
    Route::get('/items/search', [ItemController::class, 'search'])
        ->name('items.search');

    // 3. Inventory (Items) - Resource Route (CRUD Lengkap)
    Route::resource('items', ItemController::class);

    // 4. Purchase (Transaksi Pembelian)
    Route::get('/purchases', [PurchaseController::class, 'index'])->name('purchases.index');
    Route::get('/purchases/create', [PurchaseController::class, 'create'])->name('purchases.create');
    Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchases.store');
    Route::get('/purchases/{id}', [PurchaseController::class, 'show'])->name('purchases.show');
});