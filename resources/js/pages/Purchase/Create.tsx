import AppLayout from '@/layouts/app-layout';
import { Head, useForm, Link } from '@inertiajs/react'; // Import Link
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Save, Check, ChevronsUpDown, Loader2, ArrowLeft } from 'lucide-react'; // Import ArrowLeft
import { FormEventHandler, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import axios from 'axios';

// --- Tipe Data ---

interface Supplier {
    supplier_id: number;
    supplier_name: string;
}

interface Item {
    item_code: string;
    item_name: string;
    item_stock: number;
}

interface PurchaseItem {
    item_code: string;
    item_name: string;
    buy_price: number;
    quantity: number;
    discount_item: number;
}

interface CreateProps {
    suppliers: Supplier[];
}

// --- Komponen Item Combobox (Async) ---
// (Kode ItemCombobox Tetap Sama, tidak diubah demi ringkas, 
//  asumsikan kode ItemCombobox yang Anda kirim sebelumnya ada disini)
interface ItemComboboxProps {
    value: string;
    onSelect: (item: Item) => void;
}
const ItemCombobox = ({ value, onSelect }: ItemComboboxProps) => {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedItemCache, setSelectedItemCache] = useState<Item | null>(null);

    const fetchItems = async (pageParam: number, searchParam: string, reset = false) => {
        try {
            setLoading(true);
            const { data } = await axios.get('/items/search', {
                params: { page: pageParam, q: searchParam }
            });
            const newItems = data.data; 
            setItems(prev => reset ? newItems : [...prev, ...newItems]);
            setHasMore(!!data.next_page_url);
            setLoading(false);
        } catch (error) {
            console.error("Gagal load item", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setPage(1);
            fetchItems(1, search, true);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            if (!loading && hasMore) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchItems(nextPage, search, false);
            }
        }
    };

    const displayLabel = items.find(i => i.item_code === value)?.item_name 
        || selectedItemCache?.item_name 
        || (value ? `Item ${value}` : "Pilih Item...");

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    <span className="truncate">{displayLabel}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput placeholder="Cari kode atau nama..." value={search} onValueChange={setSearch} />
                    <CommandList onScroll={handleScroll} className="max-h-[250px] overflow-y-auto">
                        {items.length === 0 && !loading && <CommandEmpty>Item tidak ditemukan.</CommandEmpty>}
                        <CommandGroup>
                            {items.map((item) => (
                                <CommandItem
                                    key={item.item_code}
                                    value={item.item_code}
                                    onSelect={() => {
                                        onSelect(item);
                                        setSelectedItemCache(item);
                                        setOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === item.item_code ? "opacity-100" : "opacity-0")} />
                                    <div className="flex flex-col">
                                        <span>{item.item_name}</span>
                                        <span className="text-xs text-muted-foreground">Stok: {item.item_stock} | Kode: {item.item_code}</span>
                                    </div>
                                </CommandItem>
                            ))}
                            {loading && <div className="p-2 flex justify-center items-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2"/> Memuat...</div>}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};


// --- Main Component ---

export default function PurchaseCreate({ suppliers }: CreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        items: [] as PurchaseItem[],
    });

    const addItemRow = () => {
        setData('items', [...data.items, { item_code: '', item_name: '', buy_price: 0, quantity: 1, discount_item: 0 }]);
    };

    const removeItemRow = (index: number) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    const updateItemRow = (index: number, field: keyof PurchaseItem, value: any) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setData('items', newItems);
    };

    const handleItemSelect = (index: number, item: Item) => {
        const newItems = [...data.items];
        newItems[index] = {
            ...newItems[index],
            item_code: item.item_code,
            item_name: item.item_name,
        };
        setData('items', newItems);
    };

    const grandTotal = data.items.reduce((acc, item) => {
        const priceAfterDiscount = item.buy_price - (item.buy_price * (item.discount_item / 100));
        return acc + (priceAfterDiscount * item.quantity);
    }, 0);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('purchases.store'));
    };

    // Update Breadcrumbs
    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Pembelian', href: route('purchases.index') }, // Link ke History
        { title: 'Buat Transaksi', href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Transaksi Pembelian" />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                
                {/* Header dengan Tombol Kembali */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href={route('purchases.index')}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Transaksi Baru</h2>
                            <p className="text-sm text-muted-foreground">Input data pembelian barang masuk.</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ... (Isi Form tetap sama seperti sebelumnya) ... */}
                    
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Supplier</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Supplier</Label>
                                    <Select 
                                        onValueChange={(val) => setData('supplier_id', val)}
                                        value={data.supplier_id}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Supplier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map((sup) => (
                                                <SelectItem key={sup.supplier_id} value={sup.supplier_id.toString()}>
                                                    {sup.supplier_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.supplier_id && <p className="text-sm text-red-500">{errors.supplier_id}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Tanggal</Label>
                                    <Input 
                                        type="date" 
                                        value={data.purchase_date}
                                        onChange={(e) => setData('purchase_date', e.target.value)}
                                    />
                                    {errors.purchase_date && <p className="text-sm text-red-500">{errors.purchase_date}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="flex flex-col justify-center items-center bg-muted/50">
                            <CardContent className="text-center pt-6">
                                <h3 className="text-lg font-medium text-muted-foreground">Total Transaksi</h3>
                                <p className="text-4xl font-bold text-primary mt-2">
                                    Rp {grandTotal.toLocaleString('id-ID')}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Daftar Barang</CardTitle>
                            <Button type="button" onClick={addItemRow} variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" /> Tambah Barang
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[30%]">Barang</TableHead>
                                        <TableHead className="w-[20%]">Harga Beli (Rp)</TableHead>
                                        <TableHead className="w-[10%]">Qty</TableHead>
                                        <TableHead className="w-[15%]">Diskon (%)</TableHead>
                                        <TableHead className="w-[20%] text-right">Subtotal</TableHead>
                                        <TableHead className="w-[5%]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                Belum ada barang dipilih. Klik "Tambah Barang".
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {data.items.map((item, index) => {
                                        const priceAfterDiscount = item.buy_price - (item.buy_price * (item.discount_item / 100));
                                        const rowSubtotal = priceAfterDiscount * item.quantity;

                                        return (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <ItemCombobox 
                                                        value={item.item_code}
                                                        onSelect={(selectedItem) => handleItemSelect(index, selectedItem)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        type="number" 
                                                        min="0"
                                                        placeholder="0"
                                                        value={item.buy_price}
                                                        onChange={(e) => updateItemRow(index, 'buy_price', parseFloat(e.target.value) || 0)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        type="number" 
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItemRow(index, 'quantity', parseInt(e.target.value) || 0)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        type="number" 
                                                        min="0"
                                                        max="100"
                                                        value={item.discount_item}
                                                        onChange={(e) => updateItemRow(index, 'discount_item', parseFloat(e.target.value) || 0)}
                                                        placeholder="0%"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    Rp {rowSubtotal.toLocaleString('id-ID')}
                                                </TableCell>
                                                <TableCell>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => removeItemRow(index)}
                                                        className="text-red-500 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            {errors.items && <p className="text-sm text-red-500 mt-2">{errors.items}</p>}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                        {/* Tombol Cancel / Kembali juga di bawah */}
                        <Link href={route('purchases.index')}>
                            <Button type="button" variant="outline" size="lg">
                                Batal
                            </Button>
                        </Link>

                        <Button type="submit" size="lg" disabled={processing || data.items.length === 0}>
                            <Save className="w-4 h-4 mr-2" />
                            Simpan Transaksi
                        </Button>
                    </div>

                </form>
            </div>
        </AppLayout>
    );
}