import { type BreadcrumbItem } from '@/types';
import { appRoutes } from '@/lib/app-routes';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter
} from '@/components/ui/dialog';
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Trash2, Edit, Eye, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2Icon, AlertCircleIcon, MoreHorizontal, ChevronLeft, ChevronRight, Download, RefreshCcw, Archive } from 'lucide-react';
import { useState, FormEventHandler, useEffect } from 'react';
import { SharedData } from '@/types';
import { toast } from 'sonner';
import { FormSchema } from '@/types/form-schema'; 

// --- IMPORT COMPONENTS ---
import { ViewModal } from '@/components/ui/view-modal'; 
import { MoneyInput } from '@/components/ui/money-input';
import { SearchInput } from '@/components/ui/search-input'; 
import { EditModal } from '@/components/ui/edit-modal'; // EditModal generic

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: appRoutes.dashboard(),
  },
  {
    title: 'Inventory',
    href: "/items",
  }
];

interface Item {
    item_code: string;
    item_name: string;
    item_description: string | null;
    item_price: number;
    item_stock: number;
    item_min_stock: number;
    deleted_at?: string | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedItems {
    data: Item[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

interface IndexProps {
    items: PaginatedItems;
    filters?: { 
        search?: string;
        sort_by?: string;
        sort_direction?: string;
        show_inactive?: boolean;
    };
}

// Schema untuk EditModal generic
const itemSchema: FormSchema<Item> = {
  fields: [
    {
      name: 'item_name',
      label: 'Nama Barang',
      type: 'text',
      required: true,
      placeholder: 'Masukkan nama barang',
    },
    {
      name: 'item_description',
      label: 'Deskripsi',
      type: 'text',
      required: false,
      placeholder: 'Masukkan deskripsi barang',
    },
    {
      name: 'item_price',
      label: 'Harga Jual',
      type: 'money',
      required: true,
      min: 0,
      step: 1000,
      placeholder: '0',
    },
    {
      name: 'item_stock',
      label: 'Stok',
      type: 'number',
      required: true,
      min: 0,
      disabled: true, // Stok tidak bisa diedit
      placeholder: '0',
    },
    {
      name: 'item_min_stock',
      label: 'Minimum Stok',
      type: 'number',
      required: true,
      min: 0,
      placeholder: '0',
    },
  ],
};

export default function ItemIndex({ items, filters }: IndexProps) {
    const { flash } = usePage<SharedData>().props; 

    // State Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // [UBAH NAMA]
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    
    // [MODAL STATE]
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isRestoreOpen, setIsRestoreOpen] = useState(false);
    const [isForceDeleteOpen, setIsForceDeleteOpen] = useState(false);
    
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [selectedItemForEdit, setSelectedItemForEdit] = useState<Item | null>(null); // [STATE BARU UNTUK EDIT MODAL]

    // --- [BARU] EFFECT UNTUK TOAST NOTIFICATION ---
    useEffect(() => {
        if (flash.success) {
            toast.success(flash.success);
        }
        if (flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    // --- Sort State ---
    const currentSortBy = filters?.sort_by || 'item_name';
    const currentSortDir = filters?.sort_direction || 'asc';

    // --- Search Handler ---
    const handleSearch = (term: string) => {
        router.get(
            route('items.index'),
            { 
                ...filters, 
                search: term,
                sort_by: currentSortBy,
                sort_direction: currentSortDir 
            },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    // --- Show Inactive Handler ---
    const handleShowInactiveChange = (checked: boolean) => {
        router.get(
            route('items.index'),
            { 
                ...filters, 
                show_inactive: checked,
                page: 1 
            },
            { preserveState: true, replace: true }
        );
    };

    // --- Restore Handlers ---
    const openRestoreModal = (item: Item) => {
        setSelectedItem(item);
        setIsRestoreOpen(true);
    };

    const confirmRestore = () => {
        if (!selectedItem) return;
        
        router.put(route('items.restore', selectedItem.item_code), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setIsRestoreOpen(false);
                setSelectedItem(null);
            }
        });
    };

    // --- Sort Handler ---
    const handleSort = (field: string) => {
        let direction = 'asc';
        if (field === currentSortBy) {
            direction = currentSortDir === 'asc' ? 'desc' : 'asc';
        }
        router.get(
            route('items.index'),
            { 
                ...filters, 
                sort_by: field, 
                sort_direction: direction 
            },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (field !== currentSortBy) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
        return currentSortDir === 'asc' 
            ? <ArrowUp className="ml-2 h-4 w-4 text-primary" /> 
            : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
    };

    // --- Form Hook (untuk Create modal) ---
    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        item_name: '',
        item_price: 0,
        item_stock: 0,
        item_min_stock: 0,
        item_description: '',
    });

    // --- Modal Handlers ---
    const openCreateModal = () => { reset(); setIsCreateOpen(true); };
    
    // [UBAH] Handler untuk EditModal generic
    const openEditModal = (item: Item) => {
        setSelectedItemForEdit(item);
        setIsEditModalOpen(true);
    };
    
    const openDetailModal = (item: Item) => { 
        setSelectedItem(item); 
        setIsDetailOpen(true); 
    };

    const openDeleteModal = (item: Item) => { 
        setSelectedItem(item); 
        setIsDeleteOpen(true); 
    };

    // Handler untuk EditModal generic
    const handleEditSubmit = async (formData: Record<string, any>) => {
        if (!selectedItemForEdit) return;
        
        // Konversi formData ke format yang sesuai
        const updateData = {
            item_name: formData.item_name,
            item_description: formData.item_description,
            item_price: Number(formData.item_price),
            item_min_stock: Number(formData.item_min_stock),
            // item_stock tidak dikirim karena tidak boleh diubah
        };
        
        try {
            await put(route('items.update', selectedItemForEdit.item_code), {
                ...updateData, // Data form
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    setSelectedItemForEdit(null);
                },
                onError: (errors) => {
                    throw new Error(Object.values(errors).join(', '));
                }
            });
        } catch (error: any) {
            throw error;
        }
    };

    // Handler untuk delete di EditModal
    const handleDeleteInModal = async (item: Item) => {
        if (!item) return;
        
        if (!window.confirm(`Non-aktifkan barang ${item.item_name}?`)) {
            return;
        }
        
        await destroy(route('items.destroy', item.item_code), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedItemForEdit(null);
            }
        });
    };

    const handleCreateSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('items.store'), { 
            onSuccess: () => { setIsCreateOpen(false); reset(); } 
        });
    };

    const handleDelete = () => { 
        if (!selectedItem) return;
        destroy(route('items.destroy', selectedItem.item_code), {
            onSuccess: () => { setIsDeleteOpen(false); setSelectedItem(null); }
        });
    };

    const openForceDeleteModal = (item: Item) => {
        setSelectedItem(item);
        setIsForceDeleteOpen(true);
    };

    // --- Hard Delete Handler ---
    const hardForceDelete = () => {
        if (!selectedItem) return;
        
        router.delete(route('items.force-destroy', selectedItem.item_code), {
            preserveScroll: true,
            onSuccess: () => {
                setIsForceDeleteOpen(false);
                setSelectedItem(null);
            },
            onError: () => {
                setIsForceDeleteOpen(false);
            },
            onFinish: () => {
                // Bisa tambahkan logic cleanup jika perlu
            }
        });
    };

    const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory Barang" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                
                {/* --- HEADER PAGE --- */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Daftar Barang</h1>
                        <p className="text-muted-foreground">Kelola stok dan harga barang (Inventory).</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" /> Export
                        </Button>
                        <Button onClick={openCreateModal}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah Barang
                        </Button>
                    </div>
                </div>

                {/* Table Card */}
                <Card>
                    <CardHeader className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <CardTitle>Inventory</CardTitle>
                                <CardDescription>Menampilkan {items.from} - {items.to} dari {items.total} barang</CardDescription>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                                {/* Toggle Show Inactive Only */}
                                <div className="flex items-center space-x-2 border px-3 py-2 rounded-md bg-muted/20">
                                    <Switch 
                                        id="show-inactive" 
                                        checked={filters?.show_inactive || false}
                                        onCheckedChange={handleShowInactiveChange}
                                    />
                                    <Label htmlFor="show-inactive" className="cursor-pointer text-sm font-medium">
                                        {filters?.show_inactive ? 'Menampilkan Non-Aktif' : 'Hanya Aktif'}
                                    </Label>
                                </div>

                                {/* Search Component */}
                                <SearchInput 
                                    value={filters?.search || ''}
                                    onSearch={handleSearch}
                                    placeholder="Cari kode atau nama..."
                                    className="w-full sm:w-64"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('item_code')}>
                                            <div className="flex items-center">Kode <SortIcon field="item_code" /></div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('item_name')}>
                                            <div className="flex items-center">Nama Barang <SortIcon field="item_name" /></div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('item_stock')}>
                                            <div className="flex items-center">Stok <SortIcon field="item_stock" /></div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('item_price')}>
                                            <div className="flex items-center">Harga Jual <SortIcon field="item_price" /></div>
                                        </TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                {filters?.search ? 'Barang tidak ditemukan.' : 'Belum ada data barang.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.data.map((item) => (
                                            <TableRow 
                                                key={item.item_code} 
                                                className={cn("align-top", item.deleted_at && "bg-muted/50 text-muted-foreground")}
                                            >
                                                <TableCell className="font-medium py-4">{item.item_code}</TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className={cn("font-medium", item.deleted_at && "line-through")}>
                                                            {item.item_name}
                                                        </span>
                                                        {item.deleted_at ? (
                                                            <Badge variant="destructive" className="w-fit mt-1 text-[10px] px-1 h-5">
                                                                Inactive
                                                            </Badge>
                                                        ) : (
                                                            item.item_stock <= item.item_min_stock && (
                                                                <span className="text-[10px] text-red-500 font-bold">Stok Menipis!</span>
                                                            )
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Badge variant={item.item_stock > item.item_min_stock ? "outline" : "destructive"}>
                                                        {item.item_stock}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-bold py-4">{formatRupiah(Number(item.item_price))}</TableCell>
                                                <TableCell className="text-right py-4">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                            
                                                            {/* DETAIL - selalu ada */}
                                                            <DropdownMenuItem onClick={() => openDetailModal(item)}>
                                                                <Eye className="mr-2 h-4 w-4" /> Detail
                                                            </DropdownMenuItem>
                                                            
                                                            {/* EDIT - hanya untuk item aktif */}
                                                            {!item.deleted_at && (
                                                                <DropdownMenuItem onClick={() => openEditModal(item)}>
                                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                                </DropdownMenuItem>
                                                            )}
                                                            
                                                            {/* LOGIK KONDISIONAL UTAMA */}
                                                            {item.deleted_at ? (
                                                                // JIKA ITEM SUDAH NON-AKTIF (deleted_at ada)
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem 
                                                                        onClick={() => openRestoreModal(item)}
                                                                        className="text-green-600 focus:text-green-600 focus:bg-green-50"
                                                                    >
                                                                        <RefreshCcw className="mr-2 h-4 w-4" /> Pulihkan (Restore)
                                                                    </DropdownMenuItem>
                                                                </>
                                                            ) : (
                                                                // JIKA ITEM MASIH AKTIF
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem 
                                                                        onClick={() => openDeleteModal(item)}
                                                                        className="text-orange-600 focus:text-orange-600"
                                                                    >
                                                                        <Archive className="mr-2 h-4 w-4" /> Non-aktifkan
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            
                                                            {/* HARDDELETE - selalu ada tapi dengan styling berbeda */}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem 
                                                                onClick={() => openForceDeleteModal(item)} 
                                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> Hapus Permanen
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
                        {items.last_page > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-sm text-muted-foreground">
                                    Menampilkan {items.from} sampai {items.to} dari {items.total} data
                                    {filters?.show_inactive && (
                                        <span className="ml-2 text-amber-600">
                                            (Termasuk {items.data.filter(item => item.deleted_at).length} non-aktif)
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {items.links.map((link, index) => {
                                        const label = link.label.replace('&laquo;', '').replace('&raquo;', '').trim();
                                        if (link.label.includes('Previous')) {
                                            return (
                                                <Link key={index} href={link.url || '#'} preserveScroll preserveState className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 w-8 ${!link.url ? 'pointer-events-none opacity-50' : ''}`}>
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Link>
                                            );
                                        }
                                        if (link.label.includes('Next')) {
                                            return (
                                                <Link key={index} href={link.url || '#'} preserveScroll preserveState className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 w-8 ${!link.url ? 'pointer-events-none opacity-50' : ''}`}>
                                                    <ChevronRight className="h-4 w-4" />
                                                </Link>
                                            );
                                        }
                                        return (
                                            <Link key={index} href={link.url || '#'} preserveScroll preserveState className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input shadow-sm h-8 w-8 ${link.active ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-background hover:bg-accent hover:text-accent-foreground"}`}>
                                                {label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* --- VIEW MODAL --- */}
                <ViewModal
                    title="Detail Barang"
                    description={selectedItem ? `Kode: ${selectedItem.item_code}` : 'Informasi detail barang'}
                    open={isDetailOpen}
                    onOpenChange={setIsDetailOpen}
                    triggerText=""
                    size="md"
                >
                    {selectedItem && (
                         <div className="grid gap-4 py-0">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-semibold text-muted-foreground">Kode</Label>
                                <div className="col-span-3 text-sm font-bold">{selectedItem.item_code}</div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-semibold text-muted-foreground">Nama</Label>
                                <div className="col-span-3 text-sm font-medium">{selectedItem.item_name}</div>
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right font-semibold text-muted-foreground mt-1">Deskripsi</Label>
                                <div className="col-span-3 text-sm">{selectedItem.item_description || '-'}</div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-semibold text-muted-foreground">Stok</Label>
                                <div className="col-span-3">
                                    <Badge variant={selectedItem.item_stock > selectedItem.item_min_stock ? "outline" : "destructive"}>{selectedItem.item_stock} Unit</Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-semibold text-muted-foreground">Harga Jual</Label>
                                <div className="col-span-3 text-sm font-bold text-primary">{formatRupiah(Number(selectedItem.item_price))}</div>
                            </div>
                        </div>
                    )}
                </ViewModal>
                
                {/* --- MODAL CREATE --- */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Tambah Barang</DialogTitle></DialogHeader>
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div className="space-y-2"><Label>Nama Barang</Label><Input value={data.item_name} onChange={(e) => setData('item_name', e.target.value)} required />{errors.item_name && <span className="text-red-500 text-xs">{errors.item_name}</span>}</div>
                            <div className="space-y-2"><Label>Deskripsi</Label><Input value={data.item_description} onChange={(e) => setData('item_description', e.target.value)} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Stok Awal</Label><Input type="number" value={data.item_stock} onChange={(e) => setData('item_stock', parseInt(e.target.value))} required /></div>
                                <div className="space-y-2"><Label>Min. Stok</Label><Input type="number" value={data.item_min_stock} onChange={(e) => setData('item_min_stock', parseInt(e.target.value))} required /></div>
                            </div>
                            <div className="space-y-2"><Label>Harga Jual</Label><MoneyInput placeholder="Rp 0" value={data.item_price} onValueChange={(values) => setData('item_price', values.floatValue || 0)} required /></div>
                            <DialogFooter className="mt-4"><Button type="submit" disabled={processing}>Simpan</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* --- EDIT MODAL GENERIC --- */}
                {selectedItemForEdit && (
                    <EditModal<Item>
                        isOpen={isEditModalOpen}
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setSelectedItemForEdit(null);
                        }}
                        title="Edit Barang"
                        data={selectedItemForEdit}
                        schema={itemSchema}
                        onSubmit={handleEditSubmit}
                        onDelete={handleDeleteInModal}
                        isLoading={processing}
                        showDelete={true}
                        deleteConfirmMessage="Apakah Anda yakin ingin menonaktifkan barang ini?"
                        width="lg"
                        maxHeight="85vh"
                    />
                )}

                {/* --- MODAL SOFT DELETE (Non-aktifkan) --- */}
                <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Non-aktifkan Barang?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Barang <b>{selectedItem?.item_name}</b> akan dinonaktifkan (Inactive) dan tidak akan muncul di penjualan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction className="bg-orange-600 hover:bg-orange-700" onClick={handleDelete}>Non-aktifkan</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* --- MODAL HARD DELETE (Permanen) --- */}
                <AlertDialog open={isForceDeleteOpen} onOpenChange={setIsForceDeleteOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-600">Hapus Permanen?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Anda akan menghapus barang <b>{selectedItem?.item_name}</b> secara permanen dari database.
                                <br /><br />
                                <span className="font-bold text-red-500">PERINGATAN:</span> Tindakan ini tidak dapat dibatalkan.
                                Jika barang ini sudah pernah dijual/dibeli, sistem akan menolak penghapusan ini.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={hardForceDelete}>
                                Hapus Selamanya
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* --- MODAL RESTORE (PULIHKAN) --- */}
                <AlertDialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-green-700">Pulihkan Barang?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Barang <b>{selectedItem?.item_name}</b> akan diaktifkan kembali.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction className="bg-green-600 hover:bg-green-700 text-white" onClick={confirmRestore}>
                                Pulihkan
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </div>
        </AppLayout>
    );
}