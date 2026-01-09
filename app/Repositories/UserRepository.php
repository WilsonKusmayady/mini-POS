<?php
namespace App\Repositories;
use App\Models\User;

class UserRepository {
    public function getAll() {
        return User::latest()->get();
    }

    public function create(array $data) {
        return User::create($data);
    }
}