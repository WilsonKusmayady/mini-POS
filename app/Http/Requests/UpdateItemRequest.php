<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule; 

class UpdateItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $itemCode = $this->route('item');

        return [
            //
            'item_name' => ['required', 'string', 'max:255', 
            Rule::unique('items', 'item_name')->ignore($itemCode, 'itemCode')],

            'item_price' => 'required|numeric|min:0',
            'item_stock' => 'required|integer|min:0',
            'item_min_stock' => 'required|integer|min:0',
            'item_description' => 'nullable|string|max:255'
        ];
    }
}
