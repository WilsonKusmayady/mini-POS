<?php

namespace App\Repositories\Contracts;

use Illuminate\Pagination\LengthAwarePaginator;

interface SaleRepositoryInterface
{
    public function getAllSalesPaginated(int $perPage = 15, array $filters = []): LengthAwarePaginator;

    public function getSalesHistory(array $filters = [], int $limit = 50): array;

    public function getSaleWithDetails(string $invoiceCode);
    
    public function getSaleForNota(string $invoiceCode);

    public function createSale(array $data);

    public function createDetail(array $data);

    public function updateSaleStatus(string $invoiceCode, int $status): bool;

    public function getLatestByPrefix(string $prefix);

    public function getSalesStatistics(array $filters = []): array;

    public function deleteSale(string $invoiceCode): bool;
}
