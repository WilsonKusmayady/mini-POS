<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_name' => 'required|string|max:255',
            'password' => 'required|string|min:8|confirmed', // Wajib ada password confirmation
            'user_role' => 'required|boolean', // 1 = Admin, 0 = Cashier (sesuai Model User Anda)
        ];
    }
}