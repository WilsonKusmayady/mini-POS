<?php

namespace App\Services;

use App\Repositories\Contracts\MemberRepositoryInterface;
use Illuminate\Support\Str;
use Carbon\Carbon;

class MemberService
{
    protected $memberRepository;

    public function __construct(MemberRepositoryInterface $memberRepository)
    {
        $this->memberRepository = $memberRepository;
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
        $memberCode = $this->generateMemberCode();
        
        $memberData = [
            'member_code' => $memberCode,
            'member_name' => $data['member_name'],
            'phone_number' => $data['phone_number'],
            'address' => $data['address'],
            'gender' => (bool) $data['gender'],
            'birth_date' => Carbon::parse($data['birth_date'])->toDateString(),
        ];

        return $this->memberRepository->create($memberData);
    }

    /**
     * Update member
     */
    public function updateMember(string $memberCode, array $data)
    {
        $member = $this->memberRepository->findByCode($memberCode);
        
        if (!$member) {
            throw new \Exception('Member not found');
        }

        $updateData = [
            'member_name' => $data['member_name'],
            'phone_number' => $data['phone_number'],
            'address' => $data['address'],
            'gender' => (bool) $data['gender'],
            'birth_date' => Carbon::parse($data['birth_date'])->toDateString(),
        ];

        return $this->memberRepository->update($memberCode, $updateData);
    }

    /**
     * Delete member
     */
    public function deleteMember(string $memberCode)
    {
        $member = $this->memberRepository->findByCode($memberCode);
        
        if (!$member) {
            throw new \Exception('Member not found');
        }

        // Check if member has sales
        if ($member->sales && $member->sales->count() > 0) {
            throw new \Exception('Cannot delete member with existing sales records');
        }

        return $this->memberRepository->delete($memberCode);
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
        
        if (!empty($filters['search'])) {
            $validated['search'] = trim($filters['search']);
        }
        
        if (isset($filters['gender']) && $filters['gender'] !== '') {
            $validated['gender'] = (bool) $filters['gender'];
        }

        if (!empty($filters['start_date'])) {
        try {
                $validated['start_date'] = Carbon::parse($filters['start_date'])->toDateString();
            } catch (\Exception $e) {
                // Tanggal tidak valid, abaikan
            }
        }
        
        if (!empty($filters['end_date'])) {
            try {
                $validated['end_date'] = Carbon::parse($filters['end_date'])->toDateString();
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
}