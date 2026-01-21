import { ViewSchema } from '@/hooks/use-view-schema';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

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
          value: (data) =>
            data.sales_status ? (
              <Badge className="bg-green-100 text-green-800 flex items-center gap-1" variant="outline">
                <CheckCircle className="h-3 w-3" />
                Paid
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800 flex items-center gap-1" variant="outline">
                <XCircle className="h-3 w-3" />
                Cancelled
              </Badge>
            ),
        },
      ],
    },

    {
      title: 'Informasi Pelanggan',
      fields: [
        {
          label: 'Nama Pelanggan',
          key: 'customer_name',
          value: (data) => {
            // 1️⃣ Kalau input manual customer_name
            if (data.customer_name) return data.customer_name;

            // 2️⃣ Kalau member → ambil nama member
            if (data.member) return data.member.member_name;

            // 3️⃣ Fallback
            return '-';
          },
        },
        {
          label: 'Kode Member',
          key: 'member_code',
          value: (data) => data.member_code ?? '-',
        },
        {
          label: 'Status Member',
          key: 'member_status',
          value: (data) => {
            if (!data.member_code) return '-';

            console.log('SALE DATA:', data);

            const status = data.member?.member_status;

            if (!status) {
              return (
                <Badge className="bg-gray-100 text-gray-800" variant="outline">
                  Tidak diketahui
                </Badge>
              );
            }

            return status === 'active' ? (
              <Badge className="bg-green-100 text-green-800 flex items-center gap-1" variant="outline">
                <CheckCircle className="h-3 w-3" />
                Aktif
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800 flex items-center gap-1" variant="outline">
                <XCircle className="h-3 w-3" />
                Nonaktif
              </Badge>
            );
          },
        }
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
              credit: 'Credit Card',
              transfer: 'Bank Transfer',
              ewallet: 'E-Wallet',
            } as Record<string, string>)[data.sales_payment_method] || data.sales_payment_method,
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
            Array.isArray(data.items) && data.items.length > 0
              ? data.items
                  .map(
                    (item: any) =>
                      `${item.item_name} × ${item.sales_quantity}`
                  )
                  .join(', ')
              : '-',
        },
        {
          label: 'Total Item',
          key: 'items',
          value: (data) =>
            Array.isArray(data.items)
              ? data.items.reduce(
                  (total: number, item: any) =>
                    total + item.sales_quantity,
                  0
                )
              : 0,
        },
      ],
    },
  ],
};