<?php

namespace App\Repositories\Contracts;

interface DashboardRepositoryInterface
{
    /**
     * Get sales count for specific month and year
     */
    public function getSalesCount(int $month, int $year): int;

    /**
     * Get revenue for specific month and year
     */
    public function getRevenue(int $month, int $year): float;

    /**
     * Get total members count
     */
    public function getTotalMembersCount(): int;

    /**
     * Get new members count for specific month and year
     */
    public function getNewMembersCount(int $month, int $year): int;

    /**
     * Get new customers count (non-member) for specific month and year
     */
    public function getNewCustomersCount(int $month, int $year): int;

    /**
     * Get top selling items
     */
    public function getTopSellingItems(int $limit = 5): array;

    /**
     * Get recent transactions
     */
    public function getRecentTransactions(int $limit = 2): array;

    /**
     * Get recent system activities
     */
    public function getRecentSystemActivities(int $limit = 2): array;

    /**
     * Get recent members
     */
    public function getRecentMembers(int $limit = 1): array;

    /**
     * Get recent stock updates
     */
    public function getRecentStockUpdates(int $limit = 1): array;
}