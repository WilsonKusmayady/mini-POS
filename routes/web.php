<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\UserController;


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

    Route::post('/logout', [UserController::class, 'logout'])
        ->name('logout');
});
// Route::middleware(['auth', 'verified'])->group(function () {
//     Route::get('dashboard', function () {
//         return Inertia::render('dashboard');
//     })->name('dashboard');
// });

// Route::get('/test-shadcn', function () {
//     return Inertia::render('TestShadcn');
// });

// require __DIR__.'/settings.php';
