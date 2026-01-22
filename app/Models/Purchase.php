<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Purchase extends Model
{
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'purchase_invoice_number';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'purchase_date' => 'date',
        'purchase_subtotal' => 'decimal:2',
        'purchase_grand_total' => 'decimal:2',
        'purchase_status' => 'string',
    ];

    public function details()
    {
        return $this->hasMany(PurchaseDetail::class, 'purchase_invoice_number', 'purchase_invoice_number');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'supplier_id');
    }
}