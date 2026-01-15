import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Search,
  Calendar,
  Filter,
  Download,
  Eye,
  MoreVertical,
  Printer
} from 'lucide-react';
import {
  Card,
  CardContent,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// --- Interface Data ---
interface Supplier {
    supplier_id: number;
    supplier_name: string;
}

interface User {
    user_id: number;
    user_name: string;
}

interface Purchase {
  purchase_invoice_number: string;
  purchase_date: string;
  purchase_grand_total: number;
  purchase_status: 'paid' | 'pending' | 'cancelled';
  supplier?: Supplier;
  user?: User;
}

interface PurchaseIndexProps {
  purchases: {
    data: Purchase[];
    links: any[];
    current_page: number;
    last_page: number;
    total: number;
  };
}

export default function PurchaseIndex({ purchases }: PurchaseIndexProps) {
  const { data: purchaseList } = purchases;

  // --- Helper Functions ---
  
  // Format Currency (IDR)
  const formatCurrency = (value: number | string) => {
    const num = Number(value);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Format Date (Native JS - Pengganti date-fns)
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Hitung total ringkasan sederhana dari data yang tampil
  const totalExpense = purchaseList.reduce((acc, curr) => acc + Number(curr.purchase_grand_total), 0);

  const breadcrumbs = [
    {
      title: 'Dashboard',
      href: route('dashboard'),
    },
    {
      title: 'Pembelian',
      href: route('purchases.index'),
    }
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Riwayat Pembelian" />

      <div className="flex flex-col gap-6 p-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Riwayat Pembelian</h1>
            <p className="text-muted-foreground">
              Kelola data pembelian barang dari supplier.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            {/* Link ke halaman Create */}
            <Link href={route('purchases.create')}>
                <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Pembelian
                </Button>
            </Link>
          </div>
        </div>

        {/* Ringkasan Cards (Statistik Sederhana Halaman Ini) */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Transaksi (Halaman Ini)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchaseList.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Data ditampilkan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pengeluaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalExpense)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Grand Total Pembelian
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status Default
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Paid</div>
              <p className="text-xs text-muted-foreground mt-1">
                Sistem Mini POS
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Table */}
        <Card>
            <CardHeader className="py-4 px-6 border-b">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Cari No Invoice..."
                            className="pl-8"
                        />
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9">
                            <Filter className="mr-2 h-4 w-4" />
                            Filter
                        </Button>
                        <Button variant="outline" size="sm" className="h-9">
                            <Calendar className="mr-2 h-4 w-4" />
                            Periode
                        </Button>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">No. Invoice</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Operator</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {purchaseList.length > 0 ? (
                            purchaseList.map((item) => (
                                <TableRow key={item.purchase_invoice_number}>
                                    <TableCell className="font-medium font-mono">
                                        {item.purchase_invoice_number}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(item.purchase_date)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{item.supplier?.supplier_name || '-'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-muted-foreground text-sm">
                                            {item.user?.user_name || '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.purchase_status === 'paid' ? 'default' : 'secondary'}>
                                            {item.purchase_status.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {formatCurrency(item.purchase_grand_total)}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                
                                                {/* Tombol Lihat Detail */}
                                                <DropdownMenuItem asChild>
                                                    <Link 
                                                        href={route('purchases.show', item.purchase_invoice_number)} 
                                                        className="cursor-pointer flex items-center w-full"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Lihat Detail
                                                    </Link>
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />
                                                
                                                {/* Tombol Cetak (Placeholder) */}
                                                <DropdownMenuItem 
                                                    className="cursor-pointer"
                                                    onClick={() => alert("Fitur cetak akan segera hadir!")}
                                                >
                                                    <Printer className="mr-2 h-4 w-4" />
                                                    Cetak Invoice
                                                </DropdownMenuItem>
                                                
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    Belum ada data pembelian.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        {/* Simple Pagination Info */}
        <div className="text-xs text-muted-foreground text-center">
            Menampilkan {purchaseList.length} dari {purchases.total} data
        </div>

      </div>
    </AppLayout>
  );
}