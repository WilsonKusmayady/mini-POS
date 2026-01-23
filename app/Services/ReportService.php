<?php

namespace App\Services;

use App\Repositories\Contracts\ReportRepositoryInterface;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ReportExport;

class ReportService
{
    protected ReportRepositoryInterface $reportRepository;

    public function __construct(ReportRepositoryInterface $reportRepository)
    {
        $this->reportRepository = $reportRepository;
    }

    /**
     * Get reports data with filters
     */
    public function getReports(array $params): array
    {
        try {
            // Validate and parse dates
            $startDate = !empty($params['start_date'])
                ? Carbon::parse($params['start_date'])->startOfDay()
                : null;

            $endDate = !empty($params['end_date'])
                ? Carbon::parse($params['end_date'])->endOfDay()
                : null;

            $type = $params['type'] ?? 'all';
            $customerType = $params['customer_type'] ?? 'all';
            $memberCode = $params['member_code'] ?? null;

            // Get data based on transaction type
            switch ($type) {
                case 'sales':
                    $data = $this->reportRepository->getSalesReports($startDate, $endDate, $customerType, $memberCode);
                    break;
                case 'purchase':
                    $data = $this->reportRepository->getPurchaseReports($startDate, $endDate, $customerType, $memberCode);
                    break;
                case 'all':
                default:
                    $data = $this->reportRepository->getAllReports($startDate, $endDate, $customerType, $memberCode);
                    break;
            }

            // Calculate totals
            $totals = $this->calculateTotals($data);

            return [
                'success' => true,
                'data' => $data,
                'totals' => $totals,
                'count' => count($data),
                'filters' => [
                    'type' => $type,
                    'customer_type' => $customerType,
                    'member_code' => $memberCode,
                    'start_date' => $startDate?->toDateString(),
                    'end_date' => $endDate?->toDateString(),
                ]
            ];

        } catch (\Exception $e) {
            throw new \Exception('Error getting reports: ' . $e->getMessage());
        }
    }

    /**
     * Calculate totals from report data
     */
    protected function calculateTotals(array $data): array
    {
        $totalAmount = 0;
        $totalDiscount = 0;
        $totalSubtotal = 0;
        $memberCount = 0;
        $nonMemberCount = 0;

        foreach ($data as $row) {
            $totalAmount += (float)($row['total_amount'] ?? 0);
            $totalDiscount += (float)($row['discount'] ?? 0);
            $totalSubtotal += (float)($row['subtotal'] ?? 0);
            
            if (!empty($row['member_code'])) {
                $memberCount++;
            } else {
                $nonMemberCount++;
            }
        }

        return [
            'total_amount' => (float)$totalAmount,
            'total_discount' => (float)$totalDiscount,
            'total_subtotal' => (float)$totalSubtotal,
            'member_count' => $memberCount,
            'non_member_count' => $nonMemberCount,
            'total_transactions' => count($data),
        ];
    }

    /**
    * Export reports to Excel
    */
    public function exportReports(array $params)
    {
        try {
            // Clean up parameters
            $params['start_date'] = $params['start_date'] ?? null;
            $params['end_date'] = $params['end_date'] ?? null;
            $params['member_code'] = $params['member_code'] ?? null;

            // Get report data
            $reportData = $this->getReports($params);
            
            if (empty($reportData['data'])) {
                throw new \Exception('Tidak ada data untuk diexport');
            }

            // Generate filename
            $fileName = $this->generateExportFilename($params);
            
            return Excel::download(
                new ReportExport($reportData['data'], $params, $reportData['totals']),
                $fileName
            );
            
        } catch (\Exception $e) {
            throw new \Exception('Export error: ' . $e->getMessage());
        }
    }

    /**
     * Generate export filename
     */
    protected function generateExportFilename(array $params): string
    {
        $timestamp = date('Ymd_His');
        $parts = ['reports'];
        
        // Add date range
        $start = $params['start_date'];
        $end = $params['end_date'];
        
        if ($start && $end) {
            $parts[] = date('Ymd', strtotime($start));
            $parts[] = 'to';
            $parts[] = date('Ymd', strtotime($end));
        } elseif ($start) {
            $parts[] = 'from';
            $parts[] = date('Ymd', strtotime($start));
        } elseif ($end) {
            $parts[] = 'until';
            $parts[] = date('Ymd', strtotime($end));
        } else {
            $parts[] = 'all_period';
        }
        
        // Add transaction type if not 'all'
        if (($params['type'] ?? 'all') !== 'all') {
            $parts[] = $params['type'];
        }
        
        // Add customer type if not 'all'
        if (($params['customer_type'] ?? 'all') !== 'all') {
            $parts[] = $params['customer_type'];
        }
        
        // Add member code if specified
        if (!empty($params['member_code'])) {
            $parts[] = 'member_' . substr($params['member_code'], 0, 8);
        }
        
        // Add timestamp
        $parts[] = $timestamp;
        
        // Clean and join parts
        $filename = implode('_', $parts) . '.xlsx';
        
        // Remove any invalid characters
        return preg_replace('/[^a-zA-Z0-9_.-]/', '_', $filename);
    }

    /**
     * Get members for dropdown
     */
    public function getMembers(): array
    {
        try {
            $members = $this->reportRepository->getMembers();
            
            return [
                'success' => true,
                'data' => $members,
                'count' => count($members)
            ];
            
        } catch (\Exception $e) {
            throw new \Exception('Error getting members: ' . $e->getMessage());
        }
    }
}