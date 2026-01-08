<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    //
    protected $primaryKey = 'supplier_id';
    public $incrementing = false;
    protected $keyType = 'integer';

    protected $guarded = [];
}
