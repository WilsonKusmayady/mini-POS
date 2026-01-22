import { useRef, useState } from 'react'
import { usePage, Head } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Printer, Download, ArrowLeft } from 'lucide-react'
import { NotaTemplate } from '@/components/nota/NotaTemplate'
import { useReactToPrint } from 'react-to-print'
import { toast } from 'sonner'

interface Sale {
  sales_invoice_code: string
  sales_date: string
  customer_name: string | null
  member_code: string | null
  member?: {
    member_code: string
    member_name: string
  } | null
  sales_subtotal: number
  sales_discount_value: number
  sales_hasil_discount_value: number
  sales_grand_total: number
  sales_payment_method: 'cash' | 'debit' | 'qris'
  items: Array<{
    item_name: string
    sales_quantity: number
    sell_price: number
    sales_discount_item: number
    sales_hasil_diskon_item: number
    total_item_price: number
  }>
}

interface CompanyInfo {
  name: string
  address: string
  phone: string
  footerNote: string
}

export default function NotaPage() {
  const [isPrinting, setIsPrinting] = useState(false);

  const { sale, companyInfo } = usePage<{
    sale: Sale
    companyInfo: CompanyInfo
  }>().props

  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Nota-${sale.sales_invoice_code}`,
    pageStyle: `
      @page {
        size: 105mm 160mm;
        margin: 5mm;
      }
      @media print {
        body {
          margin: 0;
        }
      }
    `,
    onBeforePrint: () => {
        setIsPrinting(true);
        toast.info('Membuka dialog cetak...');
        return Promise.resolve();
    },
        onAfterPrint: () => {
        setIsPrinting(false);
        return Promise.resolve();
    },
  })

//   const handleDownloadPDF = () => {
//     toast.info('Fitur download PDF menyusul 😄')
//   }

  return (
    <>
      <Head title={`Nota ${sale.sales_invoice_code}`} />

      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <div>
            <h1 className="text-xl font-bold">Nota Penjualan</h1>
            <p className="text-sm text-muted-foreground">
              Invoice: {sale.sales_invoice_code}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
{/* 
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button> */}

            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Nota
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center">
          {/* Wrapper supaya nota di tengah */}
          <div className="bg-white shadow-lg p-4">
            <div ref={printRef}>
                <NotaTemplate
                    sale={{
                        sales_invoice_code: sale.sales_invoice_code,
                        sales_date: sale.sales_date,
                        customer_name:
                        sale.customer_name ??
                        sale.member?.member_name ??
                        'Umum',

                        member_code: sale.member_code ?? undefined,
                        member_name: sale.member?.member_name ?? undefined,

                        // 🚨🚨🚨 INI NIH MASALAHNYA
                        sales_subtotal: sale.sales_subtotal,
                        sales_discount_value: sale.sales_discount_value,
                        sales_hasil_discount_value: sale.sales_hasil_discount_value,

                        sales_grand_total: sale.sales_grand_total,
                        sales_payment_method: 'cash',

                        items: sale.items,
                    }}
                />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
