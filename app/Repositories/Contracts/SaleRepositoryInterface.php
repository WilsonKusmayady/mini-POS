<?php
namespace App\Repositories\Contracts;

interface SalesRepositoryInterface {
    public function createSale(array $data);
    public function createDetail(array $data);
    public function getLatestByPrefix($prefix);
    public function getSaleWithDetails($invoiceCode);
}