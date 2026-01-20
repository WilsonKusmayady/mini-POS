// filter-schemas/sales.schema.ts
import { FilterSchema } from '@/components/ui/filter-modal';

export const salesFilterSchema: FilterSchema = {
    title: 'Filter Transaksi Penjualan',
    description: 'Pilih kriteria filter untuk menyaring data transaksi penjualan',
    fields: [
        {
            key: 'status',
            label: 'Status Transaksi',
            type: 'radio',
            defaultValue: '',
            options: [
                { value: '', label: 'Semua Status' },
                { value: '1', label: 'Paid' },
                { value: '0', label: 'Cancelled' },
            ]
        },
        {
            key: 'payment_method',
            label: 'Metode Pembayaran',
            type: 'radio',
            defaultValue: '',
            options: [
                { value: '', label: 'Semua Metode' },
                { value: 'cash', label: 'Cash' },
                { value: 'debit', label: 'Debit' },
                { value: 'qris', label: 'QRIS' },
            ]
        },
        {
            key: 'sales_date',
            label: 'Tanggal Transaksi',
            type: 'date-range',
            placeholder: 'Pilih rentang tanggal'
        }
    ]
};

// Helper untuk mengkonversi filter ke query params sesuai backend
export const convertSalesFiltersToParams = (filters: any) => {
    const params: any = {};
    
    // Status: ubah dari string ke integer jika ada
    if (filters.status !== undefined && filters.status !== '') {
        params.status = parseInt(filters.status);
    }
    
    // Payment method: hanya jika tidak kosong
    if (filters.payment_method && filters.payment_method !== '') {
        params.payment_method = filters.payment_method;
    }
    
    // Tanggal: sesuai format backend
    if (filters.sales_date_start) {
        params.start_date = filters.sales_date_start;
    }
    
    if (filters.sales_date_end) {
        params.end_date = filters.sales_date_end;
    }
    
    return params;
};