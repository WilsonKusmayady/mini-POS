<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\ItemController;      
use App\Http\Controllers\PurchaseController;  
use App\Http\Controllers\MemberController; 


// Route::get('/', function () {
//     return Inertia::render('dashboard');
// })->name('dashboard');

// Route::get('/login-karyawan', function () {
//     return Inertia::render('auth/login'); 
// })->name('login.temp');

/*
|--------------------------------------------------------------------------
| GUEST ROUTES 
|--------------------------------------------------------------------------
*/
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
    Route::get('/sales/create', function () {
        return Inertia::render('sales/create');
    })->name('sales.create');

    Route::post('/logout', [UserController::class, 'logout'])
        ->name('logout');
    Route::resource('items', ItemController::class);
    Route::get('/purchase/create', [PurchaseController::class, 'create'])->name('purchase.create');
    Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchases.store');

    Route::get('/members', [MemberController::class, 'index'])->name('members.index');
    Route::get('/members/create', [MemberController::class, 'create'])->name('members.create');
    Route::post('/members', [MemberController::class, 'store'])->name('members.store');
    Route::get('/members/{memberCode}', [MemberController::class, 'show'])->name('members.show');
    Route::get('/members/{memberCode}/edit', [MemberController::class, 'edit'])->name('members.edit');
    Route::put('/members/{memberCode}', [MemberController::class, 'update'])->name('members.update');
    
    // API routes for AJAX - harus didefinisikan terpisah
    Route::prefix('api')->group(function () {
        Route::get('/members', [MemberController::class, 'apiIndex'])->name('members.api.index');
        Route::delete('/members/{memberCode}', [MemberController::class, 'destroy'])->name('members.api.destroy');
        Route::get('/members/statistics', [MemberController::class, 'getStatistics'])->name('members.api.statistics');    
        Route::get('/sales', [SalesController::class, 'apiIndex'])->name('sales.api.index');
    });

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
// Route::middleware(['auth', 'verified'])->group(function () {
//     Route::get('dashboard', function () {
//         return Inertia::render('dashboard');
//     })->name('dashboard');
// });

    // --- ROUTE API SEARCH ---


