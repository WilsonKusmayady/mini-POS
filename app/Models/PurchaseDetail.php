<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseDetail extends Model
{
    use HasFactory;

    protected $primaryKey = 'purchase_invoice_number';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'quantity' => 'integer',
        'buy_price' => 'decimal:2',
        'purchase_discount_item' => 'decimal:2',
        'purchase_hasil_diskon_item' => 'decimal:2',
        'total_item_price' => 'decimal:2',
    ];

    public function purchase()
    {
        return $this->belongsTo(Purchase::class, 'purchase_invoice_number', 'purchase_invoice_number');
    }

    public function item()
    {
        return $this->belongsTo(Item::class, 'item_code', 'item_code');
    }
}
