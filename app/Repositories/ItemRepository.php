<?php
namespace App\Repositories;
use App\Models\Item;
use App\Repositories\Contracts\ItemRepositoryInterface;

class ItemRepository implements ItemRepositoryInterface {
    public function getAll() {
        return Item::orderby('item_name', 'asc')->get();
    }

    public function findByCode($code) {
        return Item::where('item_code', $code)->first();
    }

    // public function getPaginated(int $perPage, string $search = null) {
    //     $query = Item::query();
    //     if($search) {
    //         $query->where('item_name', 'ilike', "%{$search}%")->orWhere('item_code', 'ilike', "%{$search}%");
    //     }
    //     return $query->orderby('item_name', 'asc')->paginate($perPage);
    // }

    // Method Flexible: Bisa untuk Pagination biasa ATAU Pencarian
    public function getPaginated(int $perPage, string $search = null, string $sortBy = 'item_name', string $sortDirection = 'asc') {
        $query = Item::query();

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('item_name', 'ilike', "%{$search}%")
                ->orWhere('item_code', 'ilike', "%{$search}%");
            });
        }

        // Validasi kolom agar aman dari SQL Injection
        $allowedSorts = ['item_name', 'item_code', 'item_price', 'item_stock'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'item_name';
        }
        
        // Validasi arah sort
        $sortDirection = strtolower($sortDirection) === 'desc' ? 'desc' : 'asc';

        return $query->orderBy($sortBy, $sortDirection)
                    ->orderBy('item_code', 'asc') // Tie-breaker (Wajib ada agar pagination stabil)
                    ->paginate($perPage);
    }

    public function store(array $data) {
        return Item::create($data);
    }

    public function update($code, array $data) {
        $item = $this->findByCode($code);
        if($item) {
            $item->update($data);
        }
        return $item;
    }

    public function destroy($code) {
        $item = $this->findByCode($code);
        if($item) {
            $item->delete();
        }
        return $item;
    }

    public function getLatestItem() {
        return Item::orderBy('item_code', 'desc')->first();
    }
}