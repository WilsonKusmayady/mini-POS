// pages/reports/index.tsx
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
import { Calendar, Search, Download, Filter, Printer, User, Users } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberCombobox, type Member as MemberComboType } from '@/components/member-combobox';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: appRoutes.dashboard(),
  },
  {
    title: 'Reports',
    href: appRoutes.reports(),
  }
];

interface ReportData {
  date: string;
  invoice_code: string;
  customer_name: string;
  member_code: string | null;
  member_name: string | null;
  subtotal: number;
  discount: number;
  total_amount: number;
  payment_method: string;
  status: string;
}

interface Member {
  member_code: string;
  member_name: string;
  member_phone: string;
}

export default function ReportsPage() {
  const [transactionType, setTransactionType] = useState<'all' | 'sales' | 'purchase'>('all');
  const [customerType, setCustomerType] = useState<'all' | 'member' | 'nonmember'>('all');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
//   const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');

  // Set default dates
//   useEffect(() => {
//     const today = new Date();
//     const oneWeekAgo = new Date();
//     oneWeekAgo.setDate(today.getDate() - 7);
//     const oneMonthAgo = new Date();
//     oneMonthAgo.setMonth(today.getMonth() - 1);

//     if (dateRange === 'today') {
//       setStartDate(today.toISOString().split('T')[0]);
//       setEndDate(today.toISOString().split('T')[0]);
//     } else if (dateRange === 'week') {
//       setStartDate(oneWeekAgo.toISOString().split('T')[0]);
//       setEndDate(today.toISOString().split('T')[0]);
//     } else if (dateRange === 'month') {
//       setStartDate(oneMonthAgo.toISOString().split('T')[0]);
//       setEndDate(today.toISOString().split('T')[0]);
//     }
//   }, [dateRange]);

  // Load members when customer type is member
  useEffect(() => {
    if (customerType === 'member') {
      fetchMembers();
    } else {
      setSelectedMember('');
    }
  }, [customerType]);

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await axios.get('/api/members');
      setMembers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Gagal mengambil data member');
    } finally {
      setLoadingMembers(false);
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalAmount = 0;
    let totalDiscount = 0;
    let totalSubtotal = 0;
    let memberTransactions = 0;
    let nonMemberTransactions = 0;

    reportData.forEach(transaction => {
        totalAmount += Number(transaction.total_amount) || 0;
        totalDiscount += Number(transaction.discount) || 0;
        totalSubtotal += Number(transaction.subtotal) || 0;
        
        if (transaction.member_code) {
            memberTransactions++;
        } else {
            nonMemberTransactions++;
        }
    });

    return {
        totalTransactions: reportData.length,
        totalAmount: isNaN(totalAmount) ? 0 : totalAmount,
        totalDiscount: isNaN(totalDiscount) ? 0 : totalDiscount,
        totalSubtotal: isNaN(totalSubtotal) ? 0 : totalSubtotal,
        memberTransactions,
        nonMemberTransactions,
        averagePerTransaction: reportData.length > 0 ? totalAmount / reportData.length : 0
    };
  };

  const totals = calculateTotals();

  const handleSearch: FormEventHandler = async (e) => {
    e.preventDefault();
    
    // if (!startDate || !endDate) {
    //   toast.error('Harap pilih tanggal mulai dan tanggal akhir');
    //   return;
    // }
    
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
      return;
    }

    // if (customerType === 'member' && !selectedMember && transactionType !== 'purchase') {
    //   toast.error('Harap pilih member untuk filter member');
    //   return;
    // }

    try {
      setLoading(true);
      
      const response = await axios.get('/api/reports', {
        params: {
          type: transactionType,
          customer_type: customerType,
          member_code: selectedMember,
          start_date: startDate,
          end_date: endDate
        }
      });

      if (response.data.success) {
        setReportData(response.data.data || []);
        
        if (response.data.data?.length === 0) {
          toast.info('Tidak ada data transaksi pada periode yang dipilih');
        } else {
          toast.success(`Menampilkan ${response.data.data?.length || 0} transaksi`);
        }
      } else {
        toast.error(response.data.message || 'Gagal mengambil data report');
      }
      
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Gagal mengambil data report');
      }
      
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (reportData.length === 0) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }

    try {
      const response = await axios.get('/api/reports/export', {
        params: {
          type: transactionType,
          customer_type: customerType,
          member_code: selectedMember,
          start_date: startDate,
          end_date: endDate
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reports_${startDate}_to_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Data berhasil diexport');
      
    } catch (error) {
      console.error('Error exporting reports:', error);
      toast.error('Gagal mengexport data');
    }
  };

  const formatDateRange = (start: string, end: string) => {
    if (!start || !end) return '';

    if (start === end) {
      return formatDate(start);
    }

    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const handlePrint = () => {
    if (reportData.length === 0) {
      toast.error('Tidak ada data untuk dicetak');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Gagal membuka jendela cetak. Izinkan popup untuk website ini.');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Laporan Transaksi | ${formatDateRange(startDate, endDate)}</title>
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
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: 600;
              color: #475569;
            }
            .info-value {
              color: #1e293b;
              font-weight: 500;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 12px;
            }
            th {
              background-color: #4f46e5;
              color: white;
              font-weight: 600;
              padding: 10px;
              text-align: left;
              border: 1px solid #ddd;
            }
            td {
              padding: 8px;
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
              font-size: 11px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
              padding-top: 10px;
            }
            .member-badge {
              background: #10b981;
              color: white;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
            }
            .nonmember-badge {
              background: #6b7280;
              color: white;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
            }
            .status-paid {
              background: #dcfce7;
              color: #166534;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
            }
            .status-cancelled {
              background: #fee2e2;
              color: #991b1b;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
            }
            @media print {
              body {
                margin: 0;
                font-size: 11px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN TRANSAKSI</h1>
            <p>Periode: ${formatDateRange(startDate, endDate)}</p>
            <p>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
          
          <div class="filter-info">
            <div class="info-row">
              <span class="info-label">Jenis Transaksi:</span>
              <span class="info-value">${getTransactionTypeLabel(transactionType)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Jenis Customer:</span>
              <span class="info-value">${getCustomerTypeLabel(customerType)} ${selectedMember ? `(${selectedMember})` : ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Transaksi:</span>
              <span class="info-value">${totals.totalTransactions} transaksi</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Amount:</span>
              <span class="info-value">${formatCurrency(totals.totalAmount)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Diskon:</span>
              <span class="info-value">${formatCurrency(totals.totalDiscount)}</span>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>No Invoice</th>
                <th>Customer</th>
                <th>Subtotal (Rp)</th>
                <th>Diskon (Rp)</th>
                <th>Grand Total (Rp)</th>
                <th>Metode Bayar</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${formatDate(item.date)}</td>
                  <td>${item.invoice_code}</td>
                  <td>
                    <strong>${item.customer_name || item.member_name || '-'}</strong>
                    ${item.member_code 
                      ? `<br><span class="member-badge">Member: ${item.member_code}</span>` 
                      : ''
                    }
                  </td>
                  <td style="text-align: right;">${formatCurrency(item.subtotal)}</td>
                  <td style="text-align: right; color: #dc2626;">${formatCurrency(item.discount)}</td>
                  <td style="text-align: right;"><strong>${formatCurrency(item.total_amount)}</strong></td>
                  <td style="text-align: center;">${formatPaymentMethod(item.payment_method)}</td>
                  <td style="text-align: center;">
                    <span class="${item.status === '1' || item.status === 'Paid' ? 'status-paid' : 'status-cancelled'}">
                      ${item.status === '1' || item.status === 'Paid' ? 'Paid' : 'Cancelled'}
                    </span>
                  </td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3"><strong>TOTAL</strong></td>
                <td><strong>${totals.totalTransactions} transaksi (Member: ${totals.memberTransactions}, Non-Member: ${totals.nonMemberTransactions})</strong></td>
                <td style="text-align: right;"><strong>${formatCurrency(totals.totalSubtotal)}</strong></td>
                <td style="text-align: right; color: #dc2626;"><strong>${formatCurrency(totals.totalDiscount)}</strong></td>
                <td style="text-align: right;"><strong>${formatCurrency(totals.totalAmount)}</strong></td>
                <td colspan="2"></td>
              </tr>
            </tbody>
          </table>
          
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

  const formatPaymentMethod = (method: string) => {
    if (!method) return '-';
    return method
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
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

  const getTransactionTypeLabel = (type: string) => {
    switch(type) {
      case 'all': return 'Semua Transaksi';
      case 'sales': return 'Sales (Penjualan)';
      case 'purchase': return 'Purchase (Pembelian)';
      default: return type;
    }
  };

  const getCustomerTypeLabel = (type: string) => {
    switch(type) {
      case 'all': return 'Semua Customer';
      case 'member': return 'Member';
      case 'nonmember': return 'Non-Member';
      default: return type;
    }
  };

  const handleReset = () => {
    setTransactionType('all');
    setCustomerType('all');
    setSelectedMember('');
    setStartDate('');
    setEndDate('');
    setReportData([]);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Laporan Transaksi" />
      
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Laporan Transaksi
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Rekap transaksi sales dan purchase berdasarkan filter
              </p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Laporan
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
                  <Label>Jenis Customer</Label>
                  <Select
                    value={customerType}
                    onValueChange={(value: 'all' | 'member' | 'nonmember') => {
                      setCustomerType(value);
                      if (value !== 'member') {
                        setSelectedMember('');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Semua Customer</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="member">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Member</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="nonmember">Non-Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                
                
                {/* <div className="space-y-2">
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
                </div> */}
                <div className="space-y-2">
                  <Label>Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tanggal Akhir</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {customerType === 'member' && transactionType !== 'purchase' && (
                    <div className="space-y-2">
                    <Label>Pilih Member (opsional)</Label>
                    <MemberCombobox
                        value={selectedMember}
                        disabled={loadingMembers}
                        placeholder={loadingMembers ? 'Memuat...' : 'Pilih member atau kosongkan untuk semua'}
                        onSelect={(member: MemberComboType) => setSelectedMember(member.member_code)}
                        className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                        Kosongkan untuk menampilkan semua transaksi yang memiliki membership.
                    </p>
                    </div>
              )}
              
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={loading}

                >
                  {loading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Mencari...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Lihat Laporan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {reportData.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Transaksi</p>
                    <h3 className="text-2xl font-bold">{totals.totalTransactions}</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Member: {totals.memberTransactions}</span>
                  <span>Non-Member: {totals.nonMemberTransactions}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                    <h3 className="text-2xl font-bold">{formatCurrency(totals.totalAmount)}</h3>
                  </div>
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <span className="text-green-500 font-bold">Rp</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Rata-rata {formatCurrency(totals.averagePerTransaction)}/transaksi
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
                    <span className="text-red-500 font-bold">%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {(totals.totalAmount > 0 ? (totals.totalDiscount / totals.totalAmount * 100).toFixed(1) : 0)}% dari total
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Filter Aktif</p>
                    <h3 className="text-2xl font-bold">
                      {getTransactionTypeLabel(transactionType).split(' ')[0]}
                    </h3>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Filter className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {getCustomerTypeLabel(customerType)} • {formatDateRange(startDate, endDate)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Report Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Detail Transaksi</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {reportData.length > 0 
                  ? `${reportData.length} transaksi pada ${formatDateRange(startDate, endDate)}`
                  : 'Pilih filter dan klik "Lihat Laporan" untuk menampilkan data'
                }
              </p>
            </div>
            {reportData.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={reportData.length === 0}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={reportData.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : reportData.length > 0 ? (
              <div className="border rounded-lg">
                <div className="p-3 bg-muted/30 border-b">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">Filter Aktif:</span>
                      <Badge variant="outline">
                        {getTransactionTypeLabel(transactionType)}
                      </Badge>
                      <Badge variant={customerType === 'member' ? "default" : customerType === 'nonmember' ? "secondary" : "outline"}>
                        {getCustomerTypeLabel(customerType)}
                      </Badge>
                      {selectedMember && (
                        <Badge variant="default">
                          Member: {selectedMember}
                        </Badge>
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      Menampilkan {reportData.length} transaksi
                    </span>
                  </div>
                </div>
               <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>No Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Subtotal (Rp)</TableHead>
                      <TableHead className="text-right">Diskon (Rp)</TableHead>
                      <TableHead className="text-right">Grand Total (Rp)</TableHead>
                      <TableHead>Metode Bayar</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {formatDate(item.date)}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.invoice_code}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {item.customer_name || item.member_name || '-'}
                            </span>
                            {item.member_code && (
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant="default" className="text-xs py-0 px-2">
                                  <User className="w-3 h-3 mr-1" />
                                  {item.member_code}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.subtotal)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(item.discount)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(item.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatPaymentMethod(item.payment_method)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={item.status === '1' || item.status === 'Paid' 
                              ? "bg-green-100 text-green-800 border-green-300" 
                              : "bg-red-100 text-red-800 border-red-300"
                            }
                          >
                            {item.status === '1' || item.status === 'Paid' ? 'Paid' : 'Cancelled'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Total Row */}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={4}>
                        <div className="flex gap-4">
                          <span>TOTAL ({reportData.length} transaksi)</span>
                          <span className="text-muted-foreground font-normal">
                            Member: {totals.memberTransactions} | Non-Member: {totals.nonMemberTransactions}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.totalSubtotal)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(totals.totalDiscount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.totalAmount)}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {startDate && endDate ? 'Tidak ada data transaksi' : 'Belum ada filter yang dipilih'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {startDate && endDate 
                    ? 'Tidak ada transaksi pada periode dan filter yang dipilih'
                    : 'Pilih periode tanggal dan filter, lalu klik "Lihat Laporan"'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}