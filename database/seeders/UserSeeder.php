<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'user_name' => 'admin_pos',
            'password' => Hash::make('password123'), 
            'user_role' => 1, 
        ]);

        User::create([
            'user_name' => 'staff_kasir',
            'password' => Hash::make('password123'),
            'user_role' => 0,
        ]);
        
    }
}