<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model
{
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'item_code';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $guarded = [];

    

    protected $casts = [
        'item_price' => 'decimal:2',
        'item_stock' => 'integer',
        'item_min_stock' => 'integer',
    ];

    public function purchase_details()
    {
        return $this->hasMany(PurchaseDetail::class, 'item_code', 'item_code');
    }

    public function sales_details()
    {
        return $this->hasMany(SalesDetail::class, 'item_code', 'item_code');
    }
}