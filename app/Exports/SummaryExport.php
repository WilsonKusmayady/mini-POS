<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Color;

class SummaryExport implements FromArray, WithHeadings, WithStyles, WithEvents, WithTitle
{
    protected array $data;
    protected array $params;
    protected $totals;

    public function __construct(array $data, array $params = [])
    {
        $this->data = $data;
        $this->params = $params;
        $this->calculateTotals();
    }

    protected function calculateTotals()
    {
        $this->totals = [
            'totalTransactions' => 0,
            'totalAmount' => 0,
            'totalDiscount' => 0,
            'totalItems' => 0,
            'averagePerTransaction' => 0,
        ];

        if (isset($this->data['summary']) && !empty($this->data['summary'])) {
            foreach ($this->data['summary'] as $day) {
                $this->totals['totalTransactions'] += $day['transaction_count'] ?? 0;
                $this->totals['totalAmount'] += $day['total_transactions'] ?? 0;
                $this->totals['totalDiscount'] += $day['total_discount'] ?? 0;
                $this->totals['totalItems'] += $day['items_sold'] ?? 0;
            }

            $this->totals['averagePerTransaction'] = $this->totals['totalTransactions'] > 0 
                ? $this->totals['totalAmount'] / $this->totals['totalTransactions'] 
                : 0;
        }
    }

    public function title(): string
    {
        return 'Summary Transaksi';
    }

    public function headings(): array
    {
        // Headers utama (akan diatur posisi row-nya di registerEvents)
        return [
            ['LAPORAN SUMMARY TRANSAKSI'],
            [''],
            ['Periode Tanggal'],
            ['Jenis Transaksi'],
            ['Jumlah Data'],
            ['Tanggal Export'],
            [''],
            ['TOTAL TRANSAKSI'],
            ['TOTAL PENJUALAN'],
            ['TOTAL DISKON'],
            ['ITEM TERJUAL'],
            ['RATA-RATA PER TRANSAKSI'],
            [''],
            [
                'Tanggal',
                'Jumlah Transaksi',
                'Item Terjual',
                'Total Transaksi (Rp)',
                'Total Diskon (Rp)',
                'Rata-rata / Transaksi (Rp)',
            ]
        ];
    }

    public function array(): array
    {
        $rows = [];

        if (isset($this->data['summary']) && !empty($this->data['summary'])) {
            foreach ($this->data['summary'] as $row) {
                $rows[] = [
                    $this->formatDateExcel($row['date'] ?? ''),
                    $row['transaction_count'] ?? 0,
                    $row['items_sold'] ?? 0,
                    $row['total_transactions'] ?? 0,
                    $row['total_discount'] ?? 0,
                    $row['average_transaction'] ?? 0,
                ];
            }

            // Tambah row total
            $rows[] = [
                'TOTAL (' . count($this->data['summary']) . ' hari)',
                $this->totals['totalTransactions'],
                $this->totals['totalItems'],
                $this->totals['totalAmount'],
                $this->totals['totalDiscount'],
                $this->totals['averagePerTransaction'],
            ];
        }

        return $rows;
    }

    public function styles(Worksheet $sheet)
    {
        $lastRow = $sheet->getHighestRow();
        $lastCol = $sheet->getHighestColumn();

        $styles = [
            // Header utama
            1 => [
                'font' => [
                    'bold' => true,
                    'size' => 16,
                    'color' => ['argb' => '4F46E5'],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],

            // Row untuk header tabel (row 14)
            14 => [
                'font' => ['bold' => true],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'E2E8F0'],
                ],
            ],

            // Row terakhir (total)
            $lastRow => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'E0E7FF'],
                ],
            ],
        ];

        return $styles;
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                
                // Merge cell untuk header utama
                $sheet->mergeCells('A1:F1');
                
                // Isi data filter dan summary di cell yang benar
                $startDate = $this->params['start_date'] ?? '';
                $endDate = $this->params['end_date'] ?? '';
                $type = $this->params['type'] ?? 'all';
                
                $typeLabels = [
                    'all' => 'Semua Transaksi',
                    'sales' => 'Sales (Penjualan)',
                    'purchase' => 'Purchase (Pembelian)'
                ];
                
                // Isi data filter (vertikal)
                $sheet->setCellValue('B3', ':' . $this->formatDateExcel($startDate) . ' s/d ' . $this->formatDateExcel($endDate));
                $sheet->setCellValue('B4', ' ' . ($typeLabels[$type] ?? 'Semua Transaksi'));
                $sheet->setCellValue('B5', ' ' . count($this->data['summary'] ?? []) . ' hari');
                $sheet->setCellValue('B6', ' ' . date('d F Y H:i:s'));
                
                // Isi data summary
                $sheet->setCellValue('B8', ' ' . $this->totals['totalTransactions'] . ' transaksi');
                $sheet->setCellValue('B9', ' Rp ' . number_format($this->totals['totalAmount'], 0, ',', '.'));
                $sheet->setCellValue('B10', ' Rp ' . number_format($this->totals['totalDiscount'], 0, ',', '.'));
                $sheet->setCellValue('B11', ' ' . $this->totals['totalItems'] . ' item');
                $sheet->setCellValue('B12', ' Rp ' . number_format($this->totals['averagePerTransaction'], 0, ',', '.'));
                
                // Format label filter dan summary menjadi bold
                for ($i = 3; $i <= 12; $i++) {
                    $sheet->getStyle('A' . $i)->applyFromArray([
                        'font' => ['bold' => true],
                    ]);
                }
                
                // Cari row terakhir setelah data
                $lastDataRow = 15 + count($this->data['summary'] ?? []);
                $lastRow = $lastDataRow; // +1 untuk row total
                
                // Tambah border untuk tabel data (dari row 14 sampai lastRow)
                $sheet->getStyle('A14:F' . $lastRow)->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['argb' => '000000'],
                        ],
                    ],
                ]);
                
                // Border khusus untuk header tabel (row 14)
                $sheet->getStyle('A14:F14')->applyFromArray([
                    'borders' => [
                        'bottom' => [
                            'borderStyle' => Border::BORDER_MEDIUM,
                            'color' => ['argb' => '4F46E5'],
                        ],
                    ],
                ]);
                
                // Format angka sebagai currency untuk kolom D, E, F (mulai dari row 15)
                $currencyColumns = ['D', 'E', 'F'];
                for ($row = 15; $row <= $lastRow; $row++) {
                    foreach ($currencyColumns as $col) {
                        $cell = $col . $row;
                        $sheet->getStyle($cell)->getNumberFormat()->setFormatCode('#,##0');
                    }
                }
                
                // Auto size semua kolom
                foreach (range('A', 'F') as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
                
                // Set lebar kolom A sedikit lebih lebar untuk tanggal
                $sheet->getColumnDimension('A')->setWidth(25);
                
                // Alignment untuk kolom angka
                $sheet->getStyle('B15:F' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                $sheet->getStyle('B15:F' . $lastRow)->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
                
                // Height untuk header tabel
                $sheet->getRowDimension(14)->setRowHeight(25);

                // Tambah sheet untuk Purchase vs Sales jika ada data
                if (isset($this->data['transaction_summary']) && !empty($this->data['transaction_summary']) && $this->params['type'] === 'all') {
                    $this->addPurchaseSalesSheet($event);
                }
            },
        ];
    }

    protected function addPurchaseSalesSheet(AfterSheet $event)
    {
        $workbook = $event->sheet->getParent();
        
        $purchaseSalesSheet = new \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet($workbook, 'Purchase vs Sales');
        $workbook->addSheet($purchaseSalesSheet);
        
        // Setup header
        $purchaseSalesSheet->setCellValue('A1', 'PERBANDINGAN PURCHASE VS SALES');
        $purchaseSalesSheet->mergeCells('A1:G1');
        $purchaseSalesSheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16, 'color' => ['argb' => '4F46E5']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        
        // Merge cell untuk filter info
        $purchaseSalesSheet->mergeCells('A3:A6');
        $purchaseSalesSheet->mergeCells('B3:B6');
        $purchaseSalesSheet->mergeCells('C3:C6');
        $purchaseSalesSheet->mergeCells('D3:D6');

        // Filter info
        $startDate = $this->params['start_date'] ?? '';
        $endDate = $this->params['end_date'] ?? '';
        
        $purchaseSalesSheet->setCellValue('A3', 'Periode:');
        $purchaseSalesSheet->setCellValue('B3', $this->formatDateExcel($startDate) . ' s/d ' . $this->formatDateExcel($endDate));
        $purchaseSalesSheet->setCellValue('C3', 'Jumlah Data:');
        $purchaseSalesSheet->setCellValue('D3', count($this->data['transaction_summary']) . ' hari');
        $purchaseSalesSheet->setCellValue('A4', 'Tanggal Export:');
        $purchaseSalesSheet->setCellValue('B4', date('d F Y H:i:s'));
        
        // Format filter info
        $purchaseSalesSheet->getStyle('A3:A6')->applyFromArray([
            'font' => ['bold' => true],
            'alignment' => ['vertical' => Alignment::VERTICAL_TOP],
        ]);
        
        $purchaseSalesSheet->getStyle('B3:D6')->applyFromArray([
            'alignment' => ['vertical' => Alignment::VERTICAL_TOP],
        ]);

        // Header tabel (row 8)
        $headers = ['Tanggal', 'Purchase Count', 'Purchase Total (Rp)', 'Sales Count', 'Sales Total (Rp)', 'Selisih (Rp)', 'Diskon (Rp)'];
        foreach ($headers as $index => $header) {
            $col = chr(65 + $index); // A, B, C, ...
            $purchaseSalesSheet->setCellValue($col . '8', $header);
            $purchaseSalesSheet->getStyle($col . '8')->applyFromArray([
                'font' => ['bold' => true],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'E2E8F0'],
                ],
            ]);
        }

        // Data rows
        $row = 9;
        $totalPurchaseCount = 0;
        $totalPurchaseAmount = 0;
        $totalSalesCount = 0;
        $totalSalesAmount = 0;
        $totalDiscount = 0;

        foreach ($this->data['transaction_summary'] as $item) {
            $difference = ($item['sales_total'] ?? 0) - ($item['purchase_total'] ?? 0);
            
            $purchaseSalesSheet->setCellValue('A' . $row, $this->formatDateExcel($item['date'] ?? ''));
            $purchaseSalesSheet->setCellValue('B' . $row, $item['purchase_count'] ?? 0);
            $purchaseSalesSheet->setCellValue('C' . $row, $item['purchase_total'] ?? 0);
            $purchaseSalesSheet->setCellValue('D' . $row, $item['sales_count'] ?? 0);
            $purchaseSalesSheet->setCellValue('E' . $row, $item['sales_total'] ?? 0);
            $purchaseSalesSheet->setCellValue('F' . $row, $difference);
            $purchaseSalesSheet->setCellValue('G' . $row, $item['total_discount'] ?? 0);

            // Format selisih dengan warna
            $style = $purchaseSalesSheet->getStyle('F' . $row);
            if ($difference >= 0) {
                $style->getFont()->getColor()->setARGB('059669'); // Green
            } else {
                $style->getFont()->getColor()->setARGB('DC2626'); // Red
            }

            // Akumulasi total
            $totalPurchaseCount += $item['purchase_count'] ?? 0;
            $totalPurchaseAmount += $item['purchase_total'] ?? 0;
            $totalSalesCount += $item['sales_count'] ?? 0;
            $totalSalesAmount += $item['sales_total'] ?? 0;
            $totalDiscount += $item['total_discount'] ?? 0;

            $row++;
        }

        // Total row
        $totalDifference = $totalSalesAmount - $totalPurchaseAmount;
        
        $purchaseSalesSheet->setCellValue('A' . $row, 'TOTAL (' . count($this->data['transaction_summary']) . ' hari)');
        $purchaseSalesSheet->setCellValue('B' . $row, $totalPurchaseCount);
        $purchaseSalesSheet->setCellValue('C' . $row, $totalPurchaseAmount);
        $purchaseSalesSheet->setCellValue('D' . $row, $totalSalesCount);
        $purchaseSalesSheet->setCellValue('E' . $row, $totalSalesAmount);
        $purchaseSalesSheet->setCellValue('F' . $row, $totalDifference);
        $purchaseSalesSheet->setCellValue('G' . $row, $totalDiscount);

        // Style untuk total row
        $purchaseSalesSheet->getStyle('A' . $row . ':G' . $row)->applyFromArray([
            'font' => ['bold' => true],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'E0E7FF'],
            ],
        ]);

        // Border untuk seluruh tabel (dari row 8 sampai akhir)
        $lastRow = $row;
        $purchaseSalesSheet->getStyle('A8:G' . $lastRow)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => '000000'],
                ],
            ],
        ]);

        // Border khusus untuk header tabel
        $purchaseSalesSheet->getStyle('A8:G8')->applyFromArray([
            'borders' => [
                'bottom' => [
                    'borderStyle' => Border::BORDER_MEDIUM,
                    'color' => ['argb' => '4F46E5'],
                ],
            ],
        ]);

        // Format angka sebagai currency
        $currencyColumns = ['C', 'E', 'F', 'G']; // Kolom dengan nilai uang
        for ($i = 9; $i <= $lastRow; $i++) {
            foreach ($currencyColumns as $col) {
                $cell = $col . $i;
                $purchaseSalesSheet->getStyle($cell)->getNumberFormat()->setFormatCode('#,##0');
            }
        }
        
        // Format angka untuk count columns
        $countColumns = ['B', 'D']; // Purchase Count dan Sales Count
        for ($i = 9; $i <= $lastRow; $i++) {
            foreach ($countColumns as $col) {
                $cell = $col . $i;
                $purchaseSalesSheet->getStyle($cell)->getNumberFormat()->setFormatCode('#,##0');
            }
        }

        // Auto size kolom
        foreach (range('A', 'G') as $col) {
            $purchaseSalesSheet->getColumnDimension($col)->setAutoSize(true);
        }
        
        // Set lebar kolom
        $purchaseSalesSheet->getColumnDimension('A')->setWidth(25); // Tanggal
        $purchaseSalesSheet->getColumnDimension('B')->setWidth(15); // Purchase Count
        $purchaseSalesSheet->getColumnDimension('C')->setWidth(20); // Purchase Total
        $purchaseSalesSheet->getColumnDimension('D')->setWidth(15); // Sales Count
        $purchaseSalesSheet->getColumnDimension('E')->setWidth(20); // Sales Total
        $purchaseSalesSheet->getColumnDimension('F')->setWidth(20); // Selisih
        $purchaseSalesSheet->getColumnDimension('G')->setWidth(20); // Diskon
        
        // Alignment untuk angka
        $purchaseSalesSheet->getStyle('B9:G' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $purchaseSalesSheet->getStyle('B9:G' . $lastRow)->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        
        // Height untuk header tabel
        $purchaseSalesSheet->getRowDimension(8)->setRowHeight(25);
    }

    protected function formatDateExcel(string $date): string
    {
        if (empty($date)) return '';
        
        try {
            $carbon = \Carbon\Carbon::parse($date);
            return $carbon->translatedFormat('l, d F Y'); // Senin, 23 Januari 2026
        } catch (\Exception $e) {
            return $date;
        }
    }
}