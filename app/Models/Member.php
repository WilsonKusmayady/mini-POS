<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Member extends Model
{
    use HasFactory;
    protected $primaryKey = 'member_code';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $guarded = [];
    
    protected $casts = [
        'gender' => 'boolean',
        'birth_date' => 'date',
    ];

    public function sales() 
    {
        return $this->hasMany(Sales::class, 'member_code', 'member_code');
    }
}
