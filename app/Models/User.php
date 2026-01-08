<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;
    protected $primaryKey = 'user_id';

    protected $guarded = [];
    protected $hidden = ['password', 'remember_token'];

    protected function casts():array {
        return [
            'password' => 'hashed',
            'user_role' => 'boolean'
        ];
    }

    public function purchase()
    {
        return $this->hasMany(Purchase::class, 'user_id', 'user_id');
    }

    public function sales() 
    {
        return $this->hasMany(Sales::class, 'user_id', 'user_id');
    }
}
