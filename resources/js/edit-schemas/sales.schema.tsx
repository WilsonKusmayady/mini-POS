// Di file: edit-schemas/sales.schema.tsx
import { FormSchema } from '@/types/form-schema';
import { SalesItemsEditor } from '@/components/sales/SalesItemEditor'; // Tambahkan import ini

export interface SalesItemFormData {
  item_code: string;
  item_name?: string;
  sales_quantity: number;
  sell_price: number;
  sales_discount_item: number;
  sales_hasil_diskon_item: number;
  total_item_price: number;
  stock?: number;
  unit?: string;
}

export interface SalesFormData {
  sales_invoice_code: string;
  customer_name: string;
  member_code?: string;
  member_name?: string;
  sales_date: string;
  sales_subtotal: number;
  sales_discount_value: number;
  sales_grand_total: number;
  sales_payment_method: 'cash' | 'debit' | 'qris';
  sales_status: boolean;
  items: SalesItemFormData[];
  can_edit_member?: boolean;
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
      label: 'Kode Member',

      // ✅ tampil HANYA jika ada member
      visible: (data: SalesFormData) =>
        !!data.member_code && data.member_code !== '',

      // 🔒 selalu disable (tidak bisa diedit)
      disabled: true,

    },
    {
      name: 'sales_date',
      type: 'date',
      label: 'Tanggal Transaksi',
      required: true,
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
      name: 'items',
      type: 'custom',
      label: 'Items',
      render: (value, onChange) => {
        return (
          <SalesItemsEditor 
            value={value as SalesItemFormData[]} 
            onChange={onChange} 
          />
        );
      },
    },
  ],
};