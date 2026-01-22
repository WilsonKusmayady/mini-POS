// components/nota/PrintNota.tsx - versi alternatif
import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { NotaTemplate } from './NotaTemplate';

interface PrintNotaProps {
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
  onPrintStart?: () => void;
  onPrintComplete?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  buttonText?: string;
  showIcon?: boolean;
}

export function PrintNota({
  sale,
  companyInfo,
  onPrintStart,
  onPrintComplete,
  variant = 'outline',
  size = 'sm',
  className = '',
  buttonText = 'Print',
  showIcon = true,
}: PrintNotaProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Cara yang lebih baru dengan async/await
  const handlePrint = async () => {
    setIsPrinting(true);
    onPrintStart?.();
    
    try {
      // Simulasi delay untuk persiapan
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Trigger print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Nota ${sale.sales_invoice_code}</title>
              <style>
                @page {
                  size: 105mm 160mm;
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                  font-family: 'Courier New', monospace;
                }
                .print-nota {
                  width: 105mm;
                  min-height: 160mm;
                  padding: 5mm;
                  background: white;
                }
              </style>
            </head>
            <body>
              <div id="print-content"></div>
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(() => window.close(), 1000);
                };
              </script>
            </body>
          </html>
        `);
        
        // Render template ke window baru
        const content = printWindow.document.getElementById('print-content');
        if (content) {
          // Create temporary div untuk render
          const tempDiv = printWindow.document.createElement('div');
          tempDiv.className = 'print-nota';
          // Isi dengan HTML dari NotaTemplate
          tempDiv.innerHTML = document.querySelector('.nota-template')?.innerHTML || '';
          content.appendChild(tempDiv);
        }
      }
    } catch (error) {
      console.error('Print error:', error);
    } finally {
      setIsPrinting(false);
      onPrintComplete?.();
    }
  };

  // Simpan template untuk di-copy
  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handlePrint}
        disabled={isPrinting}
        className={`flex items-center gap-2 ${className}`}
      >
        {isPrinting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : showIcon ? (
          <Printer className="mr-2 h-4 w-4" />
        ) : null}
        {buttonText}
      </Button>

      {/* Hidden template untuk di-copy */}
      <div style={{ display: 'none' }} className="nota-template">
        <NotaTemplate ref={componentRef} sale={sale} companyInfo={companyInfo} />
      </div>
    </>
  );
}