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
            'user_name' => 'required|string|max:255',
            // Password boleh kosong saat edit (artinya tidak ganti password)
            'password' => 'nullable|string|min:8|confirmed',
            'user_role' => 'required|boolean',
        ];
    }
}