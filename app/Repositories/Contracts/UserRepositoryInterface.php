<?php

namespace App\Repositories\Contracts;

use App\Models\User;

interface UserRepositoryInterface
{
    public function getAll();

    public function findById($id);

    public function findByUsername(string $username);

    public function store(array $data);

    public function update($id, array $data);

    public function delete($id);
}