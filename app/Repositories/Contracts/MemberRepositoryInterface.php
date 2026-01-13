<?php

namespace App\Repositories\Contracts;

use Illuminate\Pagination\LengthAwarePaginator;

interface MemberRepositoryInterface
{
    public function getPaginated(array $filters = [], int $perPage = 10, int $page = 1): LengthAwarePaginator;
    public function findByCode(string $memberCode);
    public function findByCodeWithSales(string $memberCode);
    public function create(array $data);
    public function update(string $memberCode, array $data): bool;
    public function delete(string $memberCode): bool;
    public function getLatestByPrefix(string $prefix);
}