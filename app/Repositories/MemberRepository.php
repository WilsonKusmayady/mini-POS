<?php

namespace App\Repositories;

use App\Models\Member;
use App\Models\Sales; 
use App\Repositories\Contracts\MemberRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class MemberRepository implements MemberRepositoryInterface
{
    
    public function getPaginated(array $filters = [], int $perPage = 10, int $page = 1): LengthAwarePaginator
    {
        $query = Member::query();

        // Apply filters
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                 $q->whereRaw('LOWER(member_name) LIKE ?', ['%' . strtolower($search) . '%'])
                    ->orWhereRaw('LOWER(member_code) LIKE ?', ['%' . strtolower($search) . '%'])
                    ->orWhereRaw('LOWER(phone_number) LIKE ?', ['%' . strtolower($search) . '%']);
            });
        }

        if (isset($filters['gender'])) {
            $query->where('gender', $filters['gender']);
        }

        if (!empty($filters['start_date'])) {
        $query->whereDate('birth_date', '>=', $filters['start_date']);
    }

        if (!empty($filters['end_date'])) {
            $query->whereDate('birth_date', '<=', $filters['end_date']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage, ['*'], 'page', $page);
    }

    public function search(array $filters = [], int $perPage = 20, int $page = 1): LengthAwarePaginator
    {
        $query = Member::query();

        // Apply search filter - FIXED CASE INSENSITIVE
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            
            // Option 1: Jika database collation sudah case-insensitive
            // $query->where(function ($q) use ($search) {
            //     $q->where('member_name', 'like', '%' . $search . '%')
            //     ->orWhere('member_code', 'like', '%' . $search . '%')
            //     ->orWhere('phone_number', 'like', '%' . $search . '%');
            // });
            
            // Option 2: Jika perlu benar-benar case-insensitive
            $lowerSearch = strtolower($search);
            $query->where(function ($q) use ($lowerSearch) {
                $q->whereRaw('LOWER(member_name) LIKE ?', ["%{$lowerSearch}%"])
                  ->orWhereRaw('LOWER(member_code) LIKE ?', ["%{$lowerSearch}%"])
                  ->orWhereRaw('LOWER(phone_number) LIKE ?', ["%{$lowerSearch}%"]);
            });
        }

        // Select only necessary fields for combobox
        return $query->select([
            'member_code',
            'member_name', 
            'phone_number',
            'address',
            'gender',
            'birth_date',
            'created_at'
        ])
        ->orderBy('member_name', 'asc') // Order by name ascending
        ->paginate($perPage, ['*'], 'page', $page);
    }

    public function findByCode(string $memberCode)
    {
        return Member::where('member_code', $memberCode)->first();
    }

    public function findByCodeWithSales(string $memberCode)
    {
        return Member::with(['sales' => function ($query) {
            $query->orderBy('sales_date', 'desc')->limit(10);
        }])->where('member_code', $memberCode)->first();
    }

    public function create(array $data)
    {
        return Member::create($data);
    }

    public function update(string $memberCode, array $data): bool
    {
        return Member::where('member_code', $memberCode)->update($data);
    }

    public function delete(string $memberCode): bool
    {
        return Member::where('member_code', $memberCode)->delete();
    }

    public function getLatestByPrefix(string $prefix): ?Member
    {
        return Member::where('member_code', 'like', $prefix . '%')
            ->orderBy('member_code', 'desc')
            ->first();
    }
}