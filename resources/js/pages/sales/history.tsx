import AppLayout from '@/layouts/app-layout';
import { appRoutes } from '@/lib/app-routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Download, Printer, Eye, MoreVertical, Search, ChevronLeft, ChevronRight, Trash2, X, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'; // Tambah ArrowUpDown, ChevronUp, ChevronDown
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { salesViewSchema } from '@/view-schemas/sales.schema';
import { renderViewSchema } from '@/hooks/use-view-schema';
import { useViewModal } from '@/components/ui/view-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FilterModal, FilterParams } from '@/components/ui/filter-modal';
import { salesFilterSchema, convertSalesFiltersToParams } from '@/filter-schemas/sales.shema';
import { PrintNota } from '@/components/nota/PrintNota';
// Di bagian atas file pages/sales/history.tsx, tambahkan:
import { useEditModal } from '@/hooks/use-edit-modal';
import { EditModal } from '@/components/ui/edit-modal';
import { salesEditSchema, SalesFormData } from '@/edit-schemas/sales.schema';

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
  member?: {
    member_code: string
    member_name: string
  } | null
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

interface SortConfig {
  key: keyof Sale | string;
  direction: 'asc' | 'desc';
}

export default function SalesHistory({ 
  sales: initialSales = [], 
  pagination: initialPagination,
  statistics,
  filters: initialFilters
}: SalesHistoryProps) {
  const { openModal, Modal } = useViewModal();
  const { 
    isOpen, 
    openModal: openEditModal, 
    closeModal, 
    editData, 
    schema, 
    modalTitle,
    modalWidth 
  } = useEditModal<SalesFormData>();
  // State untuk data
  const [sales, setSales] = useState<Sale[]>(Array.isArray(initialSales) ? initialSales : []);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editDeleteLoading, setEditDeleteLoading] = useState(false);
  const [pagination, setPagination] = useState(initialPagination || {
    current_page: 1,
    per_page: 10,
    total: initialSales.length,
    last_page: 1,
    from: 1,
    to: initialSales.length
  });
  
  // State untuk search
  const [searchInput, setSearchInput] = useState(initialFilters?.search || '');
  
  // State untuk filter modal
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterParams>({
    status: initialFilters?.status !== undefined ? String(initialFilters.status) : '',
    payment_method: initialFilters?.payment_method || '',
    sales_date_start: initialFilters?.start_date || '',
    sales_date_end: initialFilters?.end_date || '',
  });

  // State untuk sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'created_at',
    direction: 'desc'
  });
  
  // State untuk UI
  const [perPage, setPerPage] = useState<string>(initialPagination?.per_page?.toString() || '10');

  const handleSort = (key: keyof Sale | string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      // Jika sudah sort descending, reset ke default
      setSortConfig({ key: 'created_at', direction: 'desc' });
      return;
    }
    
    setSortConfig({ key, direction });
  };

  // Fungsi untuk mendapatkan icon sorting
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    
    if (sortConfig.direction === 'asc') {
      return <ChevronUp className="ml-2 h-4 w-4" />;
    }
    
    return <ChevronDown className="ml-2 h-4 w-4" />;
  };

  // Fungsi untuk mendapatkan label kolom
  const getColumnLabel = (key: string): string => {
    const labels: Record<string, string> = {
      'sales_invoice_code': 'Kode Invoice',
      'sales_date': 'Tanggal',
      'customer_name': 'Pelanggan',
      'sales_payment_method': 'Payment Method',
      'sales_grand_total': 'Grand Total',
      'created_at': 'Tanggal Buat',
    };
    
    return labels[key] || key;
  };

  // Sort data secara lokal
  const sortedSales = useMemo(() => {
    if (!sortConfig.key) return sales;
    
    return [...sales].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      // Handle nested properties
      switch (sortConfig.key) {
        case 'sales_date':
          aValue = new Date(a.sales_date).getTime();
          bValue = new Date(b.sales_date).getTime();
          break;

        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;

        case 'customer_name':
          aValue = a.customer_name || a.member?.member_name || '';
          bValue = b.customer_name || b.member?.member_name || '';
          break;

        case 'sales_payment_method':
          const paymentMethodMap: Record<string, string> = {
            cash: 'Tunai',
            debit: 'Debit',
            qris: 'QRIS',
          };
          aValue = paymentMethodMap[a.sales_payment_method] || a.sales_payment_method;
          bValue = paymentMethodMap[b.sales_payment_method] || b.sales_payment_method;
          break;

        default:
          aValue = a[sortConfig.key as keyof Sale];
          bValue = b[sortConfig.key as keyof Sale];
      }
      
      // Handle undefined/null values
      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      // ✅ STRING
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue, 'id-ID', { numeric: true })
          : bValue.localeCompare(aValue, 'id-ID', { numeric: true });
      }
      
      // Fallback string comparison
      const aStr = String(aValue);
      const bStr = String(bValue);
      return sortConfig.direction === 'asc' 
        ? aStr.localeCompare(bStr, 'id-ID')
        : bStr.localeCompare(aStr, 'id-ID');
    });
  }, [sales, sortConfig]);

  const viewSale = (sale: Sale) => {
    openModal(
      salesViewSchema.title(sale),
      renderViewSchema(salesViewSchema, sale),
      salesViewSchema.description?.(sale)
    );
  };

  const handleEditSale = (sale: Sale) => {
    // Convert data dari API ke format form
    const formData: SalesFormData = {
      sales_invoice_code: sale.sales_invoice_code,
      customer_name: sale.customer_name || '',
      member_code: sale.member_code || undefined,
      member_name: sale.member?.member_name || '',
      sales_date: sale.sales_date,
      sales_subtotal: sale.sales_subtotal || 0,
      sales_discount_value: sale.sales_discount_value || 0,
      sales_grand_total: sale.sales_grand_total || 0,
      sales_payment_method: sale.sales_payment_method || 'cash',
      sales_status: sale.sales_status,
      items: sale.items.map(item => ({
        item_code: item.item_code,
        item_name: item.item_name,
        sales_quantity: item.sales_quantity,
        sell_price: item.sell_price,
        sales_discount_item: item.sales_discount_item || 0,
        sales_hasil_diskon_item: item.sales_hasil_diskon_item || 0,
        total_item_price: item.total_item_price,
      })),
      can_edit_member: !sale.member_code, // Can't edit if already has member
    };
    
    openEditModal(
      formData, 
      salesEditSchema, 
      `Edit Transaksi: ${sale.sales_invoice_code}`,
      '5xl' // Gunakan width lebih besar untuk sales
    );
  };

   const renderSortingIndicator = () => {
    if (!sortConfig.key || sortConfig.key === 'created_at') return null;
    
    const currentSortLabel = getColumnLabel(sortConfig.key);
    const currentSortDirection = sortConfig.direction === 'asc' ? 'A-Z / Kecil ke Besar' : 'Z-A / Besar ke Kecil';
    
    return (
      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-3 w-3" />
          <span>Disortir berdasarkan:</span>
          <Badge variant="outline" className="ml-1">
            {currentSortLabel} ({currentSortDirection})
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortConfig({ key: 'created_at', direction: 'desc' })}
          className="h-6 px-2 text-xs"
        >
          <X className="h-3 w-3 mr-1" />
          Reset Sort
        </Button>
      </div>
    );
  };

  // Submit handler untuk edit modal
  const handleSubmitEdit = async (data: SalesFormData) => {
    setEditLoading(true);
    try {
      console.log('📤 Sending sales update data:', data);
      
      // Siapkan data untuk API
      const apiData: any = {
        customer_name: data.customer_name,
        sales_date: data.sales_date,
        sales_discount_value: data.sales_discount_value,
        sales_payment_method: data.sales_payment_method,
        sales_status: data.sales_status,
      };
      
      // Only include member_code if it's empty or not already set
      if (!data.member_code || data.member_code === '') {
        apiData.member_code = null;
      } else if (!data.can_edit_member) {
        // If can't edit member, use existing member_code
        const originalSale = sales.find(s => s.sales_invoice_code === data.sales_invoice_code);
        if (originalSale) {
          apiData.member_code = originalSale.member_code;
        }
      } else {
        apiData.member_code = data.member_code;
      }
      
      // Include items if changed
      if (data.items && data.items.length > 0) {
        apiData.items = data.items;
      }
      
      console.log('🌐 Update URL:', `/api/sales/${data.sales_invoice_code}`);
      console.log('📦 Request data:', apiData);
      
      const response = await axios.put(
        `/api/sales/${data.sales_invoice_code}`,
        apiData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          }
        }
      );

      console.log('✅ Update response:', response.data);
      
      if (response.data.success) {
        toast.success('Transaksi berhasil diperbarui');
        closeModal();
        fetchSales(pagination.current_page);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('❌ Error updating sale:', error);
      
      if (error.response) {
        console.error('📄 Error response data:', error.response.data);
        console.error('🔧 Error response status:', error.response.status);
        
        if (error.response.data.errors) {
          const errorMessages = Object.values(error.response.data.errors).flat().join(', ');
          toast.error(`Validasi gagal: ${errorMessages}`);
        } else if (error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Terjadi kesalahan saat memperbarui transaksi');
        }
      } else {
        toast.error('Gagal mengirim permintaan: ' + error.message);
      }
      
      throw error;
    } finally {
      setEditLoading(false);
    }
  };

  // Delete handler untuk edit modal
  const handleDeleteEdit = async (data: SalesFormData) => {
    setEditDeleteLoading(true);
    try {
      const saleToDelete = sales.find(s => s.sales_invoice_code === data.sales_invoice_code);
      
      if (!saleToDelete) {
        throw new Error('Transaksi tidak ditemukan');
      }
      
      await handleDelete(saleToDelete);
      closeModal();
    } catch (error) {
      throw error;
    } finally {
      setEditDeleteLoading(false);
    }
  };

  // Delete sale
  const handleDelete = async (sale: Sale) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus transaksi ${sale.sales_invoice_code}?`)) {
      return;
    }

    try {
      const response = await axios.delete(`/api/sales/${sale.sales_invoice_code}`);
      
      if (response.data.success) {
        toast.success('Transaksi berhasil dihapus');
        // Refresh data
        fetchSales(pagination.current_page);
      } else {
        toast.error(response.data.message || 'Gagal menghapus transaksi');
      }
    } catch (error: any) {
      console.error('❌ Error deleting sale:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Gagal menghapus transaksi');
      }
    }
  };

  // Cancel sale (mengembalikan stok)
  const handleCancelSale = async (sale: Sale) => {
    if (!sale.sales_status) {
      toast.error('Transaksi sudah dibatalkan');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin membatalkan transaksi ${sale.sales_invoice_code}? Stok barang akan dikembalikan.`)) {
      return;
    }

    try {
      const response = await axios.post(`/api/sales/${sale.sales_invoice_code}/cancel`);
      
      if (response.data.success) {
        toast.success('Transaksi berhasil dibatalkan');
        // Refresh data
        fetchSales(pagination.current_page);
      } else {
        toast.error(response.data.message || 'Gagal membatalkan transaksi');
      }
    } catch (error: any) {
      console.error('❌ Error canceling sale:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Gagal membatalkan transaksi');
      }
    }
  };

  // ✅ Handle Export CSV
  const handleExport = async () => {
    setExportLoading(true);
    try {
      // Konversi filter ke format yang sesuai dengan backend
      const filterParams = convertSalesFiltersToParams(activeFilters);
      
      const params = new URLSearchParams({
        ...(searchInput && { search: searchInput }),
        ...filterParams
      });

      // Gunakan window.location untuk download file CSV
      window.location.href = `/sales/export?${params}`;
      
    } catch (error: any) {
      console.error('❌ Error exporting sales:', error);
      toast.error('Gagal export data penjualan');
    } finally {
      setExportLoading(false);
    }
  };

  // ✅ Alternative: Export menggunakan AJAX (jika ingin menampilkan loading)
  const handleExportAjax = async () => {
    setExportLoading(true);
    try {
      // Konversi filter ke format yang sesuai dengan backend
      const filterParams = convertSalesFiltersToParams(activeFilters);
      
      const params = new URLSearchParams({
        ...(searchInput && { search: searchInput }),
        ...filterParams
      });

      const response = await axios.get(`/api/sales/export?${params}`, {
        responseType: 'blob' // Penting untuk menerima file
      });
      
      // Buat URL untuk file blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Dapatkan filename dari header atau buat default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'sales_export.csv';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Export berhasil! File sedang diunduh');
      
    } catch (error: any) {
      console.error('❌ Error exporting sales:', error);
      toast.error('Gagal export data penjualan');
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.status && activeFilters.status !== '') count++;
    if (activeFilters.payment_method && activeFilters.payment_method !== '') count++;
    if (activeFilters.sales_date_start) count++;
    if (activeFilters.sales_date_end) count++;
    return count;
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
      // Konversi filter ke format yang sesuai dengan backend
      const filterParams = convertSalesFiltersToParams(activeFilters);
      
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage,
        ...(searchInput && { search: searchInput }),
        ...filterParams,
        // Tambahkan sorting parameter untuk backend (optional)
        sort_by: sortConfig.key,
        sort_dir: sortConfig.direction,
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
      console.error('❌ Error fetching sales:', error);
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      
      toast.error('Gagal memuat data penjualan');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change dari modal
  const handleFilterChange = (filters: FilterParams) => {
      console.log('🔄 Filter changed (raw):', filters);
      
      // Buat copy baru dari filters
      const processedFilters: FilterParams = { ...filters };
      
      // Pastikan status selalu string (untuk UI), tapi akan dikonversi ke integer saat fetch
      if (processedFilters.status !== undefined) {
          processedFilters.status = String(processedFilters.status);
      }
      
      // Reset payment method jika "all" (string kosong)
      if (processedFilters.payment_method === '') {
          processedFilters.payment_method = '';
      }
      
      // Reset date jika kosong
      if (!processedFilters.sales_date_start) {
          processedFilters.sales_date_start = '';
      }
      
      if (!processedFilters.sales_date_end) {
          processedFilters.sales_date_end = '';
      }
      
      console.log('✅ Processed filters:', processedFilters);
      
      setActiveFilters(processedFilters);
      setFilterModalOpen(false);
      setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  // Handle clear individual filter
  const handleClearFilter = (key: string) => {
      console.log('🗑️ Clearing filter:', key);
      
      const newFilters = { ...activeFilters };
      
      if (key === 'sales_date') {
          delete newFilters['sales_date_start'];
          delete newFilters['sales_date_end'];
      } else if (key === 'status') {
          // Set ke string kosong, bukan undefined
          newFilters[key] = '';
      } else if (key === 'payment_method') {
          newFilters[key] = '';
      } else {
          delete newFilters[key];
      }
      
      console.log('✅ New filters after clear:', newFilters);
      
      setActiveFilters(newFilters);
      setPagination(prev => ({ ...prev, current_page: 1 }));
  };
  
  // Handle clear all filters
  const handleClearAllFilters = () => {
    setActiveFilters({
      status: '',
      payment_method: '',
      sales_date_start: '',
      sales_date_end: '',
    });
    setPagination(prev => ({ ...prev, current_page: 1 }));
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

  const formatDateForDisplay = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Helper untuk menampilkan nilai filter
  const getFilterDisplayValue = (key: string, value: any): string => {
    if (key === 'status') {
      return value === '1' ? 'Paid' : 'Cancelled';
    }
    
    if (key === 'payment_method') {
      return value === 'cash' ? 'Cash' : value === 'debit' ? 'Debit' : 'QRIS';
    }
    
    // Format tanggal
    if (key.endsWith('_start') || key.endsWith('_end')) {
      if (value) {
        const date = new Date(value);
        return date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
    }
    
    return String(value);
  };

   const renderTableHeader = () => {
    const headers = [
      { key: 'sales_invoice_code', label: 'Kode Invoice', sortable: true, className: 'w-[150px]' },
      { key: 'sales_date', label: 'Tanggal', sortable: true },
      { key: 'customer_name', label: 'Pelanggan', sortable: true },
      { key: 'items', label: 'Barang', sortable: false },
      { key: 'sales_payment_method', label: 'Payment Method', sortable: true },
      { key: 'sales_grand_total', label: 'Grand Total', sortable: true, className: 'text-right' },
      { key: 'sales_status', label: 'Status', sortable: false },
      { key: 'actions', label: 'Aksi', sortable: false, className: 'text-right' },
    ];

    return (
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead 
              key={header.key} 
              className={header.className || ''}
            >
              {header.sortable ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort(header.key)}
                  className="h-auto p-0 font-medium hover:bg-transparent hover:text-primary"
                >
                  {header.label}
                  {getSortIcon(header.key)}
                </Button>
              ) : (
                header.label
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
    );
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [sortConfig]);

  // Fetch when perPage changes
  useEffect(() => {
    fetchSales(1);
  }, [perPage]);

  // Fetch when activeFilters changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeFilters]);

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
            {/* ✅ Export Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExport}
              disabled={exportLoading || loading}
            >
              {exportLoading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></span>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </>
              )}
            </Button>
            
            <Button asChild>
              <Link href={appRoutes.sales.create()}>
                <Plus className="mr-2 h-4 w-4" />
                Transaksi Baru
              </Link>
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="w-full space-y-3">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kode invoice, nama, tanggal (22 Jan), payment (cash/debit/qris), total (150rb)..."
                className="pl-9 w-full"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchInput('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Filter Modal Trigger */}
            <FilterModal
              schema={salesFilterSchema}
              initialFilters={activeFilters}
              onFilterChange={handleFilterChange}
              triggerText="Filter"
              triggerVariant="outline"
              triggerClassName="flex items-center justify-center gap-2 w-full sm:w-auto"
              open={filterModalOpen}
              onOpenChange={setFilterModalOpen}
            />
          </div>
          
          {/* Active Filters Display */}
          {getActiveFilterCount() > 0 && (
            <div className="w-full">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2 flex-1">
                  {/* Status Filter */}
                  {activeFilters.status && activeFilters.status !== '' && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      Status: {getFilterDisplayValue('status', activeFilters.status)}
                      <button 
                        onClick={() => handleClearFilter('status')}
                        className="hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {/* Payment Method Filter */}
                  {activeFilters.payment_method && activeFilters.payment_method !== '' && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      Payment: {getFilterDisplayValue('payment_method', activeFilters.payment_method)}
                      <button 
                        onClick={() => handleClearFilter('payment_method')}
                        className="hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {/* Date Range Filters */}
                  {activeFilters.sales_date_start && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      Dari: {formatDateForDisplay(activeFilters.sales_date_start as string)}
                      <button 
                        onClick={() => handleClearFilter('sales_date')}
                        className="hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  
                  {activeFilters.sales_date_end && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      Sampai: {formatDateForDisplay(activeFilters.sales_date_end as string)}
                      <button 
                        onClick={() => handleClearFilter('sales_date')}
                        className="hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="text-xs h-8 px-2 ml-2"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </div>

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
            {renderSortingIndicator()}
            <div className="rounded-md border">
              <Table>
                {renderTableHeader()}
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
                  ) : !sortedSales  || !Array.isArray(sortedSales) || sortedSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Tidak ada data transaksi
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedSales.map((sale) => (
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
                              {sale?.customer_name
                                ? sale.customer_name
                                : sale?.member
                                ? sale.member.member_name
                                : '-'}
                            </span>

                            {sale?.member && (
                              <span className="text-xs text-muted-foreground">
                                Kode: {sale.member.member_code}
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
                              <DropdownMenuItem asChild>
                                <Link
                                  href={appRoutes.sales.edit(sale.sales_invoice_code)}
                                  className="flex items-center"
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={appRoutes.sales.nota(sale.sales_invoice_code)}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Printer className="mr-2 h-4 w-4" />
                                  <span>Print</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              
                              {/* Menu Delete */}
                              <DropdownMenuItem 
                                onClick={() => handleDelete(sale)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                              
                              {/* Menu Cancel */}
                              {sale.sales_status && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleCancelSale(sale)}
                                    className="text-red-600"
                                  >
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
      <EditModal<SalesFormData>
        isOpen={isOpen}
        onClose={closeModal}
        title={modalTitle}
        data={editData}
        schema={schema}
        onSubmit={handleSubmitEdit}
        onDelete={handleDeleteEdit}
        isLoading={editLoading}
        deleteLoading={editDeleteLoading}
        showDelete={true}
        deleteConfirmMessage="Apakah Anda yakin ingin menghapus transaksi ini?"
        width={modalWidth} // Gunakan modalWidth dari hook
        maxHeight="85vh" // Sesuaikan max height
      />
      <Modal />
    </AppLayout>
  );
}