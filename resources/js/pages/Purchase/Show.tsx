import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Printer, MapPin, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// --- Interface Data ---
interface DetailItem {
    item_code: string;
    quantity: number;
    buy_price: number;
    purchase_discount_item: number;
    total_item_price: number;
    item?: {
        item_name: string;
    }
}

interface PurchaseDetail {
    purchase_invoice_number: string;
    purchase_date: string;
    purchase_grand_total: number;
    purchase_status: string;
    supplier?: {
        supplier_name: string;
        supplier_address?: string;
        supplier_phone?: string;
    };
    user?: {
        user_name: string;
    };
    details: DetailItem[];
}

interface ShowProps {
    purchase: PurchaseDetail;
}

export default function PurchaseShow({ purchase }: ShowProps) {
    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    const formatDate = (dateString: string) => 
        new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Pembelian', href: route('purchases.index') },
        { title: 'Detail Transaksi', href: '#' }
    ];

    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail ${purchase.purchase_invoice_number}`} />
            
            {/* --- CSS KHUSUS PRINT (SOLUSI CUT-OFF) --- */}
            <style>{`
                @media print {
                    /* 1. RESET LAYOUT DASHBOARD YANG BIKIN KEPOTONG */
                    html, body, #app, main, div[class*="scroll"], .overflow-hidden {
                        overflow: visible !important;
                        height: auto !important;
                        position: static !important;
                        display: block !important;
                    }

                    /* 2. SEMBUNYIKAN UI WEBSITE (Sidebar, Navbar, dll) */
                    body * {
                        visibility: hidden;
                    }

                    /* 3. TAMPILKAN AREA INVOICE */
                    #invoice-print-area, #invoice-print-area * {
                        visibility: visible;
                    }

                    /* 4. POSISIKAN INVOICE DI POJOK KIRI ATAS */
                    #invoice-print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 20px;
                        background: white;
                        z-index: 99999;
                    }

                    /* 5. ATUR HALAMAN KERTAS */
                    @page { 
                        size: auto; 
                        margin: 5mm; 
                    }

                    /* Mencegah baris tabel terpotong di tengah text */
                    tr {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
            
            {/* TAMPILAN MONITOR (Tidak Terubah) */}
            <div className="flex h-full flex-1 flex-col gap-4 p-4 print:hidden">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href={route('purchases.index')}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Detail Pembelian</h2>
                            <p className="text-sm text-muted-foreground">
                                No. Invoice: <span className="font-mono font-medium text-foreground">{purchase.purchase_invoice_number}</span>
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak Invoice
                    </Button>
                </div>

                {/* Konten Detail Screen View */}
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader><CardTitle>Informasi Transaksi</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1"><Label className="text-muted-foreground">Supplier</Label><div className="font-medium text-lg">{purchase.supplier?.supplier_name || '-'}</div></div>
                                    <div className="space-y-1"><Label className="text-muted-foreground">Tanggal</Label><div className="font-medium">{formatDate(purchase.purchase_date)}</div></div>
                                    <div className="space-y-1"><Label className="text-muted-foreground">Operator</Label><div className="font-medium">{purchase.user?.user_name || '-'}</div></div>
                                    <div className="space-y-1"><Label className="text-muted-foreground">Status</Label><div><Badge variant={purchase.purchase_status === 'paid' ? 'default' : 'secondary'}>{purchase.purchase_status.toUpperCase()}</Badge></div></div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="flex flex-col justify-center items-center bg-muted/50 border-dashed">
                            <CardContent className="text-center pt-6">
                                <h3 className="text-lg font-medium text-muted-foreground">Grand Total</h3>
                                <p className="text-4xl font-bold text-primary mt-2">{formatCurrency(Number(purchase.purchase_grand_total))}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader><CardTitle>Rincian Barang</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[30%]">Barang</TableHead>
                                        <TableHead className="w-[20%]">Harga Beli</TableHead>
                                        <TableHead className="w-[10%]">Qty</TableHead>
                                        <TableHead className="w-[15%]">Diskon</TableHead>
                                        <TableHead className="w-[25%] text-right">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchase.details.map((detail, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div className="flex flex-col"><span className="font-medium">{detail.item?.item_name || 'Item dihapus'}</span><span className="text-xs text-muted-foreground font-mono">{detail.item_code}</span></div>
                                            </TableCell>
                                            <TableCell>{formatCurrency(Number(detail.buy_price))}</TableCell>
                                            <TableCell>{detail.quantity}</TableCell>
                                            <TableCell>{Number(detail.purchase_discount_item) > 0 ? <span className="text-red-600 font-medium">{detail.purchase_discount_item}%</span> : '-'}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(Number(detail.total_item_price))}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* --- TEMPLATE CETAK (INVOICE) --- */}
            <div id="invoice-print-area" className="hidden print:block text-black p-8">
                
                {/* Header Invoice */}
                <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold uppercase tracking-widest text-black">INVOICE</h1>
                        <p className="text-sm font-bold mt-1 text-gray-600">PEMBELIAN BARANG</p>
                        
                        <div className="mt-4 text-sm">
                            <p className="font-bold text-lg">Kasir Online Indonesia</p>
                            <div className="flex items-center gap-1 text-gray-600"><MapPin className="h-3 w-3" /> Jl. Pucang Anom Timur III No.12</div>
                            <div className="flex items-center gap-1 text-gray-600"><Phone className="h-3 w-3" /> 0812-3456-7890</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-mono font-bold text-black">{purchase.purchase_invoice_number}</h2>
                        <p className="text-sm mt-1 mb-2">Tanggal: {formatDate(purchase.purchase_date)}</p>
                        
                        <div className="inline-block border-2 border-black px-4 py-1">
                            <span className="text-lg font-bold uppercase tracking-wider">{purchase.purchase_status}</span>
                        </div>
                    </div>
                </div>

                {/* Info Supplier */}
                <div className="flex justify-between mb-8 gap-8">
                    <div className="w-1/2">
                        <h3 className="font-bold border-b border-gray-300 mb-2 pb-1 text-sm uppercase text-gray-600">SUPPLIER (DARI)</h3>
                        <p className="text-lg font-bold">{purchase.supplier?.supplier_name || 'Umum'}</p>
                        {purchase.supplier?.supplier_address && <p className="text-sm text-gray-600">{purchase.supplier.supplier_address}</p>}
                    </div>
                    <div className="w-1/2">
                        <h3 className="font-bold border-b border-gray-300 mb-2 pb-1 text-sm uppercase text-gray-600">PENERIMA (KEPADA)</h3>
                        <p className="font-bold">Gudang Utama - Kasir Online Indonesia</p>
                        <p className="text-sm text-gray-600">Admin: {purchase.user?.user_name}</p>
                    </div>
                </div>

                {/* Tabel Barang (Menggunakan table biasa agar support multi-page header) */}
                <table className="w-full text-sm border-collapse mb-6">
                    <thead className="table-header-group"> {/* Class ini penting agar header diulang di halaman baru */}
                        <tr className="border-b-2 border-black bg-gray-50">
                            <th className="py-2 pl-2 text-left w-[40%] font-bold text-black">Deskripsi Barang</th>
                            <th className="py-2 text-right w-[15%] font-bold text-black">Harga</th>
                            <th className="py-2 text-center w-[10%] font-bold text-black">Qty</th>
                            <th className="py-2 text-center w-[10%] font-bold text-black">Disc</th>
                            <th className="py-2 pr-2 text-right w-[25%] font-bold text-black">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchase.details.map((detail, index) => (
                            <tr key={index} className="border-b border-gray-200">
                                <td className="py-2 pl-2 align-top">
                                    <p className="font-bold text-black">{detail.item?.item_name}</p>
                                    <p className="text-xs text-gray-500 font-mono">{detail.item_code}</p>
                                </td>
                                <td className="py-2 text-right align-top">{formatCurrency(Number(detail.buy_price))}</td>
                                <td className="py-2 text-center align-top">{detail.quantity}</td>
                                <td className="py-2 text-center align-top text-red-600">
                                    {Number(detail.purchase_discount_item) > 0 ? `${detail.purchase_discount_item}%` : '-'}
                                </td>
                                <td className="py-2 pr-2 text-right align-top font-bold">{formatCurrency(Number(detail.total_item_price))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Total Section */}
                <div className="flex justify-end break-inside-avoid">
                    <div className="w-1/2 md:w-1/3">
                        <div className="flex justify-between py-2 border-t-2 border-black text-lg font-bold bg-gray-50">
                            <span className="pl-2">Grand Total</span>
                            <span className="pr-2">{formatCurrency(Number(purchase.purchase_grand_total))}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 grid grid-cols-2 gap-8 text-center text-sm break-inside-avoid">
                    <div>
                        <p className="mb-20">Diterima Oleh,</p>
                        <p className="font-bold border-t border-black inline-block px-8 pt-1">
                            ( {purchase.user?.user_name || '...................'} )
                        </p>
                    </div>
                    <div>
                        <p className="mb-20">Disetujui Oleh,</p>
                        <p className="font-bold border-t border-black inline-block px-8 pt-1">
                            ( ........................... )
                        </p>
                    </div>
                </div>
                
                <div className="mt-8 text-center text-[10px] text-gray-400 border-t pt-2">
                    Dicetak pada: {new Date().toLocaleString('id-ID')} | System ID: {purchase.purchase_invoice_number}
                </div>
            </div>
        </AppLayout>
    );
}