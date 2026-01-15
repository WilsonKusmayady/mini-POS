import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Printer } from 'lucide-react';
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
    // Helper Format Currency
    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    // Helper Format Tanggal
    const formatDate = (dateString: string) => 
        new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Pembelian', href: route('purchases.index') },
        { title: 'Detail Transaksi', href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail ${purchase.purchase_invoice_number}`} />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                
                {/* Header: Tombol Kembali & Judul */}
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
                    <Button variant="outline">
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak Invoice
                    </Button>
                </div>

                <div className="space-y-6">
                    
                    {/* Informasi Utama */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Transaksi</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Supplier</Label>
                                        <div className="font-medium text-lg">{purchase.supplier?.supplier_name || '-'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Tanggal</Label>
                                        <div className="font-medium">{formatDate(purchase.purchase_date)}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Operator</Label>
                                        <div className="font-medium">{purchase.user?.user_name || '-'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Status</Label>
                                        <div>
                                            <Badge variant={purchase.purchase_status === 'paid' ? 'default' : 'secondary'}>
                                                {purchase.purchase_status.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Grand Total Card */}
                        <Card className="flex flex-col justify-center items-center bg-muted/50 border-dashed">
                            <CardContent className="text-center pt-6">
                                <h3 className="text-lg font-medium text-muted-foreground">Grand Total</h3>
                                <p className="text-4xl font-bold text-primary mt-2">
                                    {formatCurrency(Number(purchase.purchase_grand_total))}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabel Barang */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Rincian Barang</CardTitle>
                        </CardHeader>
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
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{detail.item?.item_name || 'Item dihapus'}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{detail.item_code}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(Number(detail.buy_price))}
                                            </TableCell>
                                            <TableCell>
                                                {detail.quantity}
                                            </TableCell>
                                            <TableCell>
                                                {Number(detail.purchase_discount_item) > 0 ? (
                                                    <span className="text-red-600 font-medium">{detail.purchase_discount_item}%</span>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(Number(detail.total_item_price))}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </AppLayout>
    );
}