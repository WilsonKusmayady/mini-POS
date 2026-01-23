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

class PurchaseExport implements FromArray, WithHeadings, WithStyles, WithEvents, WithTitle
{
    protected array $data;
    protected array $params;

    public function __construct(array $data, array $params = [])
    {
        $this->data = $data;
        $this->params = $params;
    }

    public function title(): string
    {
        return 'Laporan Pembelian';
    }

    public function headings(): array
    {
        return [
            ['LAPORAN TRANSAKSI PEMBELIAN'], // Row 1
            [''], // Row 2
            ['Periode Tanggal'], // Row 3
            ['Supplier'], // Row 4
            ['Tanggal Export'], // Row 5
            [''], // Row 6
            [ // Row 7 (Header Tabel)
                'No. Invoice',
                'Tanggal',
                'Supplier',
                'Operator',
                'Status',
                'Jml Item',
                'Total (Rp)',
            ]
        ];
    }

    public function array(): array
    {
        $rows = [];
        $totalAmount = 0;

        foreach ($this->data as $row) {
            // Kita bersihkan format number_format (hapus titik) agar dikenali Excel sebagai angka
            $numericTotal = (float) str_replace(['.', ','], '', $row['grand_total']);
            $totalAmount += $numericTotal;

            $rows[] = [
                $row['invoice_number'],
                $row['date'],
                $row['supplier_name'],
                $row['user_name'],
                $row['status'],
                $row['items_count'],
                $numericTotal, // Kirim raw number untuk Excel
            ];
        }

        // Row Total
        $rows[] = [
            'TOTAL',
            '',
            '',
            '',
            '',
            '',
            $totalAmount
        ];

        return $rows;
    }

    public function styles(Worksheet $sheet)
    {
        $lastRow = $sheet->getHighestRow();

        return [
            1 => [
                'font' => ['bold' => true, 'size' => 14, 'color' => ['argb' => '4F46E5']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
            7 => [ // Header Table
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => '4F46E5']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
            $lastRow => [ // Row Total Footer
                'font' => ['bold' => true],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'E0E7FF']],
            ]
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                
                // Merge Title
                $sheet->mergeCells('A1:G1');

                // Isi Metadata Filter
                $startDate = $this->params['start_date'] ?? '-';
                $endDate = $this->params['end_date'] ?? '-';
                
                $sheet->setCellValue('B3', ': ' . $startDate . ' s/d ' . $endDate);
                $sheet->setCellValue('B4', ': ' . ($this->params['supplier_name'] ?? 'Semua Supplier'));
                $sheet->setCellValue('B5', ': ' . date('d F Y H:i'));

                // Formatting Auto Size Column
                foreach (range('A', 'G') as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }

                // Borders
                $lastRow = $sheet->getHighestRow();
                $sheet->getStyle('A7:G' . $lastRow)->applyFromArray([
                    'borders' => [
                        'allBorders' => ['borderStyle' => Border::BORDER_THIN],
                    ],
                ]);

                // Number Format Currency (Kolom G / Total)
                $sheet->getStyle('G8:G' . $lastRow)->getNumberFormat()->setFormatCode('#,##0');
            },
        ];
    }
}