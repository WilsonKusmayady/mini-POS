<?php
namespace App\Services;

// use App\Repositories\ItemRepository;
use App\Services\CodeGeneratorService; 
use App\Repositories\Contracts\ItemRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Exception;

class ItemService {
    protected $itemRepository;
    protected $codeGeneratorService;

    public function __construct(ItemRepositoryInterface $itemRepository, CodeGeneratorService $codeGeneratorService) {
        $this->itemRepository = $itemRepository;
        $this->codeGeneratorService = $codeGeneratorService;
    }

    public function getAllItems() {
        return $this->itemRepository->getAll();
    }

    public function getByCode($code) {
        return $this->itemRepository->findByCode($code);
    }

    public function createItem(array $data) {
        return DB::transaction(function () use ($data) {
            $code = $this->codeGeneratorService->generateItemCode();

            // MERGE DATA:
            // Kita paksa stok jadi 0, meskipun user input angka lain
            $finalData = array_merge($data, [
                'item_code' => $code,
                'item_stock' => $data['item_stock'] ?? 0
            ]);

            return $this->itemRepository->store($finalData);
        });
    }

    public function updateItem($code, array $data) {
        return $this->itemRepository->update($code, $data);
    }

    public function deleteItem($code) {
        return $this->itemRepository->destroy($code);
    }
}