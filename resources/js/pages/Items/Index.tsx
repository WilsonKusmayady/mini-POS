import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { appRoutes } from '@/lib/app-routes';
import AppLayout from '@/layouts/app-layout';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, AlertTriangle } from 'lucide-react';

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
// --- Tipe Data ---
interface Item {
    item_code: string;
    item_name: string;
    item_stock: number;
    buy_price?: number; // [UBAH] Jadi Optional agar tidak error jika null/undefined
    item_price: number;
    unit: string;
    item_min_stock: number;
}

interface Props {
    items: Item[];
}

export default function ItemIndex({ items }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    
    // State Modal
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);

    // State Delete
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

    const filteredItems = items.filter(item => 
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatRupiah = (number: number | undefined) => {
        if (number === undefined || number === null) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    const handleCreate = () => {
        setEditingItem(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (item: Item) => {
        setEditingItem(item);
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (item: Item) => {
        setItemToDelete(item);
        setIsDeleteDialogOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory Barang" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Inventory Barang</h1>
                        <p className="text-muted-foreground text-sm">
                            Kelola stok, update harga, dan hapus barang.
                        </p>
                    </div>
                    
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Barang
                    </Button>
                </div>

                <Card className="flex-1">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                            <CardTitle>Daftar Stok</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Cari nama atau kode..."
                                    className="pl-8 h-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kode</TableHead>
                                        <TableHead>Nama Barang</TableHead>
                                        <TableHead>Unit</TableHead>
                                        <TableHead className="text-right">Harga Beli</TableHead>
                                        <TableHead className="text-right">Harga Jual</TableHead>
                                        <TableHead className="text-center">Stok</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredItems.length > 0 ? (
                                        filteredItems.map((item) => (
                                            <TableRow key={item.item_code}>
                                                <TableCell className="font-medium text-xs text-muted-foreground">
                                                    {item.item_code}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {item.item_name}
                                                </TableCell>
                                                <TableCell>{item.unit}</TableCell>
                                                <TableCell className="text-right">
                                                    {/* [SAFE] Cek apakah buy_price ada */}
                                                    {formatRupiah(item.buy_price)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatRupiah(item.item_price)}
                                                </TableCell>
                                                <TableCell className="text-center font-bold">
                                                    {item.item_stock}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {item.item_stock <= item.item_min_stock ? (
                                                        <Badge variant="destructive" className="text-[10px]">Menipis</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px]">Aman</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                                <Pencil className="mr-2 h-4 w-4" /> Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onClick={() => handleDeleteClick(item)}
                                                                className="text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                Tidak ada barang ditemukan.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Dialog Form */}
                <ItemFormDialog 
                    open={isDialogOpen} 
                    onOpenChange={setIsDialogOpen}
                    itemToEdit={editingItem}
                />

                {/* Dialog Delete */}
                <DeleteConfirmationDialog 
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    item={itemToDelete}
                />
            </div>
        </AppLayout>
    );
}

// --- Component Form ---
function ItemFormDialog({ open, onOpenChange, itemToEdit }: { 
    open: boolean, 
    onOpenChange: (val: boolean) => void,
    itemToEdit: Item | null 
}) {
    const isEditMode = !!itemToEdit;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        item_name: '',
        unit: 'Pcs',
        buy_price: '',
        item_price: '', 
        item_stock: 0, 
        item_min_stock: 5
    });

    useEffect(() => {
        if (open) {
            clearErrors();
            if (isEditMode && itemToEdit) {
                // [SAFE ACCESS] Gunakan operator ?. dan ?? untuk mencegah crash
                setData({
                    item_name: itemToEdit.item_name,
                    unit: itemToEdit.unit,
                    buy_price: itemToEdit.buy_price?.toString() ?? '', 
                    item_price: itemToEdit.item_price?.toString() ?? '', 
                    item_stock: itemToEdit.item_stock,
                    item_min_stock: itemToEdit.item_min_stock,
                });
            } else {
                reset();
            }
        }
    }, [open, itemToEdit]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isEditMode && itemToEdit) {
            put(route('items.update', itemToEdit.item_code), {
                onSuccess: () => onOpenChange(false),
            });
        } else {
            post(route('items.store'), {
                onSuccess: () => {
                    reset();
                    onOpenChange(false);
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Barang' : 'Tambah Barang Baru'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode 
                            ? `Mengubah data untuk kode: ${itemToEdit?.item_code}`
                            : 'Tambahkan barang baru ke inventory.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nama</Label>
                        <div className="col-span-3">
                            <Input
                                id="name"
                                value={data.item_name}
                                onChange={(e) => setData('item_name', e.target.value)}
                                required
                            />
                             {errors.item_name && <span className="text-red-500 text-xs">{errors.item_name}</span>}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unit" className="text-right">Satuan</Label>
                        <div className="col-span-3">
                             <Input
                                id="unit"
                                value={data.unit}
                                onChange={(e) => setData('unit', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="buy_price" className="text-right">Beli (Rp)</Label>
                        <div className="col-span-3">
                            <Input
                                id="buy_price"
                                type="number"
                                placeholder="Opsional (0 jika kosong)"
                                value={data.buy_price}
                                onChange={(e) => setData('buy_price', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="sell_price" className="text-right">Jual (Rp)</Label>
                        <div className="col-span-3">
                            <Input
                                id="sell_price"
                                type="number"
                                value={data.item_price}
                                onChange={(e) => setData('item_price', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                             <Label>Stok</Label>
                             <Input 
                                type="number" 
                                value={data.item_stock}
                                onChange={(e) => setData('item_stock', parseInt(e.target.value) || 0)}
                             />
                        </div>
                        <div className="grid gap-2">
                             <Label>Min. Stok</Label>
                             <Input 
                                type="number" 
                                value={data.item_min_stock}
                                onChange={(e) => setData('item_min_stock', parseInt(e.target.value) || 0)}
                             />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteConfirmationDialog({ open, onOpenChange, item }: {
    open: boolean,
    onOpenChange: (val: boolean) => void,
    item: Item | null
}) {
    if (!item) return null;

    const handleDelete = () => {
        router.delete(route('items.destroy', item.item_code), {
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Hapus Barang?
                    </DialogTitle>
                    <DialogDescription>
                        Apakah Anda yakin ingin menghapus <strong>{item.item_name}</strong>?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        Ya, Hapus
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}