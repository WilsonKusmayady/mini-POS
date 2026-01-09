<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            //
            'item_name' => 'required|string|max:255',
            'item_price' => 'required|numeric|min:0',
            // 'item_stock' => 'required|integer|min:0',
            'item_min_stock' => 'required|integer|min:0',
            'item_description' => 'nullable|string|max:255'
        ];
    }

    public function alert(): array {
        return [
            'item_name.required' => 'Nama barang harus diisi',
            'item_price.min' => 'Harga barang tidak boleh minus',
            'item_stock.integer' => 'Stok barang harus diisi dengan angka'
        ];
    }
}
