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