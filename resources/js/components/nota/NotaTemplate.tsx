// components/nota/NotaTemplate.tsx
import React, { forwardRef } from 'react';


interface NotaTemplateProps {
  
  sale: {
    sales_invoice_code: string;
    sales_date: string;
    customer_name: string;
    member_code?: string;
    member_name?: string;
    sales_subtotal: number;
    sales_discount_value: number;
    sales_hasil_discount_value: number;
    sales_grand_total: number;
    sales_payment_method: string;
    items: Array<{
      item_name: string;
      sales_quantity: number;
      sell_price: number;
      sales_discount_item: number;
      sales_hasil_diskon_item: number;
      total_item_price: number;
    }>;
  };
  
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    footerNote?: string;
  };
  showBarcode?: boolean;
  showFooter?: boolean;
}

export const NotaTemplate = forwardRef<HTMLDivElement, NotaTemplateProps>(
  
  ({ sale, companyInfo, showBarcode = true, showFooter = true }, ref) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
    };
  console.log('🧾 SALE DI NOTA:', sale)
  // console.log('DEBUG BACKEND:', props.debug);


    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    // Default company info
    const company = companyInfo || {
      name: 'TOKO RETAIL',
      address: 'Jl. Contoh No. 123, Kota Contoh',
      phone: '0812-3456-7890',
      footerNote: 'Terima kasih telah berbelanja',
    };

    return (
      <div ref={ref} className="print-nota">
        <div className="print-content">
          {/* Header - Informasi Toko */}
          <div className="print-header">
            <div className="company-name">{company.name}</div>
            <div className="company-address">{company.address}</div>
            <div className="company-address">Telp: {company.phone}</div>
          </div>

          {/* Invoice Info */}
          <div className="invoice-info">
            <div style={{ fontWeight: 'bold' }}>NOTA PENJUALAN</div>
            <div>{sale.sales_invoice_code}</div>
            <div>{formatDate(sale.sales_date)}</div>
          </div>

          {/* Customer Info */}
          <div style={{ marginBottom: '10px' }}>
            <div>
              <strong>Pelanggan:</strong> {sale.customer_name || 'Umum'}
            </div>
            {sale.member_code && (
              <div>
                <strong>Member:</strong> {sale.member_name} ({sale.member_code})
              </div>
            )}
          </div>

          {/* Items Table */}
          <table className="table-items">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Item</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Qty</th>
                <th style={{ width: '20%', textAlign: 'right' }}>Harga</th>
                <th style={{ width: '25%', textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    {item.item_name}
                    {item.sales_discount_item > 0 && (
                      <div style={{ fontSize: '80%', color: '#666' }}>
                        Diskon: {item.sales_discount_item}%
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>{item.sales_quantity}</td>
                  <td style={{ textAlign: 'right' }}>
                    {formatCurrency(item.sell_price)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    {formatCurrency(item.total_item_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.sales_subtotal)}</span>
            </div>
            
            {sale.sales_discount_value > 0 && (
              <div className="summary-row">
                <span>Diskon ({sale.sales_discount_value}%):</span>
                <span>-{formatCurrency(sale.sales_hasil_discount_value)}</span>
              </div>
            )}
            
            <div className="summary-row grand-total">
              <span>TOTAL:</span>
              <span>{formatCurrency(sale.sales_grand_total)}</span>
            </div>
            
            <div className="summary-row" style={{ marginTop: '5px' }}>
              <span>Pembayaran:</span>
              <span>
                {sale.sales_payment_method === 'cash' ? 'TUNAI' : 
                 sale.sales_payment_method === 'debit' ? 'DEBIT' : 
                 sale.sales_payment_method === 'qris' ? 'QRIS' : 
                 sale.sales_payment_method.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Footer */}
          {showFooter && (
            <div className="footer">
              {showBarcode && (
                <div className="barcode">
                  *{sale.sales_invoice_code}*
                </div>
              )}
              <div className="thank-you">
                {company.footerNote}
              </div>
              <div style={{ marginTop: '5px', fontSize: '80%' }}>
                Barang yang sudah dibeli tidak dapat dikembalikan
              </div>
            </div>
          )}
        </div>

        <style>
          {`
            .print-content {
              width: 100%;
              max-width: 100%;
            }
            
            .print-header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            
            .company-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 2px;
            }
            
            .company-address {
              font-size: 80%;
              margin-bottom: 2px;
            }
            
            .invoice-info {
              text-align: center;
              margin-bottom: 10px;
            }
            
            .table-items {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            
            .table-items th {
              border-bottom: 1px dashed #000;
              padding: 4px 0;
              text-align: left;
              font-size: 80%;
            }
            
            .table-items td {
              padding: 3px 0;
              font-size: 90%;
            }
            
            .summary {
              border-top: 1px dashed #000;
              padding-top: 10px;
              margin-top: 10px;
            }
            
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            
            .grand-total {
              font-weight: bold;
              border-top: 2px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px dashed #000;
              font-size: 80%;
            }
            
            .barcode {
              margin-top: 5px;
              text-align: center;
              font-family: 'Libre Barcode 39', monospace;
              font-size: 20px;
              letter-spacing: 2px;
            }
            
            .thank-you {
              margin-top: 10px;
              font-style: italic;
            }
          `}
        </style>
      </div>
    );
  }
);

NotaTemplate.displayName = 'NotaTemplate';