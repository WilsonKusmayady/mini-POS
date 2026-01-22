<?php

namespace App\Services;

use App\Repositories\Contracts\MemberRepositoryInterface;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Services\CodeGeneratorService;

class MemberService
{
    protected $memberRepository;
    protected $codeGeneratorService;

    public function __construct(MemberRepositoryInterface $memberRepository, CodeGeneratorService $codeGeneratorService)
    {
        $this->memberRepository = $memberRepository;
        $this->codeGeneratorService = $codeGeneratorService;
    }

    /**
     * Get paginated members with filters
     */
    public function getPaginatedMembers(array $filters = [], int $perPage = 10, int $page = 1)
    {
        $validatedFilters = $this->validateFilters($filters);
        return $this->memberRepository->getPaginated($validatedFilters, $perPage, $page);
    }

    /**
     * Get member by code
     */
    public function getMember(string $memberCode)
    {
        $member = $this->memberRepository->findByCode($memberCode);
        
        if (!$member) {
            throw new \Exception('Member not found');
        }

        return $this->formatMemberResponse($member);
    }

    /**
     * Get member with sales details
     */
    public function getMemberWithDetails(string $memberCode)
    {
        $member = $this->memberRepository->findByCodeWithSales($memberCode);
        
        if (!$member) {
            throw new \Exception('Member not found');
        }

        return $this->formatMemberWithDetailsResponse($member);
    }

    /**
     * Create new member
     */
    public function createMember(array $data)
    {
        // Generate member code
        $memberCode = $this->codeGeneratorService->generateMemberCode();
        
        $memberData = [
            'member_code' => $memberCode,
            'member_name' => $data['member_name'],
            'phone_number' => $data['phone_number'],
            'address' => $data['address'],
            'gender' => (bool) $data['gender'],
            'birth_date' => Carbon::parse($data['birth_date'])->toDateString(),
            'status' => 'active', // Tambahkan status
        ];

        return $this->memberRepository->create($memberData);
    }

    /**
     * Update member
     */
    // Di MemberService.php, update method updateMember:
    public function updateMember(string $memberCode, array $data)
    {
        \DB::beginTransaction();
        
        try {
            $member = $this->memberRepository->findByCode($memberCode);
            
            if (!$member) {
                throw new \Exception('Member not found');
            }

            // Prepare update data
            $updateData = [];
            
            // ✅ LOGIC BARU: Simpan nama member lama untuk perbandingan
            $oldMemberName = $member->member_name;
            
            if (isset($data['member_name'])) {
                $updateData['member_name'] = $data['member_name'];
            }
            
            if (isset($data['phone_number'])) {
                $updateData['phone_number'] = $data['phone_number'];
            }
            
            if (isset($data['address'])) {
                $updateData['address'] = $data['address'];
            }
            
            // Handle gender - bisa boolean atau string '0'/'1'
            if (isset($data['gender'])) {
                $updateData['gender'] = is_bool($data['gender']) 
                    ? $data['gender'] 
                    : ($data['gender'] === '1' || $data['gender'] === 1 || $data['gender'] === true);
            }
            
            // Handle birth date
            if (isset($data['birth_date'])) {
                try {
                    $updateData['birth_date'] = Carbon::parse($data['birth_date'])->toDateString();
                } catch (\Exception $e) {
                    // Tanggal tidak valid, abaikan
                }
            }
            
            // Handle status
            if (isset($data['status'])) {
                $updateData['status'] = $data['status'];
            }

            // Jika tidak ada data yang diupdate
            if (empty($updateData)) {
                throw new \Exception('Tidak ada data yang diperbarui');
            }

            // Update member
            $result = $this->memberRepository->update($memberCode, $updateData);
            
            // ✅ LOGIC BARU: Jika member_name berubah, update semua sales transaction terkait
            if (isset($data['member_name']) && $data['member_name'] !== $oldMemberName) {
                $this->updateSalesCustomerName($memberCode, $data['member_name']);
            }
            
            \DB::commit();
            
            return $result;
            
        } catch (\Exception $e) {
            \DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update customer_name in all sales transactions for a member
     */
    private function updateSalesCustomerName(string $memberCode, string $newCustomerName): void
    {
        // Update semua sales yang terkait dengan member ini
        $updatedCount = \App\Models\Sales::where('member_code', $memberCode)
            ->update(['customer_name' => $newCustomerName]);
        
        // Log jika perlu
        if ($updatedCount > 0) {
            \Log::info("Updated {$updatedCount} sales transactions for member {$memberCode} with new customer_name: {$newCustomerName}");
        }
    }

    /**
     * Delete member
     */
    public function deleteMember(string $memberCode)
    {
        $member = $this->memberRepository->findByCodeWithSalesCount($memberCode);
        
        if (!$member) {
            throw new \Exception('Member tidak ditemukan');
        }

        // Check if member has sales transactions
        if ($member->sales_count > 0) {
            throw new \Exception('Tidak dapat menghapus member yang pernah melakukan transaksi');
        }

        return $this->memberRepository->delete($memberCode);
    }

    /**
     * Toggle member status
     */
    public function toggleStatus(string $memberCode, string $status)
    {
        $member = $this->memberRepository->findByCode($memberCode);
        
        if (!$member) {
            throw new \Exception('Member tidak ditemukan');
        }

        return $this->memberRepository->update($memberCode, ['status' => $status]);
    }

    /**
     * Generate member code
     */
    private function generateMemberCode(): string
    {
        $year = Carbon::now()->format('y');
        $month = Carbon::now()->format('m');
        
        $prefix = "MBR{$year}{$month}";
        $latest = $this->memberRepository->getLatestByPrefix($prefix);
        
        if ($latest) {
            $lastNumber = (int) substr($latest->member_code, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }
        
        return "{$prefix}{$newNumber}";
    }

    /**
     * Validate filters
     */
    private function validateFilters(array $filters): array
    {
        $validated = [];

        if (isset($filters['status']) && in_array($filters['status'], ['active', 'inactive'])) {
            $validated['status'] = $filters['status'];
        }
        
        if (!empty($filters['search'])) {
            $validated['search'] = trim($filters['search']);
        }
        
        if (isset($filters['gender']) && $filters['gender'] !== '') {
            $validated['gender'] = (bool) $filters['gender'];
        }

        if (!empty($filters['birth_date_start'])) {
            try {
                $validated['birth_date_start'] = Carbon::parse($filters['birth_date_start'])->toDateString();
            } catch (\Exception $e) {
                // Tanggal tidak valid, abaikan
            }
        }
        
        if (!empty($filters['birth_date_end'])) {
            try {
                $validated['birth_date_end'] = Carbon::parse($filters['birth_date_end'])->toDateString();
            } catch (\Exception $e) {
                // Tanggal tidak valid, abaikan
            }
        }
        
        return $validated;
    }

    /**
     * Format member response
     */
    private function formatMemberResponse($member): array
    {
        return [
            'member_code' => $member->member_code,
            'member_name' => $member->member_name,
            'phone_number' => $member->phone_number,
            'address' => $member->address,
            'gender' => $member->gender,
            'birth_date' => $member->birth_date,
            'status' => $member->status,
            'created_at' => $member->created_at->toISOString(),
            'updated_at' => $member->updated_at->toISOString(),
        ];
    }

    /**
     * Format member with details response
     */
    private function formatMemberWithDetailsResponse($member): array
    {
        $formatted = $this->formatMemberResponse($member);
        
        $formatted['sales'] = $member->sales ? $member->sales->map(function ($sale) {
            return [
                'sales_invoice_code' => $sale->sales_invoice_code,
                'sales_date' => $sale->sales_date,
                'sales_grand_total' => (float) $sale->sales_grand_total,
                'sales_payment_method' => $sale->sales_payment_method,
                'sales_status' => $sale->sales_status,
            ];
        })->toArray() : [];

        $formatted['total_transactions'] = $member->sales ? $member->sales->count() : 0;
        $formatted['total_spent'] = $member->sales ? $member->sales->sum('sales_grand_total') : 0;

        return $formatted;
    }
    
    /**
     * Search members for combobox
     */
    public function searchMembers(?string $search = null, int $perPage = 20, int $page = 1)
    {
        // Konversi null ke string kosong
        $search = $search ?? '';
        
        // Convert to array for repository
        $filters = $search ? ['search' => $search] : [];
        
        // Debug logging
        \Log::info('Service searchMembers called', [
            'search' => $search,
            'perPage' => $perPage,
            'page' => $page,
            'filters' => $filters
        ]);
        
        return $this->memberRepository->search($filters, $perPage, $page);
    }

     public function getExportData(array $filters = []): array
    {
        $validatedFilters = $this->validateFilters($filters);
        
        // Get all members for export (gunakan limit besar atau tanpa limit)
        $members = $this->memberRepository->getPaginated($validatedFilters);
        
        $formattedData = [];
        
        foreach ($members as $member) {
            $formattedMember = $this->formatMemberForExport($member);
            $formattedData[] = $formattedMember;
        }
        
        return $formattedData;
    }

    /**
     * Format member for export
     */
    private function formatMemberForExport($member): array
    {
        $birthDate = Carbon::parse($member->birth_date);
        $createdAt = Carbon::parse($member->created_at);
        $age = $createdAt->diffInYears($birthDate);

        return [
            'member_code' => $member->member_code,
            'member_name' => $member->member_name,
            'phone_number' => $member->phone_number,
            'address' => $member->address,
            'gender' => $member->gender ? 'Pria' : 'Wanita',
            'birth_date' => $birthDate->format('d/m/Y'),
            'age' => $age,
            'status' => $member->status === 'active' ? 'Aktif' : 'Nonaktif',
            'created_date' => $createdAt->format('d/m/Y'),
            // 'created_time' => $createdAt->format('H:i:s'),
            'updated_at' => $member->updated_at ? Carbon::parse($member->updated_at)->format('d/m/Y H:i:s') : '-',
        ];
    }
}