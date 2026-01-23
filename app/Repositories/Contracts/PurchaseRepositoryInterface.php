<?php
namespace App\Repositories\Contracts;

interface PurchaseRepositoryInterface {
    public function createPurchase(array $data);
    public function createDetail(array $data);
    public function getLatestByPrefix($prefix);
    public function getPurchaseWithDetails($invoiceNumber);
    public function getAllPurchasesPaginated($perPage = 10);

    // Method Restore and Hide
    public function restore($invoiceNumber);
    public function destroy($invoiceNumber);
    public function getPaginated(array $filters = [], int $perPage = 10);

    public function getForExport(array $filters = []);
    public function update($id, array $data);
}