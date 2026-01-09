<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Ambil ID user dari parameter route
        // Asumsi route-nya: /users/{user}
        $userId = $this->route('user'); 

        return [
            'name' => 'required|string|max:255',
            // Cek unik email, KECUALI milik user ini sendiri
            'email' => [
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($userId, 'user_id') 
            ],
            // Password boleh kosong saat edit (artinya tidak ganti password)
            'password' => 'nullable|string|min:8|confirmed',
            'user_role' => 'required|boolean',
        ];
    }
}