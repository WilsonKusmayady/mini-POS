// pages/summary/index.tsx
import AppLayout from '@/layouts/app-layout';
import { appRoutes } from '@/lib/app-routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Search, Download, Filter, BarChart3, TrendingUp, TrendingDown, Printer } from 'lucide-react';
import { FormEventHandler, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: appRoutes.dashboard(),
  },
  {
    title: 'Summary',
    href: appRoutes.summary(),
  }
];

interface SummaryData {
  date: string;
  transaction_count: number;
  total_transactions: number;
  total_discount: number;
  average_transaction: number;
  items_sold: number;
}

interface TransactionTypeSummary {
  date: string;
  purchase_count: number;
  purchase_total: number;
  sales_count: number;
  sales_total: number;
  total_discount: number;
}

export default function SummaryIndex() {
  const [transactionType, setTransactionType] = useState<'all' | 'sales' | 'purchase'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
  const [transactionSummary, setTransactionSummary] = useState<TransactionTypeSummary[]>([]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  
  // Ref untuk tabel yang akan di-print
  const tableRef = useRef<HTMLDivElement>(null);

  // Set default dates
  useEffect(() => {
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    if (dateRange === 'today') {
      setStartDate(today.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (dateRange === 'week') {
      setStartDate(oneWeekAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (dateRange === 'month') {
      setStartDate(oneMonthAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  }, [dateRange]);

  // Calculate totals
  const calculateTotals = () => {
    let totalTransactions = 0;
    let totalAmount = 0;
    let totalDiscount = 0;
    let totalItems = 0;

    summaryData.forEach(day => {
      totalTransactions += day.transaction_count;
      totalAmount += day.total_transactions;
      totalDiscount += day.total_discount;
      totalItems += day.items_sold;
    });

    return {
      totalTransactions,
      totalAmount,
      totalDiscount,
      totalItems,
      averagePerDay: summaryData.length > 0 ? totalAmount / summaryData.length : 0,
      averagePerTransaction: totalTransactions > 0 ? totalAmount / totalTransactions : 0
    };
  };

  const totals = calculateTotals();

  const handleSearch: FormEventHandler = async (e) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast.error('Harap pilih tanggal mulai dan tanggal akhir');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.get('/api/summary', {
        params: {
          type: transactionType,
          start_date: startDate,
          end_date: endDate
        }
      });

      if (response.data.success) {
        setSummaryData(response.data.summary || []);
        setTransactionSummary(response.data.transaction_summary || []);
        
        if (response.data.summary?.length === 0) {
          toast.info('Tidak ada data transaksi pada periode yang dipilih');
        } else {
          toast.success(`Menampilkan ${response.data.summary?.length || 0} hari transaksi`);
        }
      } else {
        toast.error(response.data.message || 'Gagal mengambil data summary');
      }
      
    } catch (error: any) {
      console.error('Error fetching summary:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Gagal mengambil data summary');
      }
      
      setSummaryData([]);
      setTransactionSummary([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (summaryData.length === 0) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }

    try {
      const response = await axios.get('/api/summary/export', {
        params: {
          type: transactionType,
          start_date: startDate,
          end_date: endDate
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `summary_${startDate}_to_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Data berhasil diexport');
      
    } catch (error) {
      console.error('Error exporting summary:', error);
      toast.error('Gagal mengexport data');
    }
  };

  const handlePrint = () => {
    if (summaryData.length === 0) {
      toast.error('Tidak ada data untuk dicetak');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Gagal membuka jendela cetak. Izinkan popup untuk website ini.');
      return;
    }

    const tableElement = tableRef.current;
    if (!tableElement) {
      toast.error('Tidak dapat menemukan tabel untuk dicetak');
      return;
    }

    // Filter data berdasarkan tanggal yang dipilih
    const filteredData = summaryData.filter(day => {
      const dayDate = new Date(day.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Set waktu ke awal hari untuk start dan akhir hari untuk end
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      dayDate.setHours(0, 0, 0, 0);
      
      return dayDate >= start && dayDate <= end;
    });

    // Recalculate totals for filtered data
    const printTotals = {
      totalTransactions: filteredData.reduce((sum, day) => sum + day.transaction_count, 0),
      totalAmount: filteredData.reduce((sum, day) => sum + day.total_transactions, 0),
      totalDiscount: filteredData.reduce((sum, day) => sum + day.total_discount, 0),
      totalItems: filteredData.reduce((sum, day) => sum + day.items_sold, 0),
      averagePerTransaction: filteredData.reduce((sum, day) => sum + day.transaction_count, 0) > 0 
        ? filteredData.reduce((sum, day) => sum + day.total_transactions, 0) / filteredData.reduce((sum, day) => sum + day.transaction_count, 0)
        : 0
    };

    // Filter transaction summary juga
    const filteredTransactionSummary = transactionSummary.filter(day => {
      const dayDate = new Date(day.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      dayDate.setHours(0, 0, 0, 0);
      
      return dayDate >= start && dayDate <= end;
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Summary Transaksi - ${formatDateRange(startDate, endDate)}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #4f46e5;
              padding-bottom: 15px;
            }
            .header h1 {
              color: #4f46e5;
              margin: 0;
              font-size: 24px;
            }
            .header p {
              color: #666;
              margin: 5px 0;
              font-size: 14px;
            }
            .filter-info {
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 15px;
              margin-bottom: 20px;
            }
            .filter-row {
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
              margin-bottom: 10px;
            }
            .filter-item {
              flex: 1;
              min-width: 200px;
            }
            .filter-label {
              font-weight: 600;
              color: #475569;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .filter-value {
              color: #1e293b;
              font-weight: 500;
              padding: 4px 8px;
              background: white;
              border-radius: 4px;
              border: 1px solid #e2e8f0;
            }
            .info-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 20px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: 600;
              color: #4b5563;
            }
            .info-value {
              font-weight: 600;
              color: #111827;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 14px;
            }
            th {
              background-color: #4f46e5;
              color: white;
              font-weight: 600;
              padding: 12px;
              text-align: left;
              border: 1px solid #ddd;
            }
            td {
              padding: 10px;
              border: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .total-row {
              background-color: #e0e7ff !important;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
              padding-top: 10px;
            }
            .date-range {
              background: #4f46e5;
              color: white;
              padding: 8px 16px;
              border-radius: 6px;
              font-weight: 600;
              margin: 10px 0;
              display: inline-block;
            }
            @media print {
              body {
                margin: 0;
                font-size: 12px;
              }
              .no-print {
                display: none;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN SUMMARY TRANSAKSI</h1>
            <div class="date-range">
              ${formatDateRange(startDate, endDate)}
            </div>
            <p>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} ${new Date().toLocaleTimeString('id-ID')}</p>
          </div>
          
          <div class="filter-info">
            <div class="filter-row">
              <div class="filter-item">
                <div class="filter-label">Periode Tanggal</div>
                <div class="filter-value">${formatDateRange(startDate, endDate)}</div>
              </div>
              <div class="filter-item">
                <div class="filter-label">Jenis Transaksi</div>
                <div class="filter-value">${getTransactionTypeLabel(transactionType)}</div>
              </div>
              <div class="filter-item">
                <div class="filter-label">Jumlah Hari</div>
                <div class="filter-value">${filteredData.length} hari</div>
              </div>
            </div>
          </div>
          
          <div class="info-box">
            <div class="info-row">
              <span class="info-label">Total Transaksi:</span>
              <span class="info-value">${printTotals.totalTransactions} transaksi</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Penjualan:</span>
              <span class="info-value">${formatCurrency(printTotals.totalAmount)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Diskon:</span>
              <span class="info-value">${formatCurrency(printTotals.totalDiscount)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Item Terjual:</span>
              <span class="info-value">${printTotals.totalItems} item</span>
            </div>
            <div class="info-row">
              <span class="info-label">Rata-rata per Transaksi:</span>
              <span class="info-value">${formatCurrency(printTotals.averagePerTransaction)}</span>
            </div>
          </div>
          
          <h2 style="color: #4f46e5; margin-top: 20px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;">
            📊 Ringkasan Transaksi Harian (${filteredData.length} hari)
          </h2>
          
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th style="text-align: right;">Jml Transaksi</th>
                <th style="text-align: right;">Item Terjual</th>
                <th style="text-align: right;">Total Transaksi</th>
                <th style="text-align: right;">Total Diskon</th>
                <th style="text-align: right;">Rata-rata/Transaksi</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((day, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${formatDate(day.date)}</td>
                  <td style="text-align: right;">${day.transaction_count}</td>
                  <td style="text-align: right;">${day.items_sold}</td>
                  <td style="text-align: right;">${formatCurrency(day.total_transactions)}</td>
                  <td style="text-align: right;">${formatCurrency(day.total_discount)}</td>
                  <td style="text-align: right;">${formatCurrency(day.average_transaction)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="2"><strong>TOTAL (${filteredData.length} hari)</strong></td>
                <td style="text-align: right;"><strong>${printTotals.totalTransactions}</strong></td>
                <td style="text-align: right;"><strong>${printTotals.totalItems}</strong></td>
                <td style="text-align: right;"><strong>${formatCurrency(printTotals.totalAmount)}</strong></td>
                <td style="text-align: right;"><strong>${formatCurrency(printTotals.totalDiscount)}</strong></td>
                <td style="text-align: right;"><strong>${formatCurrency(printTotals.averagePerTransaction)}</strong></td>
              </tr>
            </tbody>
          </table>
          
          ${transactionType === 'all' && filteredTransactionSummary.length > 0 ? `
            <h2 style="margin-top: 30px; color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
              📈 Perbandingan Purchase vs Sales (${filteredTransactionSummary.length} hari)
            </h2>
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th style="text-align: right;">Purchase</th>
                  <th style="text-align: right;">Sales</th>
                  <th style="text-align: right;">Selisih</th>
                  <th style="text-align: right;">Diskon</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTransactionSummary.map((day, index) => {
                  const difference = day.sales_total - day.purchase_total;
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${formatDate(day.date)}</td>
                      <td style="text-align: right;">
                        <div>${day.purchase_count} transaksi</div>
                        <div>${formatCurrency(day.purchase_total)}</div>
                      </td>
                      <td style="text-align: right;">
                        <div>${day.sales_count} transaksi</div>
                        <div>${formatCurrency(day.sales_total)}</div>
                      </td>
                      <td style="text-align: right;">
                        <div style="color: ${difference >= 0 ? '#059669' : '#dc2626'}; font-weight: 600;">
                          ${formatCurrency(difference)}
                        </div>
                      </td>
                      <td style="text-align: right;">${formatCurrency(day.total_discount)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          ` : ''}
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => {
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    toast.success('Mempersiapkan dokumen untuk dicetak...');
  };

  const formatDateRange = (start: string, end: string) => {
    if (!start || !end) return '';

    if (start === end) {
      return formatDate(start);
    }

    return `${formatDate(start)} - ${formatDate(end)}`;
  };


  // Helper functions untuk print
  const getTransactionTypeLabel = (type: string) => {
    switch(type) {
      case 'all': return 'Semua Transaksi';
      case 'sales': return 'Sales (Penjualan)';
      case 'purchase': return 'Purchase (Pembelian)';
      default: return type;
    }
  };

  const getDateRangeLabel = (range: string) => {
    switch(range) {
      case 'today': return 'Hari Ini';
      case 'week': return '1 Minggu Terakhir';
      case 'month': return '1 Bulan Terakhir';
      case 'custom': return 'Custom Tanggal';
      default: return range;
    }
  };

  const formatDatePrint = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Summary Transaksi" />
      
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Summary Transaksi
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Ringkasan transaksi harian dan statistik
              </p>
            </div>
          </div>
          
          {/* Hapus tombol export dari header utama */}
        </div>

        {/* Filter Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Summary
              {startDate && endDate && (
                <Badge variant="outline" className="ml-2">
                  {formatDateRange(startDate, endDate)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Jenis Transaksi</Label>
                  <Select
                    value={transactionType}
                    onValueChange={(value: 'all' | 'sales' | 'purchase') => 
                      setTransactionType(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis transaksi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Transaksi</SelectItem>
                      <SelectItem value="sales">Sales (Penjualan)</SelectItem>
                      <SelectItem value="purchase">Purchase (Pembelian)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Rentang Waktu</Label>
                  <Select
                    value={dateRange}
                    onValueChange={(value: 'today' | 'week' | 'month' | 'custom') => {
                      setDateRange(value);
                      if (value !== 'custom') {
                        setStartDate('');
                        setEndDate('');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih rentang waktu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Hari Ini</SelectItem>
                      <SelectItem value="week">1 Minggu Terakhir</SelectItem>
                      <SelectItem value="month">1 Bulan Terakhir</SelectItem>
                      <SelectItem value="custom">Custom Tanggal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDateRange('custom');
                    }}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tanggal Akhir</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDateRange('custom');
                    }}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setTransactionType('all');
                    setDateRange('today');
                    setSummaryData([]);
                    setTransactionSummary([]);
                  }}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !startDate || !endDate}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Mencari...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Lihat Summary
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {summaryData.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Transaksi</p>
                    <h3 className="text-2xl font-bold">{totals.totalTransactions}</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Rata-rata {totals.averagePerTransaction.toFixed(0)} transaksi/hari
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Penjualan</p>
                    <h3 className="text-2xl font-bold">{formatCurrency(totals.totalAmount)}</h3>
                  </div>
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Rata-rata {formatCurrency(totals.averagePerDay)}/hari
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Diskon</p>
                    <h3 className="text-2xl font-bold text-red-600">
                      {formatCurrency(totals.totalDiscount)}
                    </h3>
                  </div>
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {(totals.totalAmount > 0 ? (totals.totalDiscount / totals.totalAmount * 100).toFixed(1) : 0)}% dari total penjualan
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Item Terjual</p>
                    <h3 className="text-2xl font-bold">{totals.totalItems}</h3>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Rata-rata {(totals.totalTransactions > 0 ? totals.totalItems / totals.totalTransactions : 0).toFixed(1)} item/transaksi
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transaction Summary Table */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Sales Summary Table */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ringkasan Transaksi Harian</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Perincian transaksi per hari {formatDateRange(startDate, endDate)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={summaryData.length === 0 || loading}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print 
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={summaryData.length === 0 || loading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : summaryData.length > 0 ? (
                <div className="border rounded-lg" ref={tableRef}>
                  <div className="p-3 bg-muted/30 border-b">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">Filter Aktif:</span>
                        <Badge variant="outline">
                          {formatDateRange(startDate, endDate)}
                        </Badge>
                        <Badge variant="secondary">
                          {getTransactionTypeLabel(transactionType)}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground">
                        Menampilkan {summaryData.length} hari transaksi
                      </span>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-right">Jumlah Transaksi</TableHead>
                        <TableHead className="text-right">Item Terjual</TableHead>
                        <TableHead className="text-right">Total Transaksi</TableHead>
                        <TableHead className="text-right">Total Diskon</TableHead>
                        <TableHead className="text-right">Rata-rata/Transaksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summaryData.map((day, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {formatDate(day.date)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{day.transaction_count}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {day.items_sold}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(day.total_transactions)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(day.total_discount)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrency(day.average_transaction)}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Total Row */}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>TOTAL ({summaryData.length} hari)</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="default">{totals.totalTransactions}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{totals.totalItems}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totals.totalAmount)}</TableCell>
                        <TableCell className="text-right text-red-600">{formatCurrency(totals.totalDiscount)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(totals.averagePerTransaction)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Tidak ada data transaksi
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Pilih periode tanggal dan klik "Lihat Summary" untuk menampilkan data
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase vs Sales Comparison */}
          {transactionSummary.length > 0 && transactionType === 'all' && (
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Perbandingan Purchase vs Sales</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Filter data untuk print
                      const filteredForPrint = transactionSummary.filter(day => {
                        const dayDate = new Date(day.date);
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        
                        start.setHours(0, 0, 0, 0);
                        end.setHours(23, 59, 59, 999);
                        dayDate.setHours(0, 0, 0, 0);
                        
                        return dayDate >= start && dayDate <= end;
                      });

                      const printContent = `
                        <html>
                          <head>
                            <title>Perbandingan Purchase vs Sales - ${formatDate(startDate)} sampai ${formatDate(endDate)}</title>
                            <style>
                              body { font-family: 'Segoe UI', sans-serif; margin: 20px; }
                              h1 { color: #4f46e5; text-align: center; }
                              .filter-info {
                                background: #f1f5f9;
                                padding: 10px;
                                border-radius: 6px;
                                margin: 15px 0;
                                font-size: 14px;
                              }
                              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                              th { background-color: #4f46e5; color: white; }
                              .footer {
                                margin-top: 30px;
                                text-align: center;
                                font-size: 12px;
                                color: #6b7280;
                              }
                            </style>
                          </head>
                          <body>
                            <h1>Perbandingan Purchase vs Sales</h1>
                            <div class="filter-info">
                              <strong>Periode:</strong> ${formatDate(startDate)} - ${formatDate(endDate)}<br>
                              <strong>Jumlah Data:</strong> ${filteredForPrint.length} hari<br>
                              <strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID')}
                            </div>
                            <table>
                              <thead>
                                <tr>
                                  <th>No</th>
                                  <th>Tanggal</th>
                                  <th>Purchase</th>
                                  <th>Sales</th>
                                  <th>Selisih</th>
                                  <th>Diskon</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${filteredForPrint.map((day, index) => {
                                  const difference = day.sales_total - day.purchase_total;
                                  return `
                                    <tr>
                                      <td>${index + 1}</td>
                                      <td>${formatDate(day.date)}</td>
                                      <td>
                                        <div>${day.purchase_count} transaksi</div>
                                        <div>${formatCurrency(day.purchase_total)}</div>
                                      </td>
                                      <td>
                                        <div>${day.sales_count} transaksi</div>
                                        <div>${formatCurrency(day.sales_total)}</div>
                                      </td>
                                      <td style="color: ${difference >= 0 ? 'green' : 'red'}">
                                        ${formatCurrency(difference)}
                                      </td>
                                      <td>${formatCurrency(day.total_discount)}</td>
                                    </tr>
                                  `;
                                }).join('')}
                              </tbody>
                            </table>
                            <div class="footer">
                              <p>Dicetak dari Sistem Manajemen Transaksi • Periode: ${formatDate(startDate)} - ${formatDate(endDate)}</p>
                            </div>
                          </body>
                        </html>
                      `;
                      
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(printContent);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }}
                    disabled={transactionSummary.length === 0}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-muted/30 rounded-md">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      Periode: {formatDate(startDate)} - {formatDate(endDate)}
                    </span>
                    <span className="text-muted-foreground">
                      {transactionSummary.length} hari data
                    </span>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Purchase</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">Selisih</TableHead>
                      <TableHead className="text-right">Diskon</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionSummary.map((day, index) => {
                      const difference = day.sales_total - day.purchase_total;
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {formatDate(day.date)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">{day.purchase_count} transaksi</span>
                              <span>{formatCurrency(day.purchase_total)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">{day.sales_count} transaksi</span>
                              <span className="text-green-600">{formatCurrency(day.sales_total)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={difference >= 0 ? "default" : "destructive"}>
                              {formatCurrency(difference)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(day.total_discount)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Transaction Type Breakdown */}
        {transactionType === 'all' && (
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Jenis Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="sales" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sales">Sales ({summaryData.reduce((acc, day) => acc + day.transaction_count, 0)})</TabsTrigger>
                  <TabsTrigger value="details">Detail Harian</TabsTrigger>
                </TabsList>
                
                <TabsContent value="sales" className="space-y-4">
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Grafik distribusi transaksi akan ditampilkan di sini
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>Data detail harian untuk analisis lebih lanjut:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Jam dengan transaksi terbanyak: 10:00 - 12:00</li>
                      <li>Produk terlaris: [Nama Produk]</li>
                      <li>Member paling aktif: [Nama Member]</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}