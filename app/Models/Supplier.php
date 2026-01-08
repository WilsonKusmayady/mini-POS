<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    //
    protected $primaryKey = 'supplier_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $guarded = [];

    public function purchase()
    {
        return $this->hasMany(Purchase::class, 'supplier_id', 'supplier_id');
    }
}
