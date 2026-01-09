<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('dashboard');
})->name('dashboard');

Route::get('/login-karyawan', function () {
    return Inertia::render('auth/login'); 
})->name('login.temp');
// Route::middleware(['auth', 'verified'])->group(function () {
//     Route::get('dashboard', function () {
//         return Inertia::render('dashboard');
//     })->name('dashboard');
// });

// Route::get('/test-shadcn', function () {
//     return Inertia::render('TestShadcn');
// });

// require __DIR__.'/settings.php';
