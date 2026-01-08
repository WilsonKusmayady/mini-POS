<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    //
    protected $primaryKey = 'member_code';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $guarded = [];

    public function sales() {
        return $this->hasMany(Sale::class, 'member_code', 'member_code');
    }
}
