<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\DashboardController;

/*
|--------------------------------------------------------------------------
| GUEST ROUTES (Login)
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('/login-karyawan', [UserController::class, 'showLogin'])->name('login');
    Route::post('/login-karyawan', [UserController::class, 'login'])->name('login.process');
});

/*
|--------------------------------------------------------------------------
| AUTHENTICATED ROUTES
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {

    // --- Dashboard ---
    Route::get('/', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // --- Auth Actions ---
    Route::post('/logout', [UserController::class, 'logout'])->name('logout');

    // --- 0. User Profile ---
    Route::resource('users', UserController::class);

    // --- 1. Master Data: ITEMS (Inventory) ---
    // PENTING: Route khusus seperti 'search' harus DI ATAS 'resource'
    Route::get('/items/search', [ItemController::class, 'search'])->name('items.search');
    Route::resource('items', ItemController::class);

    // --- 2. Master Data: MEMBERS ---
    Route::prefix('members')->name('members.')->group(function () {
        Route::get('/', [MemberController::class, 'index'])->name('index');
        Route::get('/create', [MemberController::class, 'create'])->name('create');
        Route::get('/export', [MemberController::class, 'export'])->name('export');
        Route::post('/', [MemberController::class, 'store'])->name('store');
        Route::get('/{memberCode}', [MemberController::class, 'show'])->name('show');
        Route::get('/{memberCode}/edit', [MemberController::class, 'edit'])->name('edit');
        Route::put('/{memberCode}', [MemberController::class, 'apiUpdate'])->name('update');
        // Route::put('/{memberCode}', [MemberController::class, 'update'])->name('update');
        // Route::get('/search', [MemberController::class, 'search']);
    });

    // --- 3. Transaksi: PURCHASES (Pembelian) ---
    Route::prefix('purchases')->name('purchases.')->group(function () {
        Route::get('/', [PurchaseController::class, 'index'])->name('index');
        Route::get('/create', [PurchaseController::class, 'create'])->name('create');
        Route::post('/', [PurchaseController::class, 'store'])->name('store');
        Route::get('/{id}', [PurchaseController::class, 'show'])->name('show');
    });

    // --- 4. Transaksi: SALES (Penjualan) ---
    Route::prefix('sales')->name('sales.')->group(function () {
        Route::get('/', [SalesController::class, 'index'])->name('index');
        Route::post('/', [SalesController::class, 'store'])->name('store');
        Route::get('/create', function () {
            return Inertia::render('sales/create');
        })->name('create');
        Route::get('/{invoiceCode}/nota', [SalesController::class, 'showNota'])->name('sales.nota');
        Route::get('/export', [SalesController::class, 'export'])->name('export');    
    });

    // --- INTERNAL API ROUTES (AJAX Helper) ---
    Route::prefix('api')->group(function () {
        // Dashboard API
        Route::get('/dashboard/stats', [DashboardController::class, 'getStats'])->name('dashboard.api.stats');
        Route::get('/dashboard/sales-chart', [DashboardController::class, 'getSalesChartData'])->name('dashboard.api.sales-chart');
        Route::get('/dashboard/activities', [DashboardController::class, 'getActivities'])->name('dashboard.api.activities');
        Route::get('/dashboard/additional-data', [DashboardController::class, 'getAdditionalData'])->name('dashboard.api.additional-data');
        
        // Members API
        Route::get('/members', [MemberController::class, 'apiIndex'])->name('members.api.index');
        Route::delete('/members/{memberCode}', [MemberController::class, 'destroy'])->name('members.api.destroy');
        Route::get('/members/statistics', [MemberController::class, 'getStatistics'])->name('members.api.statistics');
        Route::get('/members/search', [MemberController::class, 'search'])->name('members.api.search');
        Route::get('/members/export', [MemberController::class, 'apiExport'])->name('members.api.export');
        // Sales API
        Route::get('/sales', [SalesController::class, 'apiIndex'])->name('sales.api.index');
        Route::delete('/sales/{invoiceCode}', [SalesController::class, 'destroy'])->name('sales.api.destroy');
        Route::post('/sales/{invoiceCode}/cancel', [SalesController::class, 'cancel'])->name('sales.api.cancel');    
        Route::get('/sales/export', [SalesController::class, 'apiExport'])->name('sales.api.export');
    });

});