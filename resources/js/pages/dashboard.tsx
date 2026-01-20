import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, ShoppingCart, UserPlus, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

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

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [activeChart, setActiveChart] = useState<'revenue' | 'transactions' | 'projection'>('revenue');

    useEffect(() => {
        fetchDashboardData();
    }, []);

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

    // Fungsi untuk menghitung tinggi bar chart
    const calculateBarHeight = (value: number, maxValue: number) => {
        if (maxValue === 0) return 0;
        return Math.min((value / maxValue) * 100, 100);
    };

    // Render bar chart sederhana
    const renderBarChart = (data: number[], labels: string[], color: string = 'bg-blue-500') => {
        if (!data || data.length === 0) return null;
        
        const maxValue = Math.max(...data);
        
        return (
            <div className="flex items-end justify-between h-64 pt-4">
                {data.map((value, index) => (
                    <div key={index} className="flex flex-col items-center flex-1 mx-1">
                        <div className="text-xs text-muted-foreground mb-2 truncate w-full text-center">
                            {labels[index]}
                        </div>
                        <div className="flex flex-col items-center w-full">
                            <div 
                                className={`w-3/4 ${color} rounded-t-lg transition-all duration-300 hover:opacity-80`}
                                style={{ height: `${calculateBarHeight(value, maxValue)}%` }}
                            />
                            <div className="text-xs mt-1 font-medium">
                                {formatNumber(value)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Render line chart sederhana
    const renderLineChart = (data: number[], labels: string[], color: string = '#3b82f6') => {
        if (!data || data.length === 0) return null;
        
        const maxValue = Math.max(...data);
        const points = data.map((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - calculateBarHeight(value, maxValue);
            return `${x}% ${y}%`;
        }).join(', ');
        
        return (
            <div className="h-64 pt-4 relative">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map((y) => (
                        <line
                            key={y}
                            x1="0"
                            y1={y}
                            x2="100"
                            y2={y}
                            stroke="#e5e7eb"
                            strokeWidth="0.5"
                            strokeDasharray="2,2"
                        />
                    ))}
                    
                    {/* Line */}
                    <polyline
                        points={points}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    
                    {/* Points */}
                    {data.map((value, index) => {
                        const x = (index / (data.length - 1)) * 100;
                        const y = 100 - calculateBarHeight(value, maxValue);
                        return (
                            <circle
                                key={index}
                                cx={`${x}%`}
                                cy={`${y}%`}
                                r="2"
                                fill={color}
                                className="hover:r-3 transition-all"
                            />
                        );
                    })}
                </svg>
                
                {/* Labels */}
                <div className="flex justify-between mt-2">
                    {labels.map((label, index) => (
                        <div key={index} className="text-xs text-muted-foreground">
                            {label}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // Render revenue vs target chart
    const renderRevenueTargetChart = (revenues: number[], targets: number[], labels: string[]) => {
        if (!revenues || !targets || revenues.length === 0) return null;
        
        const maxValue = Math.max(...revenues, ...targets);
        
        return (
            <div className="h-64 pt-4 relative">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    {[0, 25, 50, 75, 100].map((y) => (
                        <line
                            key={y}
                            x1="0"
                            y1={y}
                            x2="100"
                            y2={y}
                            stroke="#e5e7eb"
                            strokeWidth="0.5"
                            strokeDasharray="2,2"
                        />
                    ))}
                    
                    {/* Revenue line */}
                    <polyline
                        points={revenues.map((value, index) => {
                            const x = (index / (revenues.length - 1)) * 100;
                            const y = 100 - calculateBarHeight(value, maxValue);
                            return `${x}% ${y}%`;
                        }).join(', ')}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    
                    {/* Target line */}
                    <polyline
                        points={targets.map((value, index) => {
                            const x = (index / (targets.length - 1)) * 100;
                            const y = 100 - calculateBarHeight(value, maxValue);
                            return `${x}% ${y}%`;
                        }).join(', ')}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    
                    {/* Revenue points */}
                    {revenues.map((value, index) => {
                        const x = (index / (revenues.length - 1)) * 100;
                        const y = 100 - calculateBarHeight(value, maxValue);
                        return (
                            <circle
                                key={`revenue-${index}`}
                                cx={`${x}%`}
                                cy={`${y}%`}
                                r="2"
                                fill="#3b82f6"
                                className="hover:r-3 transition-all"
                            />
                        );
                    })}
                    
                    {/* Target points */}
                    {targets.map((value, index) => {
                        const x = (index / (targets.length - 1)) * 100;
                        const y = 100 - calculateBarHeight(value, maxValue);
                        return (
                            <circle
                                key={`target-${index}`}
                                cx={`${x}%`}
                                cy={`${y}%`}
                                r="2"
                                fill="#ef4444"
                                className="hover:r-3 transition-all"
                            />
                        );
                    })}
                </svg>
                
                {/* Labels */}
                <div className="flex justify-between mt-2">
                    {labels.map((label, index) => (
                        <div key={index} className="text-xs text-muted-foreground">
                            {label}
                        </div>
                    ))}
                </div>
                
                {/* Legend */}
                <div className="flex gap-4 mt-4">
                    <div className="flex items-center">
                        <div className="w-3 h-0.5 bg-blue-500 mr-2"></div>
                        <span className="text-xs">Revenue Aktual</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-0.5 bg-red-500 mr-2 border-dashed border"></div>
                        <span className="text-xs">Target</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Total Transaksi Bulan Ini */}
                    <Card>
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
                    <Card>
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
                    <Card>
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
                    <Card>
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
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Revenue Chart */}
                    <Card className="lg:col-span-2">
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
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-64 w-full" />
                            ) : chartData ? (
                                <>
                                    {activeChart === 'revenue' && (
                                        <>
                                            {renderLineChart(chartData.historical.revenues, chartData.historical.months, '#3b82f6')}
                                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                                {chartData.historical.revenues.map((revenue, index) => (
                                                    <div key={index} className="text-center">
                                                        <div className="text-sm font-medium">{chartData.historical.months[index]}</div>
                                                        <div className="text-lg font-bold text-blue-600">
                                                            {formatCurrency(revenue)}
                                                        </div>
                                                        {chartData.historical.targets[index] > 0 && (
                                                            <div className="text-xs text-muted-foreground">
                                                                Target: {formatCurrency(chartData.historical.targets[index])}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    
                                    {activeChart === 'transactions' && (
                                        <>
                                            {renderBarChart(chartData.historical.transactions, chartData.historical.months, 'bg-purple-500')}
                                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                                {chartData.historical.transactions.map((transaction, index) => (
                                                    <div key={index} className="text-center">
                                                        <div className="text-sm font-medium">{chartData.historical.months[index]}</div>
                                                        <div className="text-lg font-bold text-purple-600">
                                                            {formatNumber(transaction)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">transaksi</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    
                                    {activeChart === 'projection' && (
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Revenue vs Target</h4>
                                                {renderRevenueTargetChart(
                                                    chartData.historical.revenues,
                                                    chartData.historical.targets,
                                                    chartData.historical.months
                                                )}
                                            </div>
                                            
                                            {chartData.projection && (
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2">Proyeksi 3 Bulan Ke Depan</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                        {chartData.projection.revenues.map((revenue, index) => (
                                                            <Card key={index} className="bg-gradient-to-br from-green-50 to-emerald-50">
                                                                <CardContent className="pt-6">
                                                                    <div className="text-center">
                                                                        <div className="text-sm font-medium text-green-800">
                                                                            {chartData.projection.months[index]}
                                                                        </div>
                                                                        <div className="text-2xl font-bold text-green-700 mt-2">
                                                                            {formatCurrency(revenue)}
                                                                        </div>
                                                                        <div className="text-xs text-green-600 mt-1">
                                                                            Estimasi revenue
                                                                        </div>
                                                                        <div className="mt-3">
                                                                            <Badge variant="outline" className="bg-white">
                                                                                +10% dari rata-rata
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex h-64 items-center justify-center">
                                    <p className="text-muted-foreground">Tidak ada data chart</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card>
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
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Aktivitas Terbaru</CardTitle>
                                <CardDescription>Aktivitas sistem terkini</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm">
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Transaksi baru selesai</p>
                                        <p className="text-xs text-muted-foreground">INV2312010001 - Rp 250.000</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">5 menit lalu</span>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Member baru terdaftar</p>
                                        <p className="text-xs text-muted-foreground">MEM00123 - John Doe</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">2 jam lalu</span>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Stok barang diperbarui</p>
                                        <p className="text-xs text-muted-foreground">BRG001 - Kopi Arabica (+50)</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">1 hari lalu</span>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-3"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Transaksi dibatalkan</p>
                                        <p className="text-xs text-muted-foreground">INV2311300005 - Rp 150.000</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">2 hari lalu</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Summary */}
                <Card>
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