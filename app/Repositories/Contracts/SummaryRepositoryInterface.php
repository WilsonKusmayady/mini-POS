<?php
namespace App\Repositories\Contracts;

use Carbon\Carbon;
use Illuminate\Support\Collection;

interface SummaryRepositoryInterface 
{
    /**
     * Get sales summary data
     */
    public function getSalesSummary(Carbon $startDate, Carbon $endDate): Collection;
    
    /**
     * Get purchase summary data
     */
    public function getPurchaseSummary(Carbon $startDate, Carbon $endDate): Collection;
    
    /**
     * Get sales statistics
     */
    public function getSalesStats(Carbon $startDate, Carbon $endDate): array;
    
    /**
     * Get purchase statistics
     */
    public function getPurchaseStats(Carbon $startDate, Carbon $endDate): array;
    public function getSalesByDate(Carbon $date): Collection;
    public function getTopSellingItems(Carbon $startDate, Carbon $endDate, int $limit = 10): Collection;
    public function getDailySalesTrend(Carbon $startDate, Carbon $endDate): Collection;
    public function getPaymentMethodDistribution(Carbon $startDate, Carbon $endDate): Collection;
    public function getCustomerTypeDistribution(Carbon $startDate, Carbon $endDate): Collection;
    
}