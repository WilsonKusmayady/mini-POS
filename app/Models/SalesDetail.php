<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sales_Detail extends Model
{
    protected $primaryKey = 'sales_detail_id';
    public $incrementing = false;
    protected $keyType = 'int';

    protected $guarded = [];

    protected $casts = [
        'sales_quantity' => 'integer',
        'sell_price' => 'decimal:2',
        'sales_discount_item' => 'decimal:2',
        'sales_hasil_diskon_item' => 'decimal:2',
        'total_item_price' => 'decimal:2'
    ];

    public function sales()
    {
        return $this->belongTo(Sales::class, 'sales_invoice_code', 'sales_invoice_code');
    }

    public function item()
    {
        return $this->belongsTo(Item::class, 'item_code', 'item_code');
    }
}
