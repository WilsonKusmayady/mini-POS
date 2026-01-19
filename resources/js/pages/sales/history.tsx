import AppLayout from '@/layouts/app-layout';
import { appRoutes } from '@/lib/app-routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Plus,Pencil, Download, Filter, Eye, MoreVertical, Search, ChevronLeft, ChevronRight, Trash2, Calendar, X } from 'lucide-react';
import {Card,CardContent,CardDescription,CardHeader,CardTitle} from '@/components/ui/card';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';
import { salesViewSchema } from '@/view-schemas/sales.schema';
import { renderViewSchema } from '@/hooks/use-view-schema';
import { useViewModal } from '@/components/ui/view-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
// import { Calendar as CalendarComponent } from '@/components/ui/calendar';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: appRoutes.dashboard(),
  },
  {
    title: 'Sales',
    href: appRoutes.sales.index(),
  }
];

interface Sale {
  sales_invoice_code: string;
  customer_name: string
  member_code: string | null;
  sales_date: string;
  sales_subtotal: number;
  sales_discount_value: number;
  sales_hasil_discount_value: number;
  sales_grand_total: number;
  sales_payment_method: 'cash' | 'debit' | 'qris';
  sales_status: boolean;
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
  pagination?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
  statistics: {
    total_sales: number;
    total_revenue: number;
    total_discount: number;
    average_transaction: number;
  };
  filters: any;
}

export default function SalesHistory({ 
  sales: initialSales = [], 
  pagination: initialPagination,
  statistics,
  filters: initialFilters
}: SalesHistoryProps) {
  const { openModal, Modal } = useViewModal();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  // State untuk data
  const [sales, setSales] = useState<Sale[]>(Array.isArray(initialSales) ? initialSales : []);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(initialPagination || {
    current_page: 1,
    per_page: 10,
    total: initialSales.length,
    last_page: 1,
    from: 1,
    to: initialSales.length
  });
  const [filters, setFilters] = useState({
    search: initialFilters?.search || '',
    status: initialFilters?.status || 'all',
    payment_method: initialFilters?.payment_method || 'all',
    start_date: initialFilters?.start_date || '',
    end_date: initialFilters?.end_date || '',
  });
  
  // State untuk UI
  const [searchInput, setSearchInput] = useState(initialFilters?.search || '');
  const [perPage, setPerPage] = useState<string>(initialPagination?.per_page?.toString() || '10');

  const viewSale = (sale: Sale) => {
    openModal(
      salesViewSchema.title(sale),
      renderViewSchema(salesViewSchema, sale),
      salesViewSchema.description?.(sale)
    );
  };

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

  const getStatusBadge = (status: boolean) => {
    if (status === true) {
      return (
        <Badge className="bg-green-100 text-green-800" variant="outline">
          Paid
        </Badge>
      );
    }

    return (
      <Badge className="bg-red-100 text-red-800" variant="outline">
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

  // Fungsi untuk menampilkan barang dengan format: nama (jumlah), nama2 (jumlah), ...
  const formatItemsDisplay = (items: Sale['items'], maxItems = 2) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return '-';
    }
    
    const formattedItems = items.map(item => 
      `${item?.item_name || 'Unknown'} (${item?.sales_quantity || 0})`
    );
    
    if (formattedItems.length <= maxItems) {
      return formattedItems.join(', ');
    }
    
    // Ambil maxItems pertama dan tambahkan ...
    return `${formattedItems.slice(0, maxItems).join(', ')}...`;
  };

  // Fetch data dengan pagination
  const fetchSales = async (page = pagination.current_page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.payment_method && filters.payment_method !== 'all' && { payment_method: filters.payment_method }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
      });

      const url = `/api/sales?${params}`;
      const response = await axios.get(url);
      
      if (response.data && response.data.data) {
        setSales(Array.isArray(response.data.data) ? response.data.data : []);
        setPagination({
          current_page: response.data.current_page || 1,
          per_page: response.data.per_page || parseInt(perPage),
          total: response.data.total || 0,
          last_page: response.data.last_page || 1,
          from: response.data.from || 0,
          to: response.data.to || 0,
        });
      } else {
        setSales([]);
        setPagination({
          current_page: 1,
          per_page: parseInt(perPage),
          total: 0,
          last_page: 1,
          from: 0,
          to: 0,
        });
        toast.error('Data yang diterima tidak valid');
      }
    } catch (error: any) {
      console.error('Error fetching sales:', error);
      toast.error('Gagal memuat data penjualan');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchSales(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      payment_method: 'all',
      start_date: '',
      end_date: '',
    });
    setSearchInput('');
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchSales(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.last_page) return;
    setPagination(prev => ({ ...prev, current_page: page }));
    fetchSales(page);
  };

  const handlePerPageChange = (value: string) => {
    setPerPage(value);
    setPagination(prev => ({ 
      ...prev, 
      per_page: parseInt(value),
      current_page: 1 
    }));
  };

  // Fungsi untuk format tanggal range
  const formatDateRange = () => {
    if (filters.start_date && filters.end_date) {
      const start = new Date(filters.start_date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
      const end = new Date(filters.end_date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return `${start} - ${end}`;
    } else if (filters.start_date) {
      return `Dari ${new Date(filters.start_date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`;
    } else if (filters.end_date) {
      return `Sampai ${new Date(filters.end_date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`;
    }
    return 'Pilih Tanggal';
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch when perPage changes
  useEffect(() => {
    fetchSales(1);
  }, [perPage]);

  // Fetch when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search, filters.status, filters.payment_method, filters.start_date, filters.end_date]);

  // Render pagination buttons
  const renderPaginationButtons = () => {
    if (!pagination || pagination.last_page <= 1) return null;

    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, pagination.current_page - Math.floor(maxButtons / 2));
    let endPage = Math.min(pagination.last_page, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    // Previous button
    buttons.push(
      <Button
        key="prev"
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(pagination.current_page - 1)}
        disabled={pagination.current_page === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    );

    // First page
    if (startPage > 1) {
      buttons.push(
        <Button
          key={1}
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
        >
          1
        </Button>
      );
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="px-2">
            ...
          </span>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={pagination.current_page === i ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }

    // Last page
    if (endPage < pagination.last_page) {
      if (endPage < pagination.last_page - 1) {
        buttons.push(
          <span key="ellipsis2" className="px-2">
            ...
          </span>
        );
      }
      buttons.push(
        <Button
          key={pagination.last_page}
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.last_page)}
        >
          {pagination.last_page}
        </Button>
      );
    }

    // Next button
    buttons.push(
      <Button
        key="next"
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(pagination.current_page + 1)}
        disabled={pagination.current_page === pagination.last_page}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    );

    return buttons;
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

        {/* Filter Card - DI PINDAHKAN KE ATAS SUMMARY */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Transaksi</CardTitle>
            <CardDescription>
              Saring data transaksi berdasarkan kriteria tertentu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Search Input */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari kode invoice, nama pelanggan..."
                    className="pl-9"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Status Filter */}
              <Select 
                value={filters.status} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="1">Paid</SelectItem>
                  <SelectItem value="0">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Payment Method Filter */}
              <Select 
                value={filters.payment_method} 
                onValueChange={(value) => handleFilterChange('payment_method', value)}
              >
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
              
              {/* Date Range Filter */}
              <Popover open={showDateFilter} onOpenChange={setShowDateFilter}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    {formatDateRange()}
                    {(filters.start_date || filters.end_date) && (
                      <X 
                        className="ml-2 h-4 w-4" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFilterChange('start_date', '');
                          handleFilterChange('end_date', '');
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Dari Tanggal</label>
                        <Input
                          type="date"
                          value={filters.start_date}
                          onChange={(e) => handleFilterChange('start_date', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Sampai Tanggal</label>
                        <Input
                          type="date"
                          value={filters.end_date}
                          onChange={(e) => handleFilterChange('end_date', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => setShowDateFilter(false)}>
                        Tutup
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={handleApplyFilters} className="flex-1">
                  <Filter className="mr-2 h-4 w-4" />
                  Terapkan
                </Button>
                <Button variant="outline" onClick={handleResetFilters}>
                  Reset
                </Button>
              </div>
            </div>
            
            {/* Active Filters Badge */}
            {(filters.search || filters.status !== 'all' || filters.payment_method !== 'all' || filters.start_date || filters.end_date) && (
              <div className="mt-4 flex flex-wrap gap-2">
                <p className="text-sm text-muted-foreground mr-2">Filter aktif:</p>
                {filters.search && (
                  <Badge variant="secondary" className="gap-1">
                    Pencarian: {filters.search}
                    <button onClick={() => setSearchInput('')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.status !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {filters.status === '1' ? 'Paid' : 'Cancelled'}
                    <button onClick={() => handleFilterChange('status', 'all')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.payment_method !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Payment: {filters.payment_method === 'cash' ? 'Cash' : filters.payment_method === 'debit' ? 'Debit' : 'QRIS'}
                    <button onClick={() => handleFilterChange('payment_method', 'all')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {(filters.start_date || filters.end_date) && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.start_date && filters.end_date 
                      ? `Tanggal: ${formatDateRange()}`
                      : filters.start_date 
                      ? `Mulai: ${formatDate(filters.start_date)}`
                      : `Sampai: ${formatDate(filters.end_date)}`}
                    <button onClick={() => {
                      handleFilterChange('start_date', '');
                      handleFilterChange('end_date', '');
                    }}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Card - SEKARANG DI BAWAH FILTER */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.total_sales || 0}
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
                {formatCurrency(statistics?.total_revenue || 0)}
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
                -{formatCurrency(statistics?.total_discount || 0)}
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
                {formatCurrency(statistics?.average_transaction || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Per transaksi
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Daftar Transaksi</CardTitle>
                <CardDescription>
                  {loading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    `Menampilkan ${pagination.from || 0} sampai ${pagination.to || 0} dari ${pagination.total || 0} transaksi`
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select value={perPage} onValueChange={handlePerPageChange}>
                  <SelectTrigger className="w-[100px]">
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
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    // Loading skeleton
                    Array.from({ length: parseInt(perPage) || 10 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : !sales || !Array.isArray(sales) || sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Tidak ada data transaksi
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => (
                      <TableRow key={sale.sales_invoice_code}>
                        <TableCell className="font-mono font-medium">
                          {sale.sales_invoice_code || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(sale?.sales_date || '')}</span>
                            <span className="text-xs text-muted-foreground">
                              {sale?.created_at ? new Date(sale.created_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {sale?.customer_name || (sale?.member_code ? `Member: ${sale.member_code}` : '-')}
                            </span>
                            {sale?.member_code && (
                              <span className="text-xs text-muted-foreground">
                                Kode: {sale.member_code}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div 
                            className="text-sm truncate max-w-[200px]" 
                            title={sale?.items?.map(item => 
                              `${item?.item_name || 'Unknown'} (${item?.sales_quantity || 0})`
                            ).join(', ') || '-'}
                          >
                            {formatItemsDisplay(sale?.items, 2)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Total: {(sale?.items || []).reduce((total, item) => total + (item?.sales_quantity || 0), 0)} items
                          </div>
                        </TableCell>
                        <TableCell>
                          {sale?.sales_payment_method ? getPaymentMethodBadge(sale.sales_payment_method) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(sale?.sales_grand_total || 0)}
                        </TableCell>
                        <TableCell>
                          {sale?.sales_status !== undefined ? getStatusBadge(sale.sales_status) : '-'}
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
                              <DropdownMenuItem onClick={() => viewSale(sale)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => viewSale(sale)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => viewSale(sale)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                              {sale.sales_status && (
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
            {!loading && pagination && pagination.last_page > 1 && (
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
      <Modal />
    </AppLayout>
  );
}