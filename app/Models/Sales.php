<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    protected $primaryKey = 'sales_invoice_code';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'sales_date' => 'date',
        'sales_subtotal' => 'decimal:2',
        'sales_discount_value' => 'decimal:2',
        'sales_hasil_discount_value' => 'decimal:2',
        'sales_grand_total' => 'decimal:2',
        'sales_payment_method' => 'string',
        'sales_status' => 'boolean',
    ];

    public function sales_details()
    {
        return $this->hasMany(SalesDetail::class, 'sales_invoice_code', 'sales_invoice_code');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function member()
    {
        // Karena PK member adalah member_code (string)
        return $this->belongsTo(Member::class, 'member_code', 'member_code');
    }
}