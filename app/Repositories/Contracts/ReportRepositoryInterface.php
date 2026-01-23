<?php

namespace App\Repositories\Contracts;

use Carbon\Carbon;

interface ReportRepositoryInterface
{
    /**
     * Get sales reports with filters
     */
    public function getSalesReports(
        Carbon $startDate,
        Carbon $endDate,
        string $customerType = 'all',
        ?string $memberCode = null
    ): array;

    /**
     * Get purchase reports with filters
     */
    public function getPurchaseReports(
        Carbon $startDate,
        Carbon $endDate,
        string $customerType = 'all',
        ?string $memberCode = null
    ): array;

    /**
     * Get all reports (sales + purchase) with filters
     */
    public function getAllReports(
        Carbon $startDate,
        Carbon $endDate,
        string $customerType = 'all',
        ?string $memberCode = null
    ): array;

    /**
     * Get members for dropdown
     */
    public function getMembers(): array;
}