import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
// --- Import Dropdown ---
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// --- Import Alert & Icon ---
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Trash2, Edit, Eye, Search, X, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2Icon, AlertCircleIcon, MoreHorizontal } from 'lucide-react';
import { useState, FormEventHandler, useEffect } from 'react';
import { SharedData } from '@/types';

// --- Interfaces ---

interface Item {
    item_code: string;
    item_name: string;
    item_description: string | null;
    item_price: number;
    item_stock: number;
    item_min_stock: number;
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
    };
}

export default function ItemIndex({ items, filters }: IndexProps) {
    // --- Hooks & State ---
    const { flash } = usePage<SharedData>().props; 

    // State Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false); // State baru untuk Delete Dialog
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    // --- Search & Sort State ---
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const currentSortBy = filters?.sort_by || 'item_name';
    const currentSortDir = filters?.sort_direction || 'asc';

    // --- Search Logic ---
    useEffect(() => {
        const currentSearchParam = filters?.search || '';
        if (searchTerm === currentSearchParam) return;

        const delaySearch = setTimeout(() => {
            router.get(
                route('items.index'),
                { 
                    search: searchTerm,
                    sort_by: currentSortBy,
                    sort_direction: currentSortDir 
                },
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [searchTerm, filters]);

    // --- Sort Handler ---
    const handleSort = (field: string) => {
        let direction = 'asc';
        if (field === currentSortBy) {
            direction = currentSortDir === 'asc' ? 'desc' : 'asc';
        }
        router.get(
            route('items.index'),
            { search: searchTerm, sort_by: field, sort_direction: direction },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (field !== currentSortBy) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
        return currentSortDir === 'asc' 
            ? <ArrowUp className="ml-2 h-4 w-4 text-primary" /> 
            : <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
    };

    // --- Form Hook ---
    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        item_name: '',
        item_price: 0,
        item_stock: 0,
        item_min_stock: 0,
        item_description: '',
    });

    // --- Modal Handlers ---
    const openCreateModal = () => { reset(); setIsCreateOpen(true); };
    
    const openEditModal = (item: Item) => {
        setSelectedItem(item);
        setData({
            item_name: item.item_name,
            item_price: item.item_price,
            item_stock: item.item_stock,
            item_min_stock: item.item_min_stock,
            item_description: item.item_description || '',
        });
        setIsEditOpen(true);
    };
    
    const openDetailModal = (item: Item) => { setSelectedItem(item); setIsDetailOpen(true); };

    // Handler baru untuk Delete Modal
    const openDeleteModal = (item: Item) => { 
        setSelectedItem(item); 
        setIsDeleteOpen(true); 
    };

    const handleCreateSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('items.store'), { 
            onSuccess: () => { setIsCreateOpen(false); reset(); } 
        });
    };

    const handleEditSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!selectedItem) return;
        put(route('items.update', selectedItem.item_code), { 
            onSuccess: () => { setIsEditOpen(false); setSelectedItem(null); reset(); } 
        });
    };

    const handleDelete = () => { 
        if (!selectedItem) return;
        destroy(route('items.destroy', selectedItem.item_code), {
            onSuccess: () => { setIsDeleteOpen(false); setSelectedItem(null); }
        });
    };

    const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    return (
        <AppLayout breadcrumbs={[{ title: 'Inventory Barang', href: '#' }]}>
            <Head title="Inventory Barang" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                
                {/* --- ALERT NOTIFIKASI --- */}
                {flash.success && (
                    <Alert className="bg-green-50 border-green-200 text-green-900">
                        <CheckCircle2Icon className="h-4 w-4 text-green-600" />
                        <AlertTitle>Berhasil!</AlertTitle>
                        <AlertDescription>{flash.success}</AlertDescription>
                    </Alert>
                )}
                {flash.error && (
                    <Alert variant="destructive">
                        <AlertCircleIcon className="h-4 w-4" />
                        <AlertTitle>Gagal!</AlertTitle>
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Daftar Barang</h2>
                        <p className="text-muted-foreground">Total {items.total} barang dalam database.</p>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cari kode atau nama..."
                                className="pl-9 pr-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <Button onClick={openCreateModal}><Plus className="mr-2 h-4 w-4" /> Tambah</Button>
                    </div>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle>Inventory</CardTitle>
                        <CardDescription>Menampilkan halaman {items.current_page} dari {items.last_page}</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                                            {searchTerm ? 'Barang tidak ditemukan.' : 'Belum ada data barang.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.data.map((item) => (
                                        <TableRow key={item.item_code}>
                                            <TableCell className="font-medium">{item.item_code}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{item.item_name}</span>
                                                    {item.item_stock <= item.item_min_stock && (
                                                        <span className="text-[10px] text-red-500 font-bold">Stok Menipis!</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{item.item_stock}</TableCell>
                                            <TableCell>{formatRupiah(Number(item.item_price))}</TableCell>
                                            <TableCell className="text-right">
                                                {/* DROPDOWN MENU ACTION */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => openDetailModal(item)}>
                                                            <Eye className="mr-2 h-4 w-4" /> Detail
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openEditModal(item)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            onClick={() => openDeleteModal(item)}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
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

                        {/* Pagination */}
                        <div className="flex items-center justify-between pt-4">
                            <div className="text-sm text-muted-foreground">{items.from} - {items.to} dari {items.total} data</div>
                            <div className="flex gap-1">
                                {items.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        preserveScroll
                                        preserveState
                                        className={`px-3 py-1 rounded text-sm border ${link.active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'} ${!link.url ? 'opacity-50 pointer-events-none' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* --- MODAL DETAIL (Fixed Alignment) --- */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Detail Barang</DialogTitle>
                        </DialogHeader>
                        {selectedItem && (
                            <div className="grid gap-4 py-4">
                                {/* Kode Barang (Gunakan items-center agar sejajar tengah) */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right font-semibold text-muted-foreground">
                                        Kode
                                    </Label>
                                    <div className="col-span-3 text-sm font-bold">
                                        {selectedItem.item_code}
                                    </div>
                                </div>
                                
                                {/* Nama Barang */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right font-semibold text-muted-foreground">
                                        Nama
                                    </Label>
                                    <div className="col-span-3 text-sm font-medium">
                                        {selectedItem.item_name}
                                    </div>
                                </div>

                                {/* Deskripsi (Khusus ini pakai items-start karena bisa panjang) */}
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label className="text-right font-semibold text-muted-foreground mt-1">
                                        Deskripsi
                                    </Label>
                                    <div className="col-span-3 text-sm">
                                        {selectedItem.item_description || '-'}
                                    </div>
                                </div>

                                {/* Stok */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right font-semibold text-muted-foreground">
                                        Stok
                                    </Label>
                                    <div className="col-span-3">
                                        <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            selectedItem.item_stock <= selectedItem.item_min_stock 
                                                ? "bg-red-100 text-red-800" 
                                                : "bg-green-100 text-green-800"
                                        }`}>
                                            {selectedItem.item_stock} Unit
                                        </span>
                                        {selectedItem.item_stock <= selectedItem.item_min_stock && (
                                            <p className="text-[10px] text-red-500 mt-1">* Stok di bawah batas minimum ({selectedItem.item_min_stock})</p>
                                        )}
                                    </div>
                                </div>

                                {/* Harga Jual */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right font-semibold text-muted-foreground">
                                        Harga Jual
                                    </Label>
                                    <div className="col-span-3 text-sm font-bold text-primary">
                                        {formatRupiah(Number(selectedItem.item_price))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                                Tutup
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

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
                            <div className="space-y-2"><Label>Harga Jual</Label><Input type="number" value={data.item_price} onChange={(e) => setData('item_price', parseFloat(e.target.value))} required /></div>
                            <DialogFooter className="mt-4"><Button type="submit" disabled={processing}>Simpan</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* --- MODAL EDIT --- */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Edit Barang</DialogTitle></DialogHeader>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="space-y-2"><Label>Nama Barang</Label><Input value={data.item_name} onChange={(e) => setData('item_name', e.target.value)} required /></div>
                            <div className="space-y-2"><Label>Deskripsi</Label><Input value={data.item_description} onChange={(e) => setData('item_description', e.target.value)} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Stok</Label><Input type="number" value={data.item_stock} readOnly className="bg-muted" /></div>
                                <div className="space-y-2"><Label>Min. Stok</Label><Input type="number" value={data.item_min_stock} onChange={(e) => setData('item_min_stock', parseInt(e.target.value))} required /></div>
                            </div>
                            <div className="space-y-2"><Label>Harga Jual</Label><Input type="number" value={data.item_price} onChange={(e) => setData('item_price', parseFloat(e.target.value))} required /></div>
                            <DialogFooter className="mt-4"><Button type="submit" disabled={processing}>Update</Button></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* --- MODAL DELETE (Moved Outside Table) --- */}
                <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Barang?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Barang <b>{selectedItem?.item_name}</b> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                                Hapus
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </div>
        </AppLayout>
    );
}