import AppLayout from '@/layouts/app-layout';
import { appRoutes } from '@/lib/app-routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Filter, Search, Calendar, User, Phone, MapPin, Cake, Edit, Trash2, MoreVertical,ChevronLeft,ChevronRight, X } from 'lucide-react';
import {Card,CardContent,CardDescription,CardHeader,CardTitle,} from '@/components/ui/card';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow,} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuLabel,DropdownMenuSeparator,DropdownMenuTrigger,} from '@/components/ui/dropdown-menu';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue,} from '@/components/ui/select';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { memberViewSchema } from '@/view-schemas/member.schema';
import { renderViewSchema } from '@/hooks/use-view-schema';
import { useViewModal } from '@/components/ui/view-modal';
import { FilterModal, useFilterModal, type FilterParams } from '@/components/ui/filter-modal';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: appRoutes.dashboard(),
    },
    {
        title: 'Membership',
        href: appRoutes.members.index(),
    },
];

interface Member {
    member_code: string;
    member_name: string;
    phone_number: string;
    address: string;
    gender: boolean; // 1 = Laki-laki, 0 = Perempuan
    birth_date: string;
    created_at: string;
    updated_at: string;
    total_transactions?: number;
    total_spent?: number;
}

interface PaginationData {
    current_page: number;
    data: Member[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}


export default function MembersIndex() {
    const [members, setMembers] = useState<Member[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [genderFilter, setGenderFilter] = useState<string>('all');
    const [perPage, setPerPage] = useState<string>('10');
    const [currentPage, setCurrentPage] = useState(1);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
    
    const { openModal, Modal: FilterModalComponent } = useFilterModal();
    const { openModal: openViewModal, Modal: ViewModalComponent } = useViewModal();

    // Debounce search input
    useEffect(() => {
        console.log('Search changed:', search); // Debug
        
        const timer = setTimeout(() => {
            console.log('Debounced search set to:', search); // Debug
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    // Fetch members data dengan filter baru
    const fetchMembers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                per_page: perPage,
                search: debouncedSearch,
                gender: genderFilter !== 'all' ? genderFilter : '',
                // PERHATIAN: TAMBAHKAN start_date dan end_date JIKA ADA
                ...(dateRange.start && { start_date: dateRange.start.toISOString().split('T')[0] }),
                ...(dateRange.end && { end_date: dateRange.end.toISOString().split('T')[0] }),
            });

            console.log('🔍 API Request URL:', params.toString()); // Debug
            
            const url = `${appRoutes.members.api.list()}?${params}`;
            const response = await axios.get(url);
            
            console.log('✅ API Response:', {
                total: response.data.total || 0,
                count: response.data.data?.length || 0,
                filtersUsed: {
                    search: debouncedSearch,
                    start_date: dateRange.start?.toISOString().split('T')[0],
                    end_date: dateRange.end?.toISOString().split('T')[0]
                }
            });
            
            setMembers(response.data.data);
            setPagination(response.data);
        } catch (error: any) {
            console.error('❌ Error fetching members:', error);
            // ... error handling
        } finally {
            setLoading(false);
        }
    };

    // Debug useEffect fetchMembers
    useEffect(() => {
        console.log('Fetching with filters:', {
            debouncedSearch,
            genderFilter,
            dateRange,
            currentPage,
            perPage
        });
        fetchMembers();
    }, [currentPage, perPage, debouncedSearch, genderFilter, dateRange]);

    // Fungsi untuk handle filter dari modal
    const handleFilterChange = (filters: FilterParams) => {
        if (filters.search !== undefined) {
            setSearch(filters.search);
        }
        
        if (filters.gender !== undefined) {
            setGenderFilter(filters.gender || 'all');
        }
        
        setDateRange({
            start: filters.startDate,
            end: filters.endDate,
        });
        
        setCurrentPage(1);
    };

    // Fungsi untuk membuka modal filter dengan state saat ini
    const handleOpenFilterModal = () => {
        const currentFilters: FilterParams = {
            search: search,
            gender: genderFilter !== 'all' ? genderFilter : undefined,
            startDate: dateRange.start,
            endDate: dateRange.end,
        };
        
        openModal(currentFilters, handleFilterChange);
    };

    // Fungsi untuk reset semua filter
    const handleResetFilters = () => {
        setSearch('');
        setGenderFilter('all');
        setDateRange({});
        setCurrentPage(1);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const calculateAge = (birthDate: string) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    };

    const getGenderBadge = (gender: boolean) => {
        return gender ? (
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100" variant="outline">
                Pria
            </Badge>
        ) : (
            <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-100" variant="outline">
                Wanita
            </Badge>
        );
    };

    const handleDelete = async (memberCode: string, memberName: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus member ${memberName}?`)) {
            return;
        }

        try {
            await axios.delete(appRoutes.members.api.destroy(memberCode));
            toast.success(`Member ${memberName} berhasil dihapus`);
            fetchMembers();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Gagal menghapus member';
            toast.error(message);
        }
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || page > (pagination?.last_page || 1)) return;
        setCurrentPage(page);
    };

    const renderPaginationButtons = () => {
        if (!pagination) return null;

        const buttons = [];
        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(pagination.last_page, startPage + maxButtons - 1);

        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        buttons.push(
            <Button
                key="prev"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.prev_page_url}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
        );

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

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <Button
                    key={i}
                    variant={currentPage === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(i)}
                >
                    {i}
                </Button>
            );
        }

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

        buttons.push(
            <Button
                key="next"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.next_page_url}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        );

        return buttons;
    };

    const viewMember = (member: Member) => {
        openViewModal(
            memberViewSchema.title(member),
            renderViewSchema(memberViewSchema, member),
            memberViewSchema.description?.(member)
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Membership" />

            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Membership</h1>
                        <p className="text-muted-foreground">
                            Kelola data member dan keanggotaan
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button asChild>
                            <Link href={appRoutes.members.create()}>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah Member
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Filters - FULL WIDTH LAYOUT */}
                <div className="w-full space-y-3">
                    {/* Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama member atau kode member..."
                                className="pl-9 w-full"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                                    onClick={() => setSearch('')}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        
                        {/* Filter Button - Full width on mobile */}
                        <Button
                            variant="outline"
                            onClick={handleOpenFilterModal}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            <Filter className="h-4 w-4" />
                            Filter
                        </Button>
                    </div>

                    {/* Active Filters Display */}
                    {(genderFilter !== 'all' || dateRange.start || dateRange.end || search) && (
                        <div className="w-full">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-wrap gap-2 flex-1">
                                    {search && (
                                        <Badge variant="secondary" className="text-xs">
                                            Search: {search}
                                        </Badge>
                                    )}
                                    {genderFilter !== 'all' && (
                                        <Badge variant="secondary" className="text-xs">
                                            Gender: {genderFilter === '1' ? 'Laki-laki' : 'Perempuan'}
                                        </Badge>
                                    )}
                                    {dateRange.start && (
                                        <Badge variant="secondary" className="text-xs">
                                            Dari: {dateRange.start.toLocaleDateString('id-ID', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </Badge>
                                    )}
                                    {dateRange.end && (
                                        <Badge variant="secondary" className="text-xs">
                                            Sampai: {dateRange.end.toLocaleDateString('id-ID', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </Badge>
                                    )}
                                </div>
                                
                                {(genderFilter !== 'all' || dateRange.start || dateRange.end || search) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResetFilters}
                                        className="text-xs h-8 px-2 ml-2"
                                    >
                                        <X className="h-3 w-3 mr-1" />
                                        Clear All
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Statistics */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Member
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {loading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    pagination?.total.toLocaleString('id-ID')
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Jumlah member terdaftar
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Member Laki-laki
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {loading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    members.filter(m => m.gender).length.toLocaleString('id-ID')
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total member pria
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Member Perempuan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {loading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    members.filter(m => !m.gender).length.toLocaleString('id-ID')
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total member wanita
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Rata-rata Usia
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {loading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : members.length > 0 ? (
                                    Math.round(
                                        members.reduce((sum, member) => sum + calculateAge(member.birth_date), 0) / members.length
                                    )
                                ) : 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Tahun
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Members Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle>Daftar Member</CardTitle>
                                <CardDescription>
                                    {loading ? (
                                        <Skeleton className="h-4 w-32" />
                                    ) : (
                                        `Menampilkan ${pagination?.from || 0} sampai ${pagination?.to || 0} dari ${pagination?.total || 0} member`
                                    )}
                                </CardDescription>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Show:</span>
                                <Select value={perPage} onValueChange={setPerPage}>
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
                                        <TableHead className="w-[120px]">Kode Member</TableHead>
                                        <TableHead>Nama Lengkap</TableHead>
                                        <TableHead>Gender</TableHead>
                                        <TableHead>Tanggal Lahir</TableHead>
                                        <TableHead>Usia</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        Array.from({ length: parseInt(perPage) }).map((_, index) => (
                                            <TableRow key={index}>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : members.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                {debouncedSearch || genderFilter !== 'all' || dateRange.start || dateRange.end 
                                                    ? 'Tidak ada member yang sesuai dengan pencarian' 
                                                    : 'Belum ada data member'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        members.map((member) => (
                                            <TableRow key={member.member_code}>
                                                <TableCell className="font-mono font-medium">
                                                    {member.member_code}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                            <User className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <span className="font-medium">{member.member_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getGenderBadge(member.gender)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>{formatDate(member.birth_date)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Cake className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span>{calculateAge(member.birth_date)} tahun</span>
                                                    </div>
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
                                                            <DropdownMenuItem 
                                                                className="cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    viewMember(member);
                                                                }}
                                                            >
                                                                <User className="mr-2 h-4 w-4" />
                                                                Detail
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link 
                                                                    href={appRoutes.members.edit(member.member_code)}
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem 
                                                                className="text-red-600 cursor-pointer"
                                                                onClick={() => handleDelete(member.member_code, member.member_name)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Hapus
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

                        {/* Pagination */}
                        {!loading && pagination && pagination.last_page > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-sm text-muted-foreground">
                                    Menampilkan {pagination.from} sampai {pagination.to} dari {pagination.total} member
                                </div>
                                <div className="flex items-center gap-2">
                                    {renderPaginationButtons()}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <FilterModalComponent 
                title="Filter Member"
                showSearch={true}
                showGender={true}
                showDateRange={true}
            />

            <ViewModalComponent />
        </AppLayout>
    );
}