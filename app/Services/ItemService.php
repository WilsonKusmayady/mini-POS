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

    public function getItemsPaginated($perPage = 10, $search = null, $sortBy = 'item_name', $sortDirection = 'asc') {
        return $this->itemRepository->getPaginated($perPage, $search, $sortBy, $sortDirection);
    }

    public function getItemsForDropdown($page = 1, $search = '') {
        return $this->itemRepository->getPaginated(15, $search);
    }
}