import AppLayout from '@/layouts/app-layout';
import { appRoutes } from '@/lib/app-routes';
import { type BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Filter, Eye, MoreVertical, Search, ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { PurchaseFilterModal, type PurchaseFilterParams } from '@/components/purchase-filter-modal';

import { SearchInput } from '@/components/ui/search-input';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: appRoutes.dashboard(),
  },
  {
    title: 'Purchases',
    href: appRoutes.purchases.index(),
  }
];

// --- Interfaces ---
interface Supplier { supplier_id: number; supplier_name: string; }
interface User { user_id: number; user_name: string; }

interface Purchase {
  purchase_invoice_number: string;
  purchase_date: string;
  purchase_grand_total: number;
  purchase_status: 'paid' | 'pending' | 'cancelled';
  supplier?: Supplier;
  user?: User;
  created_at?: string;
}

interface PaginationState {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface PurchaseIndexProps {
  suppliers_list: Supplier[];
  users_list: User[];
}

export default function PurchaseIndex({ suppliers_list, users_list }: PurchaseIndexProps) {
  const { flash } = usePage<SharedData>().props;

  // --- States ---
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [pagination, setPagination] = useState<PaginationState>({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0
  });

  // Filter State
  const [searchInput, setSearchInput] = useState('');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<PurchaseFilterParams>({});
  
  // Statistics State
  const [statistics, setStatistics] = useState({
    total_transactions: 0,
    total_spending: 0,
    average_transaction: 0
  });

  // --- Data Fetching ---
  const fetchPurchases = useCallback(async (page = pagination.current_page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10', // Fixed per page
        ...(searchInput && { search: searchInput }),
        ...(activeFilters.supplierId && { supplier_id: activeFilters.supplierId }),
        ...(activeFilters.userId && { user_id: activeFilters.userId }),
        ...(activeFilters.startDate && { start_date: activeFilters.startDate }),
        ...(activeFilters.endDate && { end_date: activeFilters.endDate }),
        ...(activeFilters.minTotal && { min_total: activeFilters.minTotal }),
        ...(activeFilters.maxTotal && { max_total: activeFilters.maxTotal }),
      });

      const url = `/api/purchases?${params}`;
      const response = await axios.get(url);

      if (response.data && response.data.data) {
        const data = response.data.data;
        setPurchases(data);
        
        setPagination({
            current_page: response.data.current_page || 1,
            per_page: response.data.per_page || 10,
            total: response.data.total || 0,
            last_page: response.data.last_page || 1,
            from: response.data.from || 0,
            to: response.data.to || 0,
        });

        // Calculate simple stats from current page data
        const currentTotal = data.reduce((sum: number, p: Purchase) => sum + Number(p.purchase_grand_total), 0);
        setStatistics({
            total_transactions: response.data.total || 0,
            total_spending: currentTotal,
            average_transaction: data.length > 0 ? currentTotal / data.length : 0
        });
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Gagal memuat data pembelian');
    } finally {
      setLoading(false);
    }
  }, [pagination.current_page, searchInput, activeFilters]);

  // Effects
  useEffect(() => {
    const timer = setTimeout(() => {
        fetchPurchases(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchPurchases(1);
  }, [activeFilters]);

  // --- Handlers ---
    const handleExport = () => {
        const params = new URLSearchParams({
            ...(searchInput && { search: searchInput }),
            ...(activeFilters.supplierId && { supplier_id: activeFilters.supplierId }),
            ...(activeFilters.userId && { user_id: activeFilters.userId }),
            ...(activeFilters.startDate && { start_date: activeFilters.startDate }),
            ...(activeFilters.endDate && { end_date: activeFilters.endDate }),
            ...(activeFilters.minTotal && { min_total: activeFilters.minTotal }),
            ...(activeFilters.maxTotal && { max_total: activeFilters.maxTotal }),
        });

        window.location.href = `/purchases/export?${params.toString()}`;
    };

  const handleDelete = async (purchase: Purchase) => {
    if (!confirm(`Hapus pembelian ${purchase.purchase_invoice_number}?`)) return;
    try {
        await axios.delete(route('purchases.destroy', purchase.purchase_invoice_number));
        toast.success('Pembelian berhasil dihapus');
        fetchPurchases(pagination.current_page);
    } catch (error) {
        toast.error('Gagal menghapus pembelian');
    }
  };

  const handleApplyFilter = (newFilters: PurchaseFilterParams) => {
    setActiveFilters(newFilters);
    setFilterModalOpen(false);
  };

  const handleClearAllFilters = () => {
    setActiveFilters({});
    setSearchInput('');
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.last_page) return;
    setPagination(prev => ({ ...prev, current_page: page }));
    fetchPurchases(page); 
  };

  // --- Formatters ---
  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'paid': return <Badge className="bg-green-100 text-green-800" variant="outline">Paid</Badge>;
        case 'pending': return <Badge className="bg-yellow-100 text-yellow-800" variant="outline">Pending</Badge>;
        case 'cancelled': return <Badge className="bg-red-100 text-red-800" variant="outline">Cancelled</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // --- Pagination Buttons ---
  const renderPaginationButtons = () => {
    if (pagination.last_page <= 1) return null;
    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, pagination.current_page - Math.floor(maxButtons / 2));
    let endPage = Math.min(pagination.last_page, startPage + maxButtons - 1);
    
    if (endPage - startPage + 1 < maxButtons) startPage = Math.max(1, endPage - maxButtons + 1);

    // Prev
    buttons.push(
        <Button key="prev" variant="outline" size="sm" onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1}>
            <ChevronLeft className="h-4 w-4" />
        </Button>
    );

    // Pages
    for (let i = startPage; i <= endPage; i++) {
        buttons.push(
            <Button key={i} variant={pagination.current_page === i ? "default" : "outline"} size="sm" onClick={() => handlePageChange(i)}>
                {i}
            </Button>
        );
    }

    // Next
    buttons.push(
        <Button key="next" variant="outline" size="sm" onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page}>
            <ChevronRight className="h-4 w-4" />
        </Button>
    );
    return buttons;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Riwayat Pembelian" />

      <div className="flex flex-col gap-6 p-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Riwayat Pembelian</h1>
            <p className="text-muted-foreground">Daftar lengkap transaksi pembelian barang masuk.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button asChild>
              <Link href={appRoutes.purchases.create()}>
                <Plus className="mr-2 h-4 w-4" /> Pembelian Baru
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Transaksi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{statistics.total_transactions}</div>
                    <p className="text-xs text-muted-foreground mt-1">Pembelian tercatat</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengeluaran</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(statistics.total_spending)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Halaman ini</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(statistics.average_transaction)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Per transaksi</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">Active</div>
                    <p className="text-xs text-muted-foreground mt-1">System running</p>
                </CardContent>
            </Card>
        </div>

        {/* Table Card */}
        <Card>
            <CardHeader className="space-y-4">
                {/* Header Top: Title + Search/Filter */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle>Daftar Pembelian</CardTitle>
                        <CardDescription>
                            {loading ? <Skeleton className="h-4 w-32" /> : `Menampilkan ${pagination.from} - ${pagination.to} dari ${pagination.total} transaksi`}
                        </CardDescription>
                    </div>

                    {/* Controls: Search & Filter */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-center">
                        <SearchInput
                            value={searchInput}
                            onSearch={(val) => setSearchInput(val)} // Component ini sudah punya debounce bawaan
                            placeholder="Cari Invoice, Supplier, atau User..." // Placeholder spesifik untuk halaman ini
                            className="w-full sm:w-64"
                        />
                        <Button variant="outline" size="sm" className="h-9 w-full sm:w-auto" onClick={() => setFilterModalOpen(true)}>
                            <Filter className="mr-2 h-4 w-4" /> Filter
                        </Button>
                    </div>
                </div>

                {/* Active Filters Display */}
                {Object.keys(activeFilters).length > 0 && (
                     <div className="flex flex-wrap gap-2 pt-2">
                        {activeFilters.startDate && (
                            <Badge variant="secondary" className="text-xs">
                                Dari: {formatDate(activeFilters.startDate)}
                            </Badge>
                        )}
                        {activeFilters.endDate && (
                            <Badge variant="secondary" className="text-xs">
                                Sampai: {formatDate(activeFilters.endDate)}
                            </Badge>
                        )}
                        {activeFilters.supplierId && (
                            <Badge variant="secondary" className="text-xs">
                                Supp: {suppliers_list.find(s => s.supplier_id.toString() == activeFilters.supplierId)?.supplier_name}
                            </Badge>
                        )}
                         {activeFilters.userId && (
                            <Badge variant="secondary" className="text-xs">
                                Op: {users_list.find(u => u.user_id.toString() == activeFilters.userId)?.user_name}
                            </Badge>
                        )}
                        <Button variant="ghost" size="sm" onClick={handleClearAllFilters} className="h-5 text-xs text-red-500 hover:text-red-700 px-2">
                            Reset
                        </Button>
                    </div>
                )}
            </CardHeader>
            
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">No Invoice</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Operator</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({length: 5}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : purchases.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Tidak ada data pembelian.</TableCell>
                                </TableRow>
                            ) : (
                                purchases.map((item) => (
                                    <TableRow key={item.purchase_invoice_number} className="align-top">
                                        <TableCell className="font-mono font-medium py-4">{item.purchase_invoice_number}</TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span>{formatDate(item.purchase_date)}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {item.created_at ? new Date(item.created_at).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit'}) : ''}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">{item.supplier?.supplier_name || '-'}</TableCell>
                                        <TableCell className="py-4">{item.user?.user_name || '-'}</TableCell>
                                        <TableCell className="text-right font-bold py-4">{formatCurrency(Number(item.purchase_grand_total))}</TableCell>
                                        <TableCell className="py-4">{getStatusBadge(item.purchase_status)}</TableCell>
                                        <TableCell className="text-right py-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={route('purchases.show', item.purchase_invoice_number)} className="cursor-pointer flex w-full">
                                                            <Eye className="mr-2 h-4 w-4" /> Detail
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDelete(item)} className="text-red-600 focus:text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                
                {/* Pagination Footer */}
                {!loading && pagination.last_page > 1 && (
                    <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-muted-foreground">
                            Menampilkan {pagination.from} sampai {pagination.to} dari {pagination.total} transaksi
                        </div>
                        <div className="flex items-center gap-2">
                            {renderPaginationButtons()}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

      </div>

      <PurchaseFilterModal 
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        suppliers={suppliers_list}
        users={users_list}
        initialFilters={activeFilters}
        onApply={handleApplyFilter}
        onReset={handleClearAllFilters}
      />

    </AppLayout>
  );
}