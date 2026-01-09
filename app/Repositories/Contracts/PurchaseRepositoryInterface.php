<?php
namespace App\Repositories\Contracts;

interface PurchaseRepositoryInterface {
    public function createPurchase(array $data);
    public function createDetail(array $data);
    public function getLatestByPrefix($prefix);
    public function getPurchaseWithDetails($invoiceNumber);
}