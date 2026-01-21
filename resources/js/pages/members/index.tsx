import AppLayout from '@/layouts/app-layout';
import { appRoutes } from '@/lib/app-routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Filter, Search, Calendar, User, Phone, MapPin, Cake, Edit, Trash2, MoreVertical, ChevronLeft, ChevronRight, X, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { memberViewSchema } from '@/view-schemas/member.schema';
import { renderViewSchema } from '@/hooks/use-view-schema';
import { useViewModal } from '@/components/ui/view-modal';
import { FilterModal, FilterParams } from '@/components/ui/filter-modal';
import { membersFilterSchema, convertMembersFiltersToParams } from '@/filter-schemas/members.schema';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { memberEditSchema, MemberFormData } from '@/edit-schemas/members.schema';
import { useEditModal } from '@/hooks/use-edit-modal';
import { EditModal } from '@/components/ui/edit-modal';

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
    status: 'active' | 'inactive';
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

interface NewMemberData {
    member_name: string;
    phone_number: string;
    address: string;
    gender: '1' | '0';
    birth_date: string;
}

export default function MembersIndex() {
    const [members, setMembers] = useState<Member[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false); // ✅ Tambah state untuk export loading
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState<string>('10');
    const [currentPage, setCurrentPage] = useState(1);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    // Di dalam komponen MembersIndex, tambahkan:
    const [editLoading, setEditLoading] = useState(false);
    const [editDeleteLoading, setEditDeleteLoading] = useState(false);
    const { 
        isOpen, 
        openModal, 
        closeModal, 
        editData, 
        schema, 
        modalTitle 
    } = useEditModal<MemberFormData>();
    // State untuk filter
    const [activeFilters, setActiveFilters] = useState<FilterParams>({});
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    
    // State untuk modal tambah member
    const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
    const [newMemberData, setNewMemberData] = useState<NewMemberData>({
        member_name: '',
        phone_number: '',
        address: '',
        gender: '1',
        birth_date: '',
    });
    const [isCreatingMember, setIsCreatingMember] = useState(false);
    
    const { openModal: openViewModal, Modal: ViewModalComponent } = useViewModal();

    const handleSubmitEdit = async (data: MemberFormData) => {
        setEditLoading(true);
        try {
            // Convert data dari form ke format API
            const apiData = {
                ...data,
                gender: data.gender,
            };
            
            const response = await axios.put(
                appRoutes.members.update(data.member_code),
                apiData
            );

            if (response.data.success) {
                toast.success('Member berhasil diperbarui');
                closeModal(); // Tutup modal
                fetchMembers(); // Refresh data
            } else {
                throw new Error(response.data.message);
            }
        } catch (error: any) {
            console.error('Error updating member:', error);
            const message = error.response?.data?.message || 'Terjadi kesalahan saat memperbarui member';
            toast.error(message);
            throw error; // Biarkan error ditangani oleh EditModal
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteEdit = async (data: MemberFormData) => {
        setEditDeleteLoading(true);
        try {
            // Panggil function delete yang sudah ada
            await handleDelete(data.member_code, data.member_name);
            closeModal(); // Tutup modal setelah berhasil
        } catch (error) {
            // Error sudah ditangani di handleDelete
            throw error;
        } finally {
            setEditDeleteLoading(false);
        }
    };
    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const handleEditMember = (member: Member) => {
        // Convert data dari API ke format form
        const formData: MemberFormData = {
        member_code: member.member_code,
        member_name: member.member_name,
        phone_number: member.phone_number,
        address: member.address,
        gender: member.gender ? '1' : '0',
        birth_date: member.birth_date,
        };
        
        openModal(formData, memberEditSchema, `Edit Member: ${member.member_name}`);
    };
    // Fetch members data dengan filter
    const fetchMembers = async () => {
        setLoading(true);
        try {
            const filterParams = convertMembersFiltersToParams(activeFilters);
            
            const params = new URLSearchParams({
                page: currentPage.toString(),
                per_page: perPage,
                search: debouncedSearch,
                ...filterParams
            });

            console.log('🔍 Fetching members with params:', Object.fromEntries(params));
            
            const url = `${appRoutes.members.api.list()}?${params}`;
            const response = await axios.get(url);
            
            console.log('✅ Members fetched:', {
                total: response.data.total || 0,
                count: response.data.data?.length || 0,
                filtersUsed: {
                    search: debouncedSearch,
                    ...filterParams
                }
            });
            
            setMembers(response.data.data);
            setPagination(response.data);
        } catch (error: any) {
            console.error('❌ Error fetching members:', error);
            toast.error('Gagal memuat data member');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle Export CSV
     const handleExport = async () => {
        console.log('🔄 Export button clicked');
        console.log('📊 Current filters:', {
            search,
            activeFilters,
            convertedFilters: convertMembersFiltersToParams(activeFilters)
        });
        
        setExportLoading(true);
        try {
            // Konversi filter ke format yang sesuai dengan backend
            const filterParams = convertMembersFiltersToParams(activeFilters);
            
            // Build query params dengan type safety
            const params = new URLSearchParams();
            
            // Tambahkan search jika ada
            if (search && search.trim() !== '') {
                params.append('search', search.trim());
                console.log('🔍 Search param:', search);
            }
            
            // Tambahkan filter params dengan pengecekan null/undefined
            Object.entries(filterParams).forEach(([key, value]) => {
                // Type guard untuk memastikan value tidak null/undefined
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value)); // Konversi ke string
                    console.log(`📝 Filter param: ${key}=${value}`);
                }
            });
            
            const queryString = params.toString();
            const exportUrl = `${appRoutes.members.export()}${queryString ? '?' + queryString : ''}`;
            
            console.log('🌐 Export URL:', exportUrl);
            console.log('📤 Making export request...');
            
            // Gunakan fetch untuk download file tanpa page refresh
            const response = await fetch(exportUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'text/csv',
                },
                credentials: 'include' // Include cookies
            });
            
            console.log('📨 Response status:', response.status);
            console.log('📨 Response status text:', response.statusText);
            
            // Log headers
            const headers: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });
            console.log('📨 Response headers:', headers);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Export failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText.substring(0, 500) // Batasi log
                });
                toast.error(`Export gagal: ${response.status} ${response.statusText}`);
                return;
            }
            
            // Dapatkan blob dari response
            const blob = await response.blob();
            console.log('📄 Blob created:', {
                size: blob.size,
                type: blob.type
            });
            
            // Buat URL untuk blob
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Dapatkan filename dari header atau buat default
            let filename = 'members_export.csv';
            const contentDisposition = response.headers.get('content-disposition');
            
            if (contentDisposition) {
                console.log('📄 Content-Disposition header:', contentDisposition);
                // Mencocokkan filename dari header
                const filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i) ||
                                     contentDisposition.match(/filename="([^"]+)"/i) ||
                                     contentDisposition.match(/filename=([^;]+)/i);
                
                if (filenameMatch && filenameMatch[1]) {
                    filename = decodeURIComponent(filenameMatch[1].trim());
                    console.log('📄 Extracted filename:', filename);
                }
            }
            
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            // Clean up URL
            window.URL.revokeObjectURL(url);
            
            console.log('✅ Export completed successfully');
            toast.success(`Export berhasil! File "${filename}" sedang diunduh`);
            
        } catch (error: any) {
            console.error('❌ Error exporting members:', error);
            
            // Type-safe error handling
            if (error instanceof Error) {
                console.error('❌ Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
                toast.error(`Gagal export data member: ${error.message}`);
            } else {
                console.error('❌ Unknown error:', error);
                toast.error('Gagal export data member: Terjadi kesalahan tidak diketahui');
            }
        } finally {
            setExportLoading(false);
        }
    };

    // ✅ Alternative: Export menggunakan axios dengan type safety
    const handleExportAxios = async () => {
    console.log('🔄 Export button clicked (Axios version)');
    
    setExportLoading(true);
    try {
        // Konversi filter ke format yang sesuai dengan backend
        const filterParams = convertMembersFiltersToParams(activeFilters);
        
        // Build query params dengan type safety
        const params: Record<string, string> = {};
        
        if (search && search.trim() !== '') {
            params.search = search.trim();
            console.log('🔍 Search param:', search);
        }
        
        Object.entries(filterParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params[key] = String(value);
                console.log(`📝 Filter param: ${key}=${value}`);
            }
        });
        
        // GUNAKAN ROUTE YANG BENAR
        const exportUrl = appRoutes.members.export(); // Pastikan ini route yang benar
        
        console.log('🌐 Export URL:', exportUrl);
        console.log('📤 Request params:', params);
        
        // Gunakan fetch untuk menghindari double reading
        const response = await fetch(`${exportUrl}?${new URLSearchParams(params)}`, {
            method: 'GET',
            headers: {
                'Accept': 'text/csv',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        });
        
        console.log('📨 Fetch response:', {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries([...response.headers])
        });
        
        if (!response.ok) {
            // Coba baca error message
            const errorText = await response.text();
            console.error('❌ Export failed:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText.substring(0, 500)
            });
            
            // Parse error jika JSON
            try {
                const errorJson = JSON.parse(errorText);
                toast.error(`Export gagal: ${errorJson.error || errorJson.message || 'Unknown error'}`);
            } catch {
                toast.error(`Export gagal: ${response.status} ${response.statusText}`);
            }
            return;
        }
        
        // Langsung download file
        const blob = await response.blob(); // HANYA BACA SEKALI
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Get filename from header
        let filename = 'members_export.csv';
        const contentDisposition = response.headers.get('content-disposition');
        
        if (contentDisposition) {
            console.log('📄 Content-Disposition:', contentDisposition);
            const filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i) ||
                                 contentDisposition.match(/filename="([^"]+)"/i) ||
                                 contentDisposition.match(/filename=([^;]+)/i);
            
            if (filenameMatch && filenameMatch[1]) {
                filename = decodeURIComponent(filenameMatch[1].trim());
                console.log('📄 Extracted filename:', filename);
            }
        }
        
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Export successful!');
        toast.success(`Export berhasil! File "${filename}" diunduh`);
        
    } catch (error: any) {
        console.error('❌ Export error:', error);
        
        if (error instanceof Error) {
            toast.error(`Export gagal: ${error.message}`);
        } else {
            toast.error('Gagal export data member: Terjadi kesalahan tidak diketahui');
        }
    } finally {
        setExportLoading(false);
    }
};

    // ✅ SIMPLE TEST - Export dengan data dummy untuk test
    const handleExportTest = async () => {
        console.log('🧪 TEST Export button clicked');
        
        setExportLoading(true);
        try {
            // Test dengan URL sederhana tanpa filter
            const testUrl = `${appRoutes.members.export()}?test=1`;
            console.log('🌐 Test URL:', testUrl);
            
            const response = await fetch(testUrl, {
                headers: { 
                    'Accept': 'text/csv',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include'
            });
            
            console.log('📨 Test Response:', {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText,
            });
            
            // Log headers
            const headers: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });
            console.log('📨 Response headers:', headers);
            
            if (response.ok) {
                const text = await response.text();
                console.log('📄 Response text (first 500 chars):', text.substring(0, 500));
                
                // Download file
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'test_export.csv';
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                
                console.log('✅ Test export successful!');
                toast.success('Test export berhasil!');
            } else {
                const errorText = await response.text();
                console.error('❌ Test failed:', errorText.substring(0, 500));
                toast.error(`Test gagal: ${response.status} ${response.statusText}`);
            }
            
        } catch (error: any) {
            console.error('❌ Test error:', error);
            
            if (error instanceof Error) {
                toast.error(`Test error: ${error.message}`);
            } else {
                toast.error('Test error: Terjadi kesalahan tidak diketahui');
            }
        } finally {
            setExportLoading(false);
        }
    };

    // Fetch data ketika filter berubah
    useEffect(() => {
        fetchMembers();
    }, [currentPage, perPage, debouncedSearch, activeFilters]);

    // Handle filter change dari modal
    const handleFilterChange = (filters: FilterParams) => {
        console.log('Filter changed:', filters);
        setActiveFilters(filters);
        setCurrentPage(1);
        setFilterModalOpen(false);
    };

    // Handle clear individual filter
    const handleClearFilter = (key: string) => {
        const newFilters = { ...activeFilters };
        
        // Handle date-range keys
        if (key === 'birth_date') {
            delete newFilters['birth_date_start'];
            delete newFilters['birth_date_end'];
        } else {
            delete newFilters[key];
        }
        
        setActiveFilters(newFilters);
        setCurrentPage(1);
    };

    // Handle clear all filters
    const handleClearAllFilters = () => {
        setActiveFilters({});
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

    const getStatusBadge = (status: 'active' | 'inactive') => {
        return status === 'active' ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1" variant="outline">
                <CheckCircle className="h-3 w-3" />
                Aktif
            </Badge>
        ) : (
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1" variant="outline">
                <XCircle className="h-3 w-3" />
                Nonaktif
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
            // Cek jika error karena member memiliki transaksi
            const errorMessage = error.response?.data?.message || '';
            
            if (errorMessage.includes('transaksi') || errorMessage.includes('Tidak dapat menghapus member')) {
                toast.error(`Gagal menghapus: Member ${memberName} pernah melakukan transaksi`);
            } else {
                const message = error.response?.data?.message || 'Gagal menghapus member';
                toast.error(message);
            }
        }
    };

    // Handle toggle status member
    const handleToggleStatus = async (memberCode: string, currentStatus: 'active' | 'inactive', memberName: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const confirmMessage = newStatus === 'active' 
            ? `Apakah Anda yakin ingin mengaktifkan member ${memberName}?`
            : `Apakah Anda yakin ingin menonaktifkan member ${memberName}?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await axios.put(appRoutes.members.update(memberCode), {
                status: newStatus
            });

            if (response.data.success) {
                toast.success(`Status member ${memberName} berhasil diubah menjadi ${newStatus === 'active' ? 'aktif' : 'nonaktif'}`);
                fetchMembers();
            } else {
                toast.error(response.data.message || 'Gagal mengubah status member');
            }
        } catch (error: any) {
            console.error('Error toggling status:', error);
            const message = error.response?.data?.message || 'Terjadi kesalahan saat mengubah status member';
            toast.error(message);
        }
    };

    // Handle tambah member baru
    const handleAddMember = async () => {
        // Validasi
        if (!newMemberData.member_name.trim()) {
            toast.error('Nama member harus diisi');
            return;
        }

        if (!newMemberData.phone_number.trim()) {
            toast.error('Nomor telepon harus diisi');
            return;
        }

        setIsCreatingMember(true);
        try {
            const response = await axios.post(appRoutes.members.store(), newMemberData);
            
            if (response.data.success) {
                toast.success('Member berhasil ditambahkan');
                setIsAddMemberDialogOpen(false);
                
                // Reset form
                setNewMemberData({
                    member_name: '',
                    phone_number: '',
                    address: '',
                    gender: '1',
                    birth_date: '',
                });
                
                // Refresh data members
                fetchMembers();
            } else {
                toast.error(response.data.message || 'Gagal menambahkan member');
            }
        } catch (error: any) {
            console.error('Error adding member:', error);
            const message = error.response?.data?.message || 'Terjadi kesalahan saat menambahkan member';
            toast.error(message);
        } finally {
            setIsCreatingMember(false);
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

    // Helper untuk menampilkan nilai filter
    const getFilterDisplayValue = (key: string, value: any): string => {
        if (key === 'status') {
            return value === 'active' ? 'Aktif' : 'Nonaktif';
        }

        // Format gender
        if (key === 'gender') {
            return value === '1' ? 'Laki-laki' : 'Perempuan';
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

    // Hitung jumlah filter aktif
    const getActiveFilterCount = () => {
        let count = 0;
        if (activeFilters.status && activeFilters.status !== 'all') count++;
        if (activeFilters.gender && activeFilters.gender !== 'all') count++;
        if (activeFilters.birth_date_start) count++;
        if (activeFilters.birth_date_end) count++;
        return count;
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
                        <Button onClick={() => setIsAddMemberDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Member
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
                        <FilterModal
                            schema={membersFilterSchema}
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
                                    {activeFilters.status && activeFilters.status !== 'all' && (
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
                                    {/* Gender Filter Badge */}
                                    {activeFilters.gender && activeFilters.gender !== 'all' && (
                                        <Badge variant="secondary" className="text-xs gap-1">
                                            Gender: {getFilterDisplayValue('gender', activeFilters.gender)}
                                            <button 
                                                onClick={() => handleClearFilter('gender')}
                                                className="hover:bg-gray-200 rounded-full p-0.5"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )}
                                    
                                    {/* Birth Date Start Filter Badge */}
                                    {activeFilters.birth_date_start && (
                                        <Badge variant="secondary" className="text-xs gap-1">
                                            Lahir (Dari): {getFilterDisplayValue('birth_date_start', activeFilters.birth_date_start)}
                                            <button 
                                                onClick={() => handleClearFilter('birth_date')}
                                                className="hover:bg-gray-200 rounded-full p-0.5"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )}
                                    
                                    {/* Birth Date End Filter Badge */}
                                    {activeFilters.birth_date_end && (
                                        <Badge variant="secondary" className="text-xs gap-1">
                                            Lahir (Sampai): {getFilterDisplayValue('birth_date_end', activeFilters.birth_date_end)}
                                            <button 
                                                onClick={() => handleClearFilter('birth_date')}
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

                {/* Statistics */}
                <div className="grid gap-4 md:grid-cols-5">
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
                                Member Aktif
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {loading ? (
                                    <Skeleton className="h-8 w-16" />
                                ) : (
                                    members.filter(m => m.status === 'active').length.toLocaleString('id-ID')
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Jumlah member aktif
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Member Pria
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
                                Member Wanita
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
                                        <TableHead>Status</TableHead>
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
                                                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : members.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                {debouncedSearch || getActiveFilterCount() > 0
                                                    ? 'Tidak ada member yang sesuai dengan pencarian' 
                                                    : 'Belum ada data member'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        members.map((member) => {
                                            return (          
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
                                                <TableCell>
                                                    {getStatusBadge(member.status)}
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
                                                            <DropdownMenuItem 
                                                                className="cursor-pointer"
                                                                onClick={() => handleEditMember(member)}
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem 
                                                                className="cursor-pointer"
                                                                onClick={() => handleToggleStatus(member.member_code, member.status, member.member_name)}
                                                            >
                                                                {member.status === 'active' ? (
                                                                    <>
                                                                        <XCircle className="mr-2 h-4 w-4 text-yellow-600" />
                                                                        <span className="text-yellow-600">Nonaktifkan</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                                                        <span className="text-green-600">Aktifkan</span>
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                className={`text-red-600 cursor-pointer ${member.total_transactions ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                onClick={() => {
                                                                    if (member.total_transactions) {
                                                                        toast.error(`Member ${member.member_name} memiliki transaksi dan tidak dapat dihapus`);
                                                                    } else {
                                                                        handleDelete(member.member_code, member.member_name);
                                                                    }
                                                                }}
                                                                disabled={(member.total_transactions || 0) > 0}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Hapus
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        )})
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

            {/* Modal Tambah Member */}
            <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Tambah Member Baru</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="member_name">Nama Member *</Label>
                            <Input
                                id="member_name"
                                value={newMemberData.member_name}
                                onChange={(e) => setNewMemberData({
                                    ...newMemberData,
                                    member_name: e.target.value
                                })}
                                placeholder="Nama lengkap"
                                required
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone_number">Nomor Telepon *</Label>
                                <Input
                                    id="phone_number"
                                    value={newMemberData.phone_number}
                                    onChange={(e) => {
                                        // Hapus semua huruf dari input
                                        const filteredValue = e.target.value.replace(/[a-zA-Z]/g, '');
                                        setNewMemberData({
                                            ...newMemberData,
                                            phone_number: filteredValue
                                        });
                                    }}
                                    onKeyPress={(e) => {
                                        // Mencegah input huruf saat mengetik
                                        if (/[a-zA-Z]/.test(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    placeholder="0812-3456-7890"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birth_date">Tanggal Lahir</Label>
                                <Input
                                    id="birth_date"
                                    type="date"
                                    value={newMemberData.birth_date}
                                    onChange={(e) => setNewMemberData({
                                        ...newMemberData,
                                        birth_date: e.target.value
                                    })}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Jenis Kelamin</Label>
                            <RadioGroup
                                value={newMemberData.gender}
                                onValueChange={(value) => setNewMemberData({
                                    ...newMemberData,
                                    gender: value as '1' | '0'
                                })}
                                className="flex space-x-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="1" id="male" />
                                    <Label htmlFor="male">Pria</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="0" id="female" />
                                    <Label htmlFor="female">Wanita</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="address">Alamat</Label>
                            <Textarea
                                id="address"
                                value={newMemberData.address}
                                onChange={(e) => setNewMemberData({
                                    ...newMemberData,
                                    address: e.target.value
                                })}
                                placeholder="Alamat lengkap"
                                rows={3}
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsAddMemberDialogOpen(false);
                                // Reset form
                                setNewMemberData({
                                    member_name: '',
                                    phone_number: '',
                                    address: '',
                                    gender: '1',
                                    birth_date: '',
                                });
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleAddMember}
                            disabled={isCreatingMember || !newMemberData.member_name || !newMemberData.phone_number}
                        >
                            {isCreatingMember ? 'Menyimpan...' : 'Simpan Member'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <EditModal<MemberFormData>
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
                deleteConfirmMessage="Apakah Anda yakin ingin menghapus member ini?"
            />
            <ViewModalComponent />
        </AppLayout>
    );
}