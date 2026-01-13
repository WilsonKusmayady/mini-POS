<?php
namespace App\Repositories\Contracts;

interface ItemRepositoryInterface {
    public function getAll();
    public function findByCode($code);
    public function store(array $data);
    public function update($code, array $data);
    public function destroy($code);
    public function getLatestItem();
    public function getPaginated(int $perPage, string $search = null);
}