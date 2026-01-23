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

class ReportExport implements FromArray, WithHeadings, WithStyles, WithEvents, WithTitle
{
    protected array $data;
    protected array $params;
    protected array $totals;

    public function __construct(array $data, array $params = [], array $totals = [])
    {
        $this->data = $data;
        $this->params = $params;
        $this->totals = $totals;
    }

    public function title(): string
    {
        return 'Laporan Transaksi';
    }

    public function headings(): array
    {
        $typeLabels = [
            'all' => 'Semua Transaksi',
            'sales' => 'Sales (Penjualan)',
            'purchase' => 'Purchase (Pembelian)'
        ];

        $customerTypeLabels = [
            'all' => 'Semua Customer',
            'member' => 'Member',
            'nonmember' => 'Non-Member'
        ];

        // Format periode
        $startDate = $this->params['start_date'] ?? '';
        $endDate = $this->params['end_date'] ?? '';
        
        $periodeText = 'Semua Periode';
        if (!empty($startDate) && !empty($endDate)) {
            if ($startDate === $endDate) {
                $periodeText = $this->formatDateExcel($startDate);
            } else {
                $periodeText = $this->formatDateExcel($startDate) . ' - ' . $this->formatDateExcel($endDate);
            }
        } elseif (!empty($startDate)) {
            $periodeText = 'Sejak ' . $this->formatDateExcel($startDate);
        } elseif (!empty($endDate)) {
            $periodeText = 'Hingga ' . $this->formatDateExcel($endDate);
        }

        return [
            ['LAPORAN TRANSAKSI'],
            [''],
            ['', 'Periode', $periodeText],
            ['', 'Jenis Transaksi', ($typeLabels[$this->params['type'] ?? 'all'] ?? 'Semua Transaksi')],
            ['', 'Jenis Customer', ($customerTypeLabels[$this->params['customer_type'] ?? 'all'] ?? 'Semua Customer')],
            ['', 'Member Terpilih', ($this->params['member_code'] ?? '-')],
            [''],
            ['', 'Total Transaksi', ($this->totals['total_transactions'] ?? count($this->data)) . ' transaksi'],
            ['', 'Total Subtotal', 'Rp ' . number_format($this->totals['total_subtotal'] ?? 0, 0, ',', '.')],
            ['', 'Total Diskon', 'Rp ' . number_format($this->totals['total_discount'] ?? 0, 0, ',', '.')],
            ['', 'Total Amount', 'Rp ' . number_format($this->totals['total_amount'] ?? 0, 0, ',', '.')],
            ['', 'Member', ($this->totals['member_count'] ?? 0) . ' transaksi'],
            ['', 'Non-Member', ($this->totals['non_member_count'] ?? 0) . ' transaksi'],
            ['', 'Tanggal Export', date('d F Y H:i:s')],
            [''],
            [''],
            [
                'No',
                'Tanggal',
                'No Invoice',
                'Customer',
                'Subtotal (Rp)',
                'Diskon (Rp)',
                'Grand Total (Rp)',
                'Metode Bayar',
                'Status'
            ]
        ];
    }

    public function array(): array
    {
        $rows = [];
        
        foreach ($this->data as $index => $item) {
            // Gabung customer name dengan member code
            $customerDisplay = $item['customer_name'] ?? '-';
            if (!empty($item['member_code'])) {
                $customerDisplay .= ' (Member: ' . $item['member_code'] . ')';
            }

            $rows[] = [
                $index + 1,
                $this->formatDateExcel($item['date'] ?? ''),
                $item['invoice_code'] ?? '',
                $customerDisplay,
                $item['subtotal'] ?? 0,
                $item['discount'] ?? 0,
                $item['total_amount'] ?? 0,
                $this->formatPaymentMethod($item['payment_method'] ?? ''),
                $this->formatStatus($item['status'] ?? '')
            ];
        }

        // Total row
        if (!empty($rows)) {
            $totalTransactions = $this->totals['total_transactions'] ?? count($this->data);
            $memberCount = $this->totals['member_count'] ?? 0;
            $nonMemberCount = $this->totals['non_member_count'] ?? 0;
            
            $rows[] = [
                '',
                'TOTAL',
                $totalTransactions . ' transaksi (Member: ' . $memberCount . ', Non-Member: ' . $nonMemberCount . ')',
                '',
                $this->totals['total_subtotal'] ?? 0,
                $this->totals['total_discount'] ?? 0,
                $this->totals['total_amount'] ?? 0,
                '',
                ''
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

            // Filter info
            3 => ['font' => ['bold' => true]],
            4 => ['font' => ['bold' => true]],
            5 => ['font' => ['bold' => true]],
            6 => ['font' => ['bold' => true]],
            8 => ['font' => ['bold' => true]],
            9 => ['font' => ['bold' => true]],
            10 => ['font' => ['bold' => true]],
            11 => ['font' => ['bold' => true]],
            12 => ['font' => ['bold' => true]],
            13 => ['font' => ['bold' => true]],
            14 => ['font' => ['bold' => true]],

            // Header tabel (row 17)
            17 => [
                'font' => ['bold' => true],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['argb' => '4F46E5'],
                    'color' => ['argb' => 'FFFFFF'],
                ],
            ],
        ];

        // Style untuk total row
        if ($lastRow > 17) {
            $styles[$lastRow] = [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'E0E7FF'],
                ],
            ];
        }

        // Border untuk tabel
        if ($lastRow > 17) {
            $styles["A17:{$lastCol}{$lastRow}"] = [
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['argb' => '000000'],
                    ],
                ],
            ];
        }

        // Merge header utama
        $sheet->mergeCells('A1:I1');

        // Set width kolom
        $sheet->getColumnDimension('A')->setWidth(6);   // No
        $sheet->getColumnDimension('B')->setWidth(18);  // Tanggal
        $sheet->getColumnDimension('C')->setWidth(20);  // No Invoice
        $sheet->getColumnDimension('D')->setWidth(30);  // Customer
        $sheet->getColumnDimension('E')->setWidth(18);  // Subtotal
        $sheet->getColumnDimension('F')->setWidth(18);  // Diskon
        $sheet->getColumnDimension('G')->setWidth(18);  // Grand Total
        $sheet->getColumnDimension('H')->setWidth(15);  // Metode Bayar
        $sheet->getColumnDimension('I')->setWidth(12);  // Status

        return $styles;
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $lastRow = $sheet->getHighestRow();

                // Format angka untuk kolom E, F, G (Subtotal, Diskon, Grand Total)
                if ($lastRow > 17) {
                    for ($row = 18; $row <= $lastRow; $row++) {
                        $sheet->getStyle('E' . $row)->getNumberFormat()->setFormatCode('#,##0');
                        $sheet->getStyle('F' . $row)->getNumberFormat()->setFormatCode('#,##0');
                        $sheet->getStyle('G' . $row)->getNumberFormat()->setFormatCode('#,##0');
                    }

                    // Alignment
                    $sheet->getStyle('E18:G' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                    $sheet->getStyle('H18:I' . $lastRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                }
            },
        ];
    }

    protected function formatDateExcel(?string $date): string
    {
        if (empty($date)) return '';
        
        try {
            $carbon = \Carbon\Carbon::parse($date);
            return $carbon->translatedFormat('d M Y');
        } catch (\Exception $e) {
            return $date;
        }
    }

    protected function formatPaymentMethod(?string $method): string
    {
        if (empty($method)) return '-';
        
        return ucwords(str_replace('_', ' ', strtolower($method)));
    }

    protected function formatStatus(?string $status): string
    {
        if ($status === '1' || $status === 'Paid') {
            return 'Paid';
        }
        return 'Cancelled';
    }
}