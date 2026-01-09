<?php
namespace App\Repositories\Contracts;

interface SupplierRepositoryInterface {
    public function getAll();
    public function store($data);
}