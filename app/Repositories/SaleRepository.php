<?php

namespace App\Repositories;

use App\Models\Sales;
use App\Models\SalesDetail;
use App\Repositories\Contracts\SaleRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;

class SaleRepository implements SaleRepositoryInterface
{
    public function getAllSalesPaginated(int $perPage = 10, array $filters = [], int $page = 1): LengthAwarePaginator
    {
        $query = Sales::with(['sales_details.item' => function($query) {
            $query->select('item_code', 'item_name', 'item_stock', 'item_price as sell_price');
        }, 'user', 'member'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if (!empty($filters['search'])) {
            $search = strtolower(trim($filters['search']));
            $query->where(function ($q) use ($search) {
                // 1. Search by invoice code
                $q->whereRaw('LOWER(sales_invoice_code) LIKE ?', ["%{$search}%"]);
                
                // 2. Search by customer name or member name
                $q->orWhereRaw('LOWER(customer_name) LIKE ?', ["%{$search}%"])
                  ->orWhereHas('member', function ($memberQuery) use ($search) {
                      $memberQuery->whereRaw('LOWER(member_name) LIKE ?', ["%{$search}%"]);
                  });
                
                // 3. Search by member code
                $q->orWhereRaw('LOWER(member_code) LIKE ?', ["%{$search}%"]);
                
                // 4. Search by payment method (including partial match)
                $paymentMethodMap = $this->getPaymentMethodSearchMap($search);
                if (!empty($paymentMethodMap)) {
                    $q->orWhereIn('sales_payment_method', $paymentMethodMap);
                }
                
                // 5. Search by date (various formats)
                $dateFormats = $this->parseDateSearch($search);
                if (!empty($dateFormats)) {
                    $q->orWhere(function ($dateQuery) use ($dateFormats) {
                        foreach ($dateFormats as $date) {
                            $dateQuery->orWhereDate('sales_date', $date);
                            $dateQuery->orWhereDate('created_at', $date);
                        }
                    });
                }
                
                // 6. Search by grand total (numeric search)
                $numericValue = $this->extractNumericValue($search);
                if ($numericValue !== null) {
                    // Search exact grand total or within range
                    $tolerance = 100; // Tolerance for rounding differences
                    $q->orWhereBetween('sales_grand_total', [
                        $numericValue - $tolerance,
                        $numericValue + $tolerance
                    ]);
                    
                    // Also search subtotal and discount
                    $q->orWhereBetween('sales_subtotal', [
                        $numericValue - $tolerance,
                        $numericValue + $tolerance
                    ]);
                }
                
                // 7. Search by item name in sale details
                $q->orWhereHas('sales_details.item', function ($itemQuery) use ($search) {
                    $itemQuery->whereRaw('LOWER(item_name) LIKE ?', ["%{$search}%"]);
                });
            });
        }

        // Apply other filters
        if (isset($filters['status'])) {
            $query->where('sales_status', (bool) $filters['status']);
        }

        if (!empty($filters['payment_method'])) {
            $query->where('sales_payment_method', $filters['payment_method']);
        }

        if (!empty($filters['start_date'])) {
            $query->whereDate('sales_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('sales_date', '<=', $filters['end_date']);
        }

        return $query->paginate($perPage, ['*'], 'page', $page);
    }
    
    /**
     * Parse payment method search terms
     */
    private function getPaymentMethodSearchMap(string $search): array
    {
        $search = strtolower($search);
        $methods = [];
        
        // Map search terms to payment methods
        if (str_contains($search, 'cash') || str_contains($search, 'tunai')) {
            $methods[] = 'cash';
        }
        
        if (str_contains($search, 'debit') || str_contains($search, 'kartu')) {
            $methods[] = 'debit';
        }
        
        if (str_contains($search, 'qris') || str_contains($search, 'qr')) {
            $methods[] = 'qris';
        }
        
        // Direct matches
        if (in_array($search, ['cash', 'debit', 'qris'])) {
            $methods[] = $search;
        }
        
        return array_unique($methods);
    }
    
    /**
     * Parse date from search string
     */
    private function parseDateSearch(string $search): array
    {
        $dates = [];
        
        try {
            // Common Indonesian date patterns
            $patterns = [
                // dd-mm-yyyy or dd/mm/yyyy
                '/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/',
                // yyyy-mm-dd
                '/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/',
                // dd month yyyy (e.g., "22 Januari 2024", "22 Jan 2024")
                '/(\d{1,2})\s+(Jan(?:uari)?|Feb(?:ruari)?|Mar(?:et)?|Apr(?:il)?|Mei|Jun(?:i)?|Jul(?:i)?|Agus(?:tus)?|Sep(?:tember)?|Okt(?:ober)?|Nov(?:ember)?|Des(?:ember)?)\s+(\d{2,4})/i',
                // month dd yyyy (e.g., "Januari 22 2024")
                '/(Jan(?:uari)?|Feb(?:ruari)?|Mar(?:et)?|Apr(?:il)?|Mei|Jun(?:i)?|Jul(?:i)?|Agus(?:tus)?|Sep(?:tember)?|Okt(?:ober)?|Nov(?:ember)?|Des(?:ember)?)\s+(\d{1,2})\s+(\d{2,4})/i',
            ];
            
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $search, $matches)) {
                    try {
                        if (isset($matches[3])) {
                            // Try to parse the date
                            $dateString = $matches[0];
                            $carbonDate = Carbon::parse($dateString);
                            $dates[] = $carbonDate->toDateString();
                        }
                    } catch (\Exception $e) {
                        continue;
                    }
                }
            }
            
            // Try simple numeric date (e.g., "22" for day)
            if (is_numeric($search) && $search >= 1 && $search <= 31) {
                // Add current month/year with the day
                $carbonDate = Carbon::create(null, null, (int)$search);
                $dates[] = $carbonDate->toDateString();
            }
            
            // Month name search (e.g., "Januari", "Jan")
            $monthNames = [
                'januari' => '01', 'jan' => '01',
                'februari' => '02', 'feb' => '02',
                'maret' => '03', 'mar' => '03',
                'april' => '04', 'apr' => '04',
                'mei' => '05',
                'juni' => '06', 'jun' => '06',
                'juli' => '07', 'jul' => '07',
                'agustus' => '08', 'agus' => '08',
                'september' => '09', 'sep' => '09',
                'oktober' => '10', 'okt' => '10',
                'november' => '11', 'nov' => '11',
                'desember' => '12', 'des' => '12',
            ];
            
            $searchLower = strtolower($search);
            if (isset($monthNames[$searchLower])) {
                // Add current year with the month
                $carbonDate = Carbon::create(null, $monthNames[$searchLower], 1);
                $dates[] = $carbonDate->toDateString();
            }
            
        } catch (\Exception $e) {
            // Silently fail date parsing
        }
        
        return array_unique($dates);
    }
    
    /**
     * Extract numeric value from search string for amount searching
     */
    private function extractNumericValue(string $search): ?float
    {
        // Remove currency symbols, dots (thousand separators), and commas (decimal separators)
        $cleaned = preg_replace('/[^\d]/', '', $search);
        
        if (is_numeric($cleaned) && $cleaned > 0) {
            $value = (float)$cleaned;
            
            // If original search contains "rp", "ribu", "rb", "jt", "juta", etc.
            // Adjust the value accordingly
            $searchLower = strtolower($search);
            
            if (str_contains($searchLower, 'jt') || str_contains($searchLower, 'juta')) {
                $value *= 1000000;
            } elseif (str_contains($searchLower, 'rb') || str_contains($searchLower, 'ribu')) {
                $value *= 1000;
            } elseif (str_contains($searchLower, 'k')) {
                $value *= 1000;
            }
            
            return $value;
        }
        
        return null;
    }

    public function getSalesHistory(array $filters = [], int $limit = 50): array
    {
        $query = Sales::with(['sales_details.item', 'user'])
            ->orderBy('created_at', 'desc')
            ->limit($limit);

        // Apply filters
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('sales_invoice_code', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('member_code', 'like', "%{$search}%")
                  ->orWhere('sales_payment_method', 'like', "%{$search}%")
                  ->orWhere('sales_grand_total', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('sales_status', $filters['status']);
        }

        return $query->get()->map(function ($sale) {
            return [
                'sales_invoice_code' => $sale->sales_invoice_code,
                'customer_name' => $sale->customer_name,
                'member_code' => $sale->member_code,
                'sales_date' => $sale->sales_date,
                'sales_subtotal' => (float) $sale->sales_subtotal,
                'sales_discount_value' => (float) $sale->sales_discount_value,
                'sales_hasil_discount_value' => (float) $sale->sales_hasil_discount_value,
                'sales_grand_total' => (float) $sale->sales_grand_total,
                'sales_payment_method' => $sale->sales_payment_method,
                'sales_status' => $sale->sales_status,
                'user_id' => $sale->user_id,
                'created_at' => $sale->created_at->toISOString(),
                'items' => $sale->sales_details->map(function ($detail) {
                    return [
                        'item_code' => $detail->item_code,
                        'item_name' => $detail->item->item_name ?? 'Unknown Item',
                        'sales_quantity' => $detail->sales_quantity,
                        'sell_price' => (float) $detail->sell_price,
                        'sales_discount_item' => (float) $detail->sales_discount_item,
                        'sales_hasil_diskon_item' => (float) $detail->sales_hasil_diskon_item,
                        'total_item_price' => (float) $detail->total_item_price,
                    ];
                })->toArray(),
            ];
        })->toArray();
    }

    public function updateSale(string $invoiceCode, array $data): bool
    {
        $sale = Sales::where('sales_invoice_code', $invoiceCode)->first();
        
        if (!$sale) {
            throw new \Exception('Sale not found');
        }

        // Filter hanya field yang diizinkan untuk diupdate
        $allowedFields = [
            'customer_name',
            'member_code', 
            'sales_date',
            'sales_discount_value',
            'sales_payment_method',
            'sales_status'
        ];
        
        $updateData = [];
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[$field] = $data[$field];
            }
        }

        // Jika ada perubahan pada member_code, validasi
        if (isset($updateData['member_code']) && $updateData['member_code'] === null) {
            $updateData['member_code'] = null;
        }

        return $sale->update($updateData);
    }

    public function getSaleDetails(string $invoiceCode)
    {
        return SalesDetail::where('sales_invoice_code', $invoiceCode)->get();
    }

    public function getSaleWithDetails(string $invoiceCode)
    {
        return Sales::with(['sales_details.item' => function($query) {
            $query->select('item_code', 'item_name', 'item_stock', 'item_price as sell_price');
        }, 'user', 'member'])
            ->where('sales_invoice_code', $invoiceCode)
            ->first();
    }

    public function getSaleForNota(string $invoiceCode)
    {
        return Sales::with(['sales_details.item', 'user', 'member'])
            ->where('sales_invoice_code', $invoiceCode)
            ->first();
    }

    public function createSale(array $data)
    {
        return Sales::create($data);
    }

    public function createDetail(array $data)
    {
        return SalesDetail::create($data);
    }

    public function updateSaleStatus(string $invoiceCode, int $status): bool
    {
        return Sales::where('sales_invoice_code', $invoiceCode)
            ->update(['sales_status' => $status]);
    }

    public function getLatestByPrefix(string $prefix)
    {
        return Sales::where('sales_invoice_code', 'like', $prefix . '%')
            ->orderBy('sales_invoice_code', 'desc')
            ->first();
    }

    public function getSalesStatistics(array $filters = []): array
    {
        $query = Sales::query();

        if (!empty($filters['start_date'])) {
            $query->whereDate('sales_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('sales_date', '<=', $filters['end_date']);
        }

        if (!empty($filters['status'])) {
            $query->where('sales_status', $filters['status']);
        }

        $totalSales = $query->count();
        $totalRevenue = $query->sum('sales_grand_total');
        $totalDiscount = $query->sum('sales_hasil_discount_value');
        $averageTransaction = $totalSales > 0 ? $totalRevenue / $totalSales : 0;

        return [
            'total_sales' => $totalSales,
            'total_revenue' => (float) $totalRevenue,
            'total_discount' => (float) $totalDiscount,
            'average_transaction' => (float) $averageTransaction,
        ];
    }

    public function deleteSale(string $invoiceCode): bool
    {
        return Sales::where('sales_invoice_code', $invoiceCode)->delete();
    }
}