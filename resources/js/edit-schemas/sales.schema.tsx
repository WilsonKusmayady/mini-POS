// schemas/sales.schema.ts
import { FormSchema } from '@/types/form-schema';

export interface SalesFormData {
  sales_invoice_code: string;
  customer_name: string;
  member_code?: string;
  sales_date: string;
  sales_subtotal: number;
  sales_discount_value: number;
  sales_grand_total: number;
  sales_payment_method: 'cash' | 'debit' | 'qris';
  sales_status: boolean;
}

export const salesEditSchema: FormSchema<SalesFormData> = {
  title: (data) => `Edit Transaksi: ${data.sales_invoice_code}`,
  description: (data) => `Tanggal: ${new Date(data.sales_date).toLocaleDateString('id-ID')}`,
  fields: [
    {
      name: 'sales_invoice_code',
      type: 'text',
      label: 'Kode Invoice',
      required: true,
      disabled: true,
    },
    {
      name: 'customer_name',
      type: 'text',
      label: 'Nama Pelanggan',
      required: true,
      placeholder: 'Masukkan nama pelanggan',
      minLength: 3,
    },
    {
      name: 'member_code',
      type: 'text',
      label: 'Kode Member (Opsional)',
      placeholder: 'Kode member jika ada',
    },
    {
      name: 'sales_date',
      type: 'date',
      label: 'Tanggal Transaksi',
      required: true,
    },
    {
      name: 'sales_subtotal',
      type: 'number',
      label: 'Subtotal',
      required: true,
      min: 0,
      disabled: true,
    },
    {
      name: 'sales_discount_value',
      type: 'number',
      label: 'Diskon Transaksi (%)',
      min: 0,
      max: 100,
      step: 0.01,
      placeholder: '0%',
    },
    {
      name: 'sales_grand_total',
      type: 'number',
      label: 'Grand Total',
      required: true,
      min: 0,
      disabled: true,
    },
    {
      name: 'sales_payment_method',
      type: 'select',
      label: 'Metode Pembayaran',
      required: true,
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'debit', label: 'Debit' },
        { value: 'qris', label: 'QRIS' },
      ],
    },
    {
      name: 'sales_status',
      type: 'checkbox',
      label: 'Status Aktif',
    },
  ],
};