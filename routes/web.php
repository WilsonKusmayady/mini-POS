<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth; // Jangan lupa import Auth
use Inertia\Inertia;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\ItemController;
use App\Models\User; // Import Model User

// [LOGIKA AUTO-LOGIN]
Route::get('/', function () {
    // 1. Cek apakah sudah login?
    if (!Auth::check()) {
        // 2. Jika belum, cari user 'admin_pos' di database
        // Sesuaikan field pencarian ini dengan kolom di tabel users Anda (misal: 'name', 'username', atau 'email')
        $user = User::where('user_name', 'admin_pos')
                    ->first();

        // 3. Jika user ditemukan, login-kan secara paksa
        if ($user) {
            Auth::login($user);
            // Opsional: Regenerate session ID untuk keamanan (praktik baik meski di local)
            request()->session()->regenerate();
        } else {
            // Jika user admin_pos tidak ada di DB, lempar ke login biasa
            return redirect()->route('login');
        }
    }

    // 4. Setelah login sukses, tampilkan Dashboard
    return Inertia::render('dashboard');
})->name('dashboard'); 
// Perhatikan: Kita TIDAK menaruh ->middleware(['auth']) di sini agar logika di atas bisa jalan.


// --- Route Lainnya (Tetap gunakan middleware auth agar aman) ---
// Karena di '/' kita sudah Auth::login, maka route di bawah ini akan otomatis bisa diakses.

Route::middleware(['auth', 'verified'])->group(function () {
    // Inventory
    Route::resource('items', ItemController::class);

    // Purchase
    Route::get('/purchase/create', [PurchaseController::class, 'create'])->name('purchase.create');
    Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchases.store');
});

// Route Login (Tetap ada buat jaga-jaga)
Route::get('/login-karyawan', function () {
    return Inertia::render('auth/login'); 
})->name('login.temp');