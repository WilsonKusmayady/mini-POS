import AppLayout from '@/layouts/app-layout';
import { appRoutes } from '@/lib/app-routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Download, 
  Filter, 
  Eye, 
  MoreVertical,
  Search,
  Calendar,
  ChevronDown
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: appRoutes.dashboard(),
  },
  {
    title: 'Penjualan',
    href: appRoutes.sales.index(),
  },
  {
    title: 'Riwayat Penjualan',
    href: appRoutes.sales.history(),
  },
];

interface Sale {
  sales_invoice_code: string;
  customer_name: string | null;
  member_code: string | null;
  sales_date: string;
  sales_subtotal: number;
  sales_discount_value: number;
  sales_hasil_discount_value: number;
  sales_grand_total: number;
  sales_payment_method: 'cash' | 'debit' | 'qris';
  sales_status: number; // 0: cancelled, 1: paid
  user_id: number;
  created_at: string;
  items: Array<{
    item_code: string;
    item_name: string;
    sales_quantity: number;
    sell_price: number;
    sales_discount_item: number;
    sales_hasil_diskon_item: number;
    total_item_price: number;
  }>;
}

interface SalesHistoryProps {
  sales: Sale[];
}

export default function SalesHistory({ sales = [] }: SalesHistoryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100" variant="outline">
          Paid
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100" variant="outline">
        Cancelled
      </Badge>
    );
  };

  const getPaymentMethodBadge = (method: 'cash' | 'debit' | 'qris') => {
    const variants = {
      cash: 'bg-blue-100 text-blue-800',
      debit: 'bg-purple-100 text-purple-800',
      qris: 'bg-orange-100 text-orange-800',
    };

    const labels = {
      cash: 'Cash',
      debit: 'Debit',
      qris: 'QRIS',
    };

    return (
      <Badge className={variants[method]} variant="outline">
        {labels[method]}
      </Badge>
    );
  };

  const truncateItems = (items: Sale['items'], maxItems = 2) => {
    if (items.length <= maxItems) {
      return items.map(item => item.item_name).join(', ');
    }
    return `${items.slice(0, maxItems).map(item => item.item_name).join(', ')} +${items.length - maxItems} lainnya`;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Riwayat Penjualan" />

      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Riwayat Penjualan</h1>
            <p className="text-muted-foreground">
              Daftar lengkap transaksi penjualan
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button asChild>
              <Link href={appRoutes.sales.create()}>
                <Plus className="mr-2 h-4 w-4" />
                Transaksi Baru
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari kode invoice, nama pelanggan, atau member..."
                  className="pl-9"
                />
              </div>
              
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Dari tanggal"
                  className="pl-9"
                />
              </div>
              
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Sampai tanggal"
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-4 mt-4">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Metode</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              
              <Button variant="ghost">
                Reset Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Daftar Transaksi</CardTitle>
                <CardDescription>
                  Total {sales.length} transaksi ditemukan
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select defaultValue="10">
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Kode Invoice</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Barang</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Diskon</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Tidak ada data transaksi
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => (
                      <TableRow key={sale.sales_invoice_code}>
                        <TableCell className="font-mono font-medium">
                          {sale.sales_invoice_code}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(sale.sales_date)}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(sale.created_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {sale.customer_name || (sale.member_code ? `Member: ${sale.member_code}` : '-')}
                            </span>
                            {sale.member_code && (
                              <span className="text-xs text-muted-foreground">
                                Kode: {sale.member_code}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="truncate" title={sale.items.map(item => item.item_name).join(', ')}>
                            {truncateItems(sale.items)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {sale.items.reduce((total, item) => total + item.sales_quantity, 0)} items
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodBadge(sale.sales_payment_method)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(sale.sales_subtotal)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-red-600">
                              -{formatCurrency(sale.sales_hasil_discount_value)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({sale.sales_discount_value}%)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(sale.sales_grand_total)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(sale.sales_status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={appRoutes.sales.show(sale.sales_invoice_code)} className="cursor-pointer">
                                  <Eye className="mr-2 h-4 w-4" />
                                  Detail
                                </Link>
                              </DropdownMenuItem>
                              {sale.sales_status === 1 && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">
                                    Batalkan Transaksi
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {sales.length > 0 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Menampilkan 1 sampai {Math.min(10, sales.length)} dari {sales.length} entri
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Sebelumnya
                  </Button>
                  <Button variant="outline" size="sm">
                    1
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Card */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {/* {sales.length} */}
                6
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Transaksi penjualan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pendapatan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(sales.reduce((total, sale) => total + sale.sales_grand_total, 0))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Grand total semua transaksi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Diskon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                -{formatCurrency(sales.reduce((total, sale) => total + sale.sales_hasil_discount_value, 0))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total diskon diberikan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rata-rata Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sales.length > 0 
                  ? formatCurrency(sales.reduce((total, sale) => total + sale.sales_grand_total, 0) / sales.length)
                  : formatCurrency(0)
                }
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Per transaksi
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}