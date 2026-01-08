<?php
namespace App\Repositories;
use App\Models\Supplier;

class SupplierRepository {
    public function getAll() {
        return Supplier::all();
    }

    public function store($data) {
        return Supplier::create($data);
    }
}