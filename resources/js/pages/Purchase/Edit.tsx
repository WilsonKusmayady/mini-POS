import React, { FormEventHandler } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Save, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { appRoutes } from '@/lib/app-routes';
import { ItemCombobox, Item } from '@/components/item-combobox'; // Komponen asli (tidak diubah)
import { MoneyInput } from '@/components/ui/money-input';
import { toast } from 'sonner';

interface Supplier {
    supplier_id: number;
    supplier_name: string;
}

// Tipe data untuk form row
interface PurchaseItemForm {
    item_code: string;
    item_name: string; // Helper untuk display nama saat mode edit
    buy_price: number;
    quantity: number;
    discount_item: number;
}

interface EditProps {
    purchase: any;
    suppliers: Supplier[];
}

export default function PurchaseEdit({ purchase, suppliers }: EditProps) {
    
    // 1. Transform Data: Mapping dari format DB ke format Form
    const initialItems: PurchaseItemForm[] = purchase.details.map((detail: any) => ({
        item_code: detail.item_code,
        item_name: detail.item?.item_name || 'Item Tidak Dikenal', // Ambil nama dari relasi
        buy_price: Number(detail.buy_price),
        quantity: Number(detail.quantity),
        discount_item: Number(detail.discount_percent || 0),
    }));

    const { data, setData, put, processing, errors } = useForm({
        supplier_id: purchase.supplier_id.toString(),
        purchase_date: purchase.date,
        items: initialItems,
    });

    // Helper: Tambah Baris Kosong
    const addItemRow = () => {
        setData('items', [
            ...data.items,
            { 
                item_code: '', 
                item_name: '', 
                buy_price: 0, 
                quantity: 1, 
                discount_item: 0 
            }
        ]);
    };

    // Helper: Hapus Baris
    const removeItemRow = (index: number) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    // Helper: Reset Baris untuk mengganti barang (Mode Combobox Aktif)
    const resetItemInRow = (index: number) => {
        const newItems = [...data.items];
        newItems[index] = {
            ...newItems[index],
            item_code: '', // Kosongkan kode agar Combobox muncul
            item_name: '',
        };
        setData('items', newItems);
    }

    // Helper: Update Values
    const updateItemRow = (index: number, field: keyof PurchaseItemForm, value: any) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setData('items', newItems);
    };

    // Callback saat item dipilih dari Combobox
    const handleItemSelect = (index: number, item: Item) => {
        const newItems = [...data.items];
        newItems[index] = {
            ...newItems[index],
            item_code: item.item_code,
            item_name: item.item_name,
            // Jika harga beli 0, gunakan harga dari master barang
            buy_price: newItems[index].buy_price === 0 ? item.item_price : newItems[index].buy_price
        };
        setData('items', newItems);
    };

    // Hitung Grand Total
    const grandTotal = data.items.reduce((acc, item) => {
        const priceAfterDiscount = item.buy_price - (item.buy_price * (item.discount_item / 100));
        return acc + (priceAfterDiscount * item.quantity);
    }, 0);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        // Menggunakan appRoutes.purchases.update yang sudah diperbaiki
        put(appRoutes.purchases.update(purchase.purchase_id), { 
            onSuccess: () => toast.success("Transaksi berhasil diperbarui"),
            onError: () => toast.error("Gagal memperbarui transaksi, cek inputan.")
        });
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: appRoutes.dashboard() },
        { title: 'Purchases', href: appRoutes.purchases.index() },
        { title: `Edit #${purchase.purchase_invoice_number}`, href: '#' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Transaksi Pembelian" />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href={appRoutes.purchases.index()}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Edit Transaksi {purchase.purchase_invoice_number}</h2>
                            <p className="text-sm text-muted-foreground">Ubah data pembelian barang masuk.</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Info Supplier */}
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

                        {/* Summary Total */}
                        <Card className="flex flex-col justify-center items-center bg-muted/50">
                            <CardContent className="text-center pt-6">
                                <h3 className="text-lg font-medium text-muted-foreground">Total Transaksi</h3>
                                <p className="text-4xl font-bold text-primary mt-2">
                                    Rp {grandTotal.toLocaleString('id-ID')}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabel Barang */}
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
                                                Tidak ada barang.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {data.items.map((item, index) => {
                                        const priceAfterDiscount = item.buy_price - (item.buy_price * (item.discount_item / 100));
                                        const rowSubtotal = priceAfterDiscount * item.quantity;

                                        return (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {/* LOGIKA KUNCI: Conditional Rendering */}
                                                    {/* Jika item sudah ada (dari DB), tampilkan text biasa */}
                                                    {item.item_code && item.item_name ? (
                                                        <div className="flex items-center justify-between p-2 border rounded-md bg-secondary/20">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium truncate max-w-[200px]" title={item.item_name}>
                                                                    {item.item_name}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">{item.item_code}</span>
                                                            </div>
                                                            <Button 
                                                                type="button"
                                                                variant="ghost" 
                                                                size="sm" 
                                                                onClick={() => resetItemInRow(index)} // Klik ini untuk memunculkan Combobox
                                                                title="Ganti Barang"
                                                            >
                                                                <RefreshCw className="h-4 w-4 text-blue-500" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        // Jika item kosong (baru/reset), tampilkan Combobox asli
                                                        <ItemCombobox 
                                                            value={item.item_code}
                                                            onSelect={(selectedItem) => handleItemSelect(index, selectedItem)}
                                                            placeholder="Cari Barang..."
                                                            allowOutOfStock={true}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <MoneyInput
                                                        placeholder="Rp 0"
                                                        value={item.buy_price}
                                                        onValueChange={(values) => {
                                                            updateItemRow(index, 'buy_price', values.floatValue || 0);
                                                        }}
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
                        <Link href={appRoutes.purchases.index()}>
                            <Button type="button" variant="outline" size="lg">
                                Batal
                            </Button>
                        </Link>

                        <Button type="submit" size="lg" disabled={processing || data.items.length === 0}>
                            {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}