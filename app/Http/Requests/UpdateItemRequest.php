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
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $item = $this->route('item');
        // $itemCode = $this->route('item');
        $itemCode = is_object($item) ? $item->item_code : $item;

        return [
            //
            'item_name' => ['required', 'string', 'max:255', 
            Rule::unique('items', 'item_name')->ignore($itemCode, 'item_code')],

            'item_price' => 'required|numeric|min:0',
            'item_stock' => 'required|integer|min:0',
            'item_min_stock' => 'required|integer|min:0',
            'item_description' => 'nullable|string|max:255'
        ];
    }
}
