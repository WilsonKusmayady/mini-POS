import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Link, Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, ShoppingCart, UserPlus, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Area, AreaChart } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: dashboard().url,
  },
];

interface DashboardStats {
  sales: {
    total: number;
    change_percentage: number;
    is_positive: boolean;
  };
  members: {
    total: number;
    new_this_month: number;
    change_percentage: number;
    is_positive: boolean;
  };
  customers: {
    new_this_month: number;
    change_percentage: number;
    is_positive: boolean;
  };
  revenue: {
    current_month: number;
    last_month: number;
    change_percentage: number;
    is_positive: boolean;
  };
}

interface ChartData {
  historical: {
    months: string[];
    revenues: number[];
    transactions: number[];
    targets: number[];
  };
  projection: {
    months: string[];
    revenues: number[];
  };
}

interface Activity {
  id: number;
  type: 'transaction' | 'member' | 'stock' | 'cancellation' | 'system';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [activeChart, setActiveChart] = useState<'revenue' | 'transactions' | 'projection'>('revenue');
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await axios.get('/api/dashboard/activities');
      if (response.data.success) {
        setActivities(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      // Fallback ke data dummy jika API error
      setActivities([
        {
          id: 1,
          type: 'transaction',
          title: 'Transaksi baru selesai',
          description: 'INV2312010001 - Rp 250.000',
          timestamp: '5 menit lalu',
          icon: 'transaction'
        },
        {
          id: 2,
          type: 'member',
          title: 'Member baru terdaftar',
          description: 'MEM00123 - John Doe',
          timestamp: '2 jam lalu',
          icon: 'member'
        },
        {
          id: 3,
          type: 'stock',
          title: 'Stok barang diperbarui',
          description: 'BRG001 - Kopi Arabica (+50)',
          timestamp: '1 hari lalu',
          icon: 'stock'
        },
        {
          id: 4,
          type: 'cancellation',
          title: 'Transaksi dibatalkan',
          description: 'INV2311300005 - Rp 150.000',
          timestamp: '2 hari lalu',
          icon: 'cancellation'
        }
      ]);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsResponse = await axios.get('/api/dashboard/stats');
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      // Fetch chart data
      const chartResponse = await axios.get('/api/dashboard/sales-chart');
      if (chartResponse.data.success) {
        setChartData(chartResponse.data.data);
      }

      // Fetch activities
      const activitiesResponse = await axios.get('/api/dashboard/activities');
      if (activitiesResponse.data.success) {
        // console.log('📊 Activities received:', {
        //     count: activitiesResponse.data.data.length,
        //     activities: activitiesResponse.data.data.map((a: Activity) => ({
        //         type: a.type,
        //         title: a.title,
        //         timestamp: a.timestamp
        //     }))
        // });
        setActivities(activitiesResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const formatPercentage = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num);
  };

  // Helper functions with null checks
  const getSalesTotal = () => stats?.sales?.total || 0;
  const getSalesChangePercentage = () => stats?.sales?.change_percentage || 0;
  const getSalesIsPositive = () => stats?.sales?.is_positive || false;

  const getMembersTotal = () => stats?.members?.total || 0;
  const getMembersNewThisMonth = () => stats?.members?.new_this_month || 0;
  const getMembersChangePercentage = () => stats?.members?.change_percentage || 0;
  const getMembersIsPositive = () => stats?.members?.is_positive || false;

  const getCustomersNewThisMonth = () => stats?.customers?.new_this_month || 0;
  const getCustomersChangePercentage = () => stats?.customers?.change_percentage || 0;
  const getCustomersIsPositive = () => stats?.customers?.is_positive || false;

  const getRevenueCurrentMonth = () => stats?.revenue?.current_month || 0;
  const getRevenueLastMonth = () => stats?.revenue?.last_month || 0;
  const getRevenueChangePercentage = () => stats?.revenue?.change_percentage || 0;
  const getRevenueIsPositive = () => stats?.revenue?.is_positive || false;

  // Fungsi untuk mendapatkan warna berdasarkan tipe aktivitas
  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'transaction': return 'bg-green-500';
      case 'member': return 'bg-blue-500';
      case 'stock': return 'bg-purple-500';
      case 'cancellation': return 'bg-amber-500';
      case 'system': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // Fungsi untuk memformat waktu relatif
  const formatRelativeTime = (timestamp: string) => {
    // Jika timestamp sudah dalam format relatif (contoh: "5 menit lalu")
    if (timestamp.includes('lalu') || timestamp.includes('yang')) {
      return timestamp;
    }
    
    // Jika timestamp adalah ISO string
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / 60000);
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} menit lalu`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} jam lalu`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} hari lalu`;
    }
  };

  // Prepare chart data for recharts
  const prepareChartData = () => {
    if (!chartData) return [];
    
    return chartData.historical.months.map((month, index) => ({
      month,
      revenue: chartData.historical.revenues[index],
      transactions: chartData.historical.transactions[index],
      target: chartData.historical.targets[index],
    }));
  };

  // Prepare projection data
  const prepareProjectionData = () => {
    if (!chartData) return [];
    
    return chartData.projection.months.map((month, index) => ({
      month,
      projection: chartData.projection.revenues[index],
    }));
  };

  // Revenue chart config
  const revenueChartConfig = {
    revenue: {
      label: "Revenue Aktual",
      color: "#3b82f6",
    },
    target: {
      label: "Target",
      color: "#ef4444",
    },
  };

  // Transactions chart config
  const transactionsChartConfig = {
    transactions: {
      label: "Transaksi",
      color: "#8b5cf6",
    },
  };

  // Projection chart config
  const projectionChartConfig = {
    projection: {
      label: "Proyeksi Revenue",
      color: "#10b981",
    },
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="flex flex-col gap-6 p-6 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Ringkasan performa dan proyeksi penjualan
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
          {/* Total Transaksi Bulan Ini */}
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Transaksi
              </CardTitle>
              <div className={`p-2 rounded-full ${getSalesIsPositive() ? 'bg-green-100' : 'bg-red-100'}`}>
                <ShoppingCart className={`h-4 w-4 ${getSalesIsPositive() ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatNumber(getSalesTotal())}
                  </div>
                  <div className="flex items-center text-xs mt-1">
                    {getSalesIsPositive() ? (
                      <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="mr-1 h-4 w-4 text-red-600" />
                    )}
                    <Badge variant={getSalesIsPositive() ? "outline" : "destructive"} className="text-xs h-5">
                      {getSalesChangePercentage() >= 0 ? '+' : ''}
                      {formatPercentage(getSalesChangePercentage())}%
                    </Badge>
                    <span className="text-muted-foreground ml-2">vs bulan lalu</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Member */}
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Member
              </CardTitle>
              <div className="p-2 rounded-full bg-blue-100">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatNumber(getMembersTotal())}
                  </div>
                  <div className="flex items-center text-xs mt-1">
                    <div className="flex items-center">
                      <UserPlus className="mr-1 h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-600">
                        +{formatNumber(getMembersNewThisMonth())}
                      </span>
                      <span className="text-muted-foreground ml-1">baru bulan ini</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Customer Baru Bulan Ini */}
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Customer Baru
              </CardTitle>
              <div className={`p-2 rounded-full ${getCustomersIsPositive() ? 'bg-green-100' : 'bg-red-100'}`}>
                <UserPlus className={`h-4 w-4 ${getCustomersIsPositive() ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatNumber(getCustomersNewThisMonth())}
                  </div>
                  <div className="flex items-center text-xs mt-1">
                    {getCustomersIsPositive() ? (
                      <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="mr-1 h-4 w-4 text-red-600" />
                    )}
                    <Badge variant={getCustomersIsPositive() ? "outline" : "destructive"} className="text-xs h-5">
                      {getCustomersChangePercentage() >= 0 ? '+' : ''}
                      {formatPercentage(getCustomersChangePercentage())}%
                    </Badge>
                    <span className="text-muted-foreground ml-2">vs bulan lalu</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Revenue Bulan Ini */}
          <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Revenue Bulan Ini
              </CardTitle>
              <div className={`p-2 rounded-full ${getRevenueIsPositive() ? 'bg-green-100' : 'bg-red-100'}`}>
                <DollarSign className={`h-4 w-4 ${getRevenueIsPositive() ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(getRevenueCurrentMonth())}
                  </div>
                  <div className="flex items-center text-xs mt-1">
                    {getRevenueIsPositive() ? (
                      <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="mr-1 h-4 w-4 text-red-600" />
                    )}
                    <Badge variant={getRevenueIsPositive() ? "outline" : "destructive"} className="text-xs h-5">
                      {getRevenueChangePercentage() >= 0 ? '+' : ''}
                      {formatPercentage(getRevenueChangePercentage())}%
                    </Badge>
                    <span className="text-muted-foreground ml-2">vs bulan lalu</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-1 w-full">
          {/* Revenue Chart */}
          <Card className="w-full">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Performa Penjualan</CardTitle>
                  <CardDescription>
                    Revenue dan transaksi 6 bulan terakhir
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={activeChart === 'revenue' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveChart('revenue')}
                  >
                    Revenue
                  </Button>
                  <Button
                    variant={activeChart === 'transactions' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveChart('transactions')}
                  >
                    Transaksi
                  </Button>
                  <Button
                    variant={activeChart === 'projection' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveChart('projection')}
                  >
                    Proyeksi
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="w-full">
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : chartData ? (
                <>
                  {activeChart === 'revenue' && (
                    <div className="space-y-6 w-full">
                      <div className="w-full h-72">
                        <ChartContainer
                          config={revenueChartConfig}
                          className="w-full h-full"
                        >
                          <AreaChart
                            data={prepareChartData()}
                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="month" 
                              tick={{ fontSize: 12 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => `${formatNumber(value)}`}
                            />
                            <ChartTooltip 
                              content={
                                <ChartTooltipContent 
                                  labelFormatter={(value) => `Bulan: ${value}`}
                                  formatter={(value, name) => [
                                    name === 'revenue' ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                                    name === 'revenue' ? 'Revenue Aktual' : ' Target'
                                  ]}
                                />
                              }
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="var(--color-revenue)"
                              fill="var(--color-revenue)"
                              fillOpacity={0.2}
                              strokeWidth={2}
                              name="Revenue Aktual"
                            />
                            <Area
                              type="monotone"
                              dataKey="target"
                              stroke="var(--color-target)"
                              fill="var(--color-target)"
                              fillOpacity={0.2}
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              name="Target"
                            />
                          </AreaChart>
                        </ChartContainer>
                      </div>
                      
                      {/* Data points */}
                      {/* <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
                        {chartData.historical.revenues.map((revenue, index) => (
                          <div key={index} className="text-center">
                            <div className="text-sm font-medium truncate">
                              {chartData.historical.months[index]}
                            </div>
                            <div className="text-lg font-bold text-blue-600 truncate">
                              {revenue === 0 ? 'Rp 0' : formatCurrency(revenue)}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {chartData.historical.targets[index] > 0 
                                ? `Target: ${formatCurrency(chartData.historical.targets[index])}`
                                : 'Belum ada target'}
                            </div>
                          </div>
                        ))}
                      </div> */}
                    </div>
                  )}
                  
                  {activeChart === 'transactions' && (
                    <div className="space-y-6 w-full">
                      <div className="w-full h-72">
                        <ChartContainer
                          config={transactionsChartConfig}
                          className="w-full h-full"
                        >
                          <BarChart
                            data={prepareChartData()}
                            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="month" 
                              tick={{ fontSize: 12 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <ChartTooltip 
                              content={
                                <ChartTooltipContent 
                                  labelFormatter={(value) => `Bulan: ${value}`}
                                  formatter={(value) => [formatNumber(Number(value)), ' Transaksi']}
                                />
                              }
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar
                              dataKey="transactions"
                              fill="var(--color-transactions)"
                              radius={[4, 4, 0, 0]}
                              name="Transaksi"
                            />
                          </BarChart>
                        </ChartContainer>
                      </div>
                      
                      {/* Data points */}
                      {/* <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
                        {chartData.historical.transactions.map((transaction, index) => (
                          <div key={index} className="text-center">
                            <div className="text-sm font-medium truncate">
                              {chartData.historical.months[index]}
                            </div>
                            <div className="text-lg font-bold text-purple-600">
                              {formatNumber(transaction)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              transaksi
                            </div>
                          </div>
                        ))}
                      </div> */}
                    </div>
                  )}
                  
                  {activeChart === 'projection' && (
                    <div className="space-y-8 w-full">
                      {/* Revenue vs Target Section */}
                      <div className="w-full">
                        <h3 className="text-lg font-semibold mb-4">Revenue vs Target</h3>
                        
                        <div className="w-full h-72">
                          <ChartContainer
                            config={revenueChartConfig}
                            className="w-full h-full"
                          >
                            <LineChart
                              data={prepareChartData()}
                              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis 
                                dataKey="month" 
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis 
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${formatNumber(value)}`}
                              />
                              <ChartTooltip 
                                content={
                                  <ChartTooltipContent 
                                    labelFormatter={(value) => `Bulan: ${value}`}
                                    formatter={(value, name) => [
                                      name === 'revenue' ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                                      name === 'revenue' ? ' Revenue Aktual' : ' Target'
                                    ]}
                                  />
                                }
                              />
                              <ChartLegend content={<ChartLegendContent />} />
                              <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="var(--color-revenue)"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                                name="Revenue Aktual"
                              />
                              <Line
                                type="monotone"
                                dataKey="target"
                                stroke="var(--color-target)"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                                name="Target"
                              />
                            </LineChart>
                          </ChartContainer>
                        </div>
                        
                        {/* Data points */}
                        {/* <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6 w-full">
                          {chartData.historical.months.map((month, index) => (
                            <div key={index} className="text-center">
                              <div className="text-sm font-medium truncate">{month}</div>
                              <div className="text-sm text-blue-600 truncate">
                                Rp {chartData.historical.revenues[index].toLocaleString('id-ID')}
                              </div>
                              <div className="text-xs text-red-600 truncate">
                                Target: Rp {chartData.historical.targets[index].toLocaleString('id-ID')}
                              </div>
                            </div>
                          ))}
                        </div> */}
                      </div>
                      
                      {/* Proyeksi Section */}
                      <div className="w-full">
                        <h3 className="text-lg font-semibold mb-4">Proyeksi 3 Bulan Ke Depan</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                          {chartData.projection.revenues.map((revenue, index) => (
                            <Card key={index} className={`
                              w-full bg-gradient-to-br from-green-50 to-emerald-50 border-green-200
                              ${index === 0 ? 'from-blue-50 to-indigo-50 border-blue-200' : ''}
                              ${index === 2 ? 'from-purple-50 to-violet-50 border-purple-200' : ''}
                            `}>
                              <CardContent className="pt-6">
                                <div className="text-center">
                                  <div className={`text-lg font-semibold ${
                                    index === 0 ? 'text-blue-800' : 
                                    index === 2 ? 'text-purple-800' : 
                                    'text-green-800'
                                  }`}>
                                    {chartData.projection.months[index]}
                                  </div>
                                  <div className={`text-2xl font-bold mt-3 ${
                                    index === 0 ? 'text-blue-700' : 
                                    index === 2 ? 'text-purple-700' : 
                                    'text-green-700'
                                  }`}>
                                    {formatCurrency(revenue)}
                                  </div>
                                  <div className={`text-sm mt-1 ${
                                    index === 0 ? 'text-blue-600' : 
                                    index === 2 ? 'text-purple-600' : 
                                    'text-green-600'
                                  }`}>
                                    Estimasi revenue
                                  </div>
                                  <div className="mt-4">
                                    <Badge variant="outline" className={`
                                      bg-white ${
                                        index === 0 ? 'text-blue-700 border-blue-300' : 
                                        index === 2 ? 'text-purple-700 border-purple-300' : 
                                        'text-green-700 border-green-300'
                                      }`}>
                                      +10% dari rata-rata
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        
                        {/* Projection Chart */}
                        <div className="mt-8 w-full">
                          <div className="w-full h-72">
                            <ChartContainer
                              config={projectionChartConfig}
                              className="w-full h-full"
                            >
                              <AreaChart
                                data={prepareProjectionData()}
                                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                  dataKey="month" 
                                  tick={{ fontSize: 12 }}
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <YAxis 
                                  tick={{ fontSize: 12 }}
                                  tickLine={false}
                                  axisLine={false}
                                  tickFormatter={(value) => `Rp ${formatNumber(value)}`}
                                />
                                <ChartTooltip 
                                  content={
                                    <ChartTooltipContent 
                                      labelFormatter={(value) => `Bulan: ${value}`}
                                      formatter={(value) => [formatCurrency(Number(value)), 'Proyeksi Revenue']}
                                    />
                                  }
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Area
                                  type="monotone"
                                  dataKey="projection"
                                  stroke="var(--color-projection)"
                                  fill="var(--color-projection)"
                                  fillOpacity={0.2}
                                  strokeWidth={2}
                                  name="Proyeksi Revenue"
                                />
                              </AreaChart>
                            </ChartContainer>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-64 items-center justify-center w-full">
                  <p className="text-muted-foreground">Tidak ada data chart</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Side Cards - Quick Stats and Recent Activity */}
          <div className="grid gap-6 lg:grid-cols-2 w-full">
            {/* Quick Stats */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Statistik Cepat</CardTitle>
                <CardDescription>Rata-rata dan performa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Avg. Transaksi</span>
                      <span className="font-medium">
                        {formatCurrency(
                          getSalesTotal() > 0 
                            ? getRevenueCurrentMonth() / getSalesTotal() 
                            : 0
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Growth Revenue</span>
                      <Badge variant={getRevenueIsPositive() ? "outline" : "destructive"}>
                        {getRevenueChangePercentage() >= 0 ? '+' : ''}
                        {formatPercentage(getRevenueChangePercentage())}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Growth Transaksi</span>
                      <Badge variant={getSalesIsPositive() ? "outline" : "destructive"}>
                        {getSalesChangePercentage() >= 0 ? '+' : ''}
                        {formatPercentage(getSalesChangePercentage())}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Customer Growth</span>
                      <Badge variant={getCustomersIsPositive() ? "outline" : "destructive"}>
                        {getCustomersChangePercentage() >= 0 ? '+' : ''}
                        {formatPercentage(getCustomersChangePercentage())}%
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                    <CardTitle>Aktivitas Terbaru</CardTitle>
                    <CardDescription>Aktivitas sistem terkini</CardDescription>
                    </div>
                    <Link href="/activities">
                    {/* <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                    </Button> */}
                    </Link>
                </CardHeader>
                <CardContent>
                    {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-start">
                            <Skeleton className="w-2 h-2 rounded-full mt-2 mr-3" />
                            <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            </div>
                            <Skeleton className="h-3 w-16 ml-2" />
                        </div>
                        ))}
                    </div>
                    ) : activities.length > 0 ? (
                    <div className="space-y-4">
                        {activities.slice(0, 4).map((activity) => ( // Hanya tampilkan 4 aktivitas pertama
                        <div key={activity.id} className="flex items-start hover:bg-gray-50 p-2 rounded-lg transition-colors">
                            <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full mt-2 mr-3`}></div>
                            <div className="flex-1">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.description}</p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(activity.timestamp)}
                            </span>
                        </div>
                        ))}
                        {/* Tampilkan indikator jika ada lebih dari 4 aktivitas */}
                        {/* {activities.length > 4 && (
                        <div className="pt-2 border-t">
                            <p className="text-xs text-center text-muted-foreground">
                            +{activities.length - 4} aktivitas lainnya
                            </p>
                        </div>
                        )} */}
                    </div>
                    ) : (
                    <div className="text-center py-6">
                        <div className="text-muted-foreground mb-2">📊</div>
                        <p className="text-sm text-muted-foreground">Belum ada aktivitas</p>
                    </div>
                    )}
                </CardContent>
                </Card>
          </div>
        </div>

        {/* Performance Summary */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Ringkasan Performa</CardTitle>
            <CardDescription>Bulan ini vs bulan lalu</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2 p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Revenue</div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{formatCurrency(getRevenueCurrentMonth())}</div>
                    <Badge variant={getRevenueIsPositive() ? "outline" : "destructive"}>
                      {getRevenueIsPositive() ? '+' : ''}
                      {formatPercentage(getRevenueChangePercentage())}%
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Bulan lalu: {formatCurrency(getRevenueLastMonth())}
                  </div>
                </div>
                
                <div className="space-y-2 p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Transaksi</div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{formatNumber(getSalesTotal())}</div>
                    <Badge variant={getSalesIsPositive() ? "outline" : "destructive"}>
                      {getSalesIsPositive() ? '+' : ''}
                      {formatPercentage(getSalesChangePercentage())}%
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Bulan lalu: {formatNumber(
                      getSalesTotal() - Math.round(getSalesTotal() * getSalesChangePercentage() / 100)
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Member Baru</div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{formatNumber(getMembersNewThisMonth())}</div>
                    <Badge variant={getMembersIsPositive() ? "outline" : "destructive"}>
                      {getMembersIsPositive() ? '+' : ''}
                      {formatPercentage(getMembersChangePercentage())}%
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total member: {formatNumber(getMembersTotal())}
                  </div>
                </div>
                
                <div className="space-y-2 p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground">Customer Baru</div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{formatNumber(getCustomersNewThisMonth())}</div>
                    <Badge variant={getCustomersIsPositive() ? "outline" : "destructive"}>
                      {getCustomersIsPositive() ? '+' : ''}
                      {formatPercentage(getCustomersChangePercentage())}%
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Non-member customer baru
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}