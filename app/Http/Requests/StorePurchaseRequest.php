<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_id' => 'required|exists:suppliers,supplier_id',
            'purchase_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.item_code' => 'required|exists:items,item_code',
            'items.*.buy_price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|integer|min:1',
            // [Baru] Validasi diskon
            'items.*.discount_item' => 'nullable|numeric|min:0', 
        ];
    }

    public function alert(): array
    {
        return [
            'supplier_id.required' => 'Supplier wajib dipilih',
            'items.required' => 'Daftar barang tidak boleh kosong',
            'items.*.buy_price.min' => 'Harga beli tidak boleh negatif',
            'items.*.quantity.min' => 'Jumlah barang minimal 1',
            'items.*.discount_item.min' => 'Diskon tidak boleh negatif',
        ];
    }
}