<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\ItemController;      // Controller untuk Inventory
use App\Http\Controllers\PurchaseController;  // Controller untuk Purchase


// Route::get('/', function () {
//     return Inertia::render('dashboard');
// })->name('dashboard');

// Route::get('/login-karyawan', function () {
//     return Inertia::render('auth/login'); 
// })->name('login.temp');
Route::middleware('guest')->group(function () {
    Route::get('/login-karyawan', [UserController::class, 'showLogin'])
        ->name('login');

    Route::post('/login-karyawan', [UserController::class, 'login'])
        ->name('login.process');
});

Route::middleware('auth')->group(function () {

    Route::get('/', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('/sales', [SalesController::class, 'index'])
        ->name('sales.index');

    Route::post('/logout', [UserController::class, 'logout'])
        ->name('logout');
    Route::resource('items', ItemController::class);
    Route::get('/purchase/create', [PurchaseController::class, 'create'])->name('purchase.create');
    Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchases.store');
});
// Route::middleware(['auth', 'verified'])->group(function () {
//     Route::get('dashboard', function () {
//         return Inertia::render('dashboard');
//     })->name('dashboard');
// });