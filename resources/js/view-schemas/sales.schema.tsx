import { ViewSchema } from '@/hooks/use-view-schema';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const salesViewSchema: ViewSchema = {
  title: (data) => `Detail Transaksi ${data.sales_invoice_code}`,
  description: () => 'Informasi lengkap transaksi penjualan',

  sections: [
    {
      title: 'Informasi Transaksi',
      fields: [
        {
          label: 'Kode Invoice',
          key: 'sales_invoice_code',
          type: 'code',
        },
        {
          label: 'Tanggal Transaksi',
          key: 'sales_date',
          value: (data) => formatDateTime(data.sales_date),
        },
        {
          label: 'Status',
          key: 'sales_status',
          type: 'status',
          options: {
            labels: {
              1: 'Paid',
              0: 'Cancelled',
            },
          },
        },
      ],
    },

    {
      title: 'Informasi Pelanggan',
      fields: [
        {
          label: 'Nama Pelanggan',
          key: 'customer_name',
          value: (data) =>
            data.customer_name ??
            (data.member_code ? `Member (${data.member_code})` : '-'),
        },
        {
          label: 'Kode Member',
          key: 'member_code',
          value: (data) => data.member_code ?? '-',
        },
      ],
    },

    {
      title: 'Pembayaran',
      fields: [
        {
          label: 'Metode Pembayaran',
          key: 'sales_payment_method',
          value: (data) =>
            ({
              cash: 'Cash',
              debit: 'Debit',
              qris: 'QRIS',
            } as Record<string, string>)[data.sales_payment_method],
        },
        {
          label: 'Subtotal',
          key: 'sales_subtotal',
          value: (data) => formatCurrency(data.sales_subtotal),
        },
        {
          label: 'Diskon',
          key: 'sales_hasil_discount_value',
          value: (data) =>
            `- ${formatCurrency(data.sales_hasil_discount_value)} (${data.sales_discount_value}%)`,
        },
        {
          label: 'Grand Total',
          key: 'sales_grand_total',
          value: (data) => formatCurrency(data.sales_grand_total),
        },
      ],
    },

    {
      title: 'Item Dibeli',
      fields: [
        {
          label: 'Daftar Item',
          key: 'items',
          value: (data) =>
            data.items
              .map(
                (item: any) =>
                  `${item.item_name} × ${item.sales_quantity}`
              )
              .join(', '),
        },
        {
          label: 'Total Item',
          key: 'items',
          value: (data) =>
            data.items.reduce(
              (total: number, item: any) =>
                total + item.sales_quantity,
              0
            ),
        },
      ],
    },
  ],
};
