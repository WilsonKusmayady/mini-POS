import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react'; // Hapus router jika tidak dipakai langsung
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Download, Eye, MoreVertical, Printer, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { appRoutes } from '@/lib/app-routes'; 
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import { PurchaseFilterModal, type PurchaseFilterParams } from '@/components/purchase-filter-modal';

// Interface
interface Supplier { supplier_id: number; supplier_name: string; }
interface User { user_id: number; user_name: string; } // Sesuaikan field name user
interface Purchase {
  purchase_invoice_number: string;
  purchase_date: string;
  purchase_grand_total: number;
  purchase_status: 'paid' | 'pending' | 'cancelled';
  supplier?: Supplier;
  user?: User;
}

// Props dari Controller
interface PurchaseIndexProps {
  suppliers_list: Supplier[];
  users_list: User[];
}

export default function PurchaseIndex({ suppliers_list, users_list }: PurchaseIndexProps) {
  // State Data
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State Filter
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<PurchaseFilterParams>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [perPage, setPerPage] = useState('10'); // Bisa tambahkan select perPage jika mau

  // 1. Debounce Search
  useEffect(() => {
      const timer = setTimeout(() => {
          setDebouncedSearch(search);
      }, 500);
      return () => clearTimeout(timer);
  }, [search]);

  // 2. Fetch Data (API Call)
  const fetchPurchases = async () => {
      setLoading(true);
      try {
          // Sesuaikan dengan route API yang Anda buat di langkah 4
          // Jika route belum ada di appRoutes, gunakan string manual dulu atau update appRoutes
          const url = '/api/purchases'; // Pastikan route ini ada
          
          const params = {
              page: 1, // Reset ke page 1 jika filter berubah (bisa disesuaikan logic paginationnya)
              per_page: perPage,
              search: debouncedSearch,
              supplier_id: filters.supplierId,
              user_id: filters.userId,
              start_date: filters.startDate,
              end_date: filters.endDate,
              min_total: filters.minTotal,
              max_total: filters.maxTotal,
          };

          const response = await axios.get(url, { params });
          setPurchases(response.data.data);
          setPagination(response.data);
      } catch (error) {
          console.error("Error fetching purchases:", error);
      } finally {
          setLoading(false);
      }
  };

  // Trigger fetch saat filter berubah
  useEffect(() => {
      fetchPurchases();
  }, [debouncedSearch, filters, perPage]);

  // Helper Formatter
  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  // Handler Filter
  const handleApplyFilter = (newFilters: PurchaseFilterParams) => {
      setFilters(newFilters);
  };

  const handleResetFilter = () => {
      setFilters({});
      setIsFilterModalOpen(false);
  };

  // Cek apakah ada filter aktif
  const hasActiveFilters = Object.values(filters).some(x => x !== undefined && x !== '');

  return (
    <AppLayout breadcrumbs={[{ title: 'Dashboard', href: appRoutes.dashboard() }, { title: 'Purchases', href: '#' }]}>
      <Head title="Riwayat Pembelian" />

      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Riwayat Pembelian</h1>
            <p className="text-muted-foreground">Kelola data pembelian barang.</p>
          </div>
          <div className="flex gap-2">
            <Link href={appRoutes.purchases.create()}>
                <Button><Plus className="mr-2 h-4 w-4" /> Tambah Pembelian</Button>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <Card>
            <CardHeader className="py-4 px-6 border-b">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari No Invoice..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                         {search && (
                            <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7" onClick={() => setSearch('')}>
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant={hasActiveFilters ? "default" : "outline"} 
                            onClick={() => setIsFilterModalOpen(true)}
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            {hasActiveFilters ? 'Filter Aktif' : 'Filter'}
                        </Button>
                    </div>
                </div>
                
                {/* Badges Filter Aktif */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                        <span className="text-xs text-muted-foreground self-center">Filter:</span>
                        {filters.startDate && <Badge variant="secondary">Dari: {formatDate(filters.startDate)}</Badge>}
                        {filters.endDate && <Badge variant="secondary">Sampai: {formatDate(filters.endDate)}</Badge>}
                        {filters.supplierId && <Badge variant="secondary">Supplier: {suppliers_list.find(s => s.supplier_id.toString() === filters.supplierId)?.supplier_name}</Badge>}
                        {filters.userId && <Badge variant="secondary">Op: {users_list.find(u => u.user_id.toString() === filters.userId)?.user_name}</Badge>}
                        {(filters.minTotal || filters.maxTotal) && <Badge variant="secondary">Rp {filters.minTotal || 0} - {filters.maxTotal || '...'}</Badge>}
                        
                        <Button variant="ghost" size="sm" className="h-5 text-xs text-red-500" onClick={() => setFilters({})}>
                            Reset
                        </Button>
                    </div>
                )}
            </CardHeader>
            
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No. Invoice</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Operator</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({length: 5}).map((_, i) => (
                                <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                            ))
                        ) : purchases.length > 0 ? (
                            purchases.map((item) => (
                                <TableRow key={item.purchase_invoice_number}>
                                    <TableCell className="font-mono font-medium">{item.purchase_invoice_number}</TableCell>
                                    <TableCell>{formatDate(item.purchase_date)}</TableCell>
                                    <TableCell>{item.supplier?.supplier_name || '-'}</TableCell>
                                    <TableCell>{item.user?.user_name || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.purchase_status === 'paid' ? 'default' : 'secondary'}>
                                            {item.purchase_status.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(item.purchase_grand_total)}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={appRoutes.purchases.show(item.purchase_invoice_number)} className="cursor-pointer flex w-full">
                                                        <Eye className="mr-2 h-4 w-4" /> Lihat Detail
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Tidak ada data ditemukan.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        {/* Pagination simple display */}
        {!loading && pagination && (
            <div className="text-xs text-muted-foreground text-center mt-2">
                Menampilkan {purchases.length} dari {pagination.total} data
            </div>
        )}

      </div>

      {/* Modal Component */}
      <PurchaseFilterModal 
        open={isFilterModalOpen}
        onOpenChange={setIsFilterModalOpen}
        suppliers={suppliers_list}
        users={users_list}
        initialFilters={filters}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />
    </AppLayout>
  );
}