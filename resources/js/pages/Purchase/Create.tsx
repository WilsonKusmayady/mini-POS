import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Save } from 'lucide-react';
import { FormEventHandler } from 'react';

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
    discount_item: number; // [Baru] Field untuk diskon persen
}

interface CreateProps {
    suppliers: Supplier[];
    items: Item[];
}

export default function PurchaseCreate({ suppliers, items }: CreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        items: [] as PurchaseItem[],
    });

    // Helper: Tambah Baris
    const addItemRow = () => {
        setData('items', [
            ...data.items,
            { 
                item_code: '', 
                item_name: '', 
                buy_price: 0, 
                quantity: 1, 
                discount_item: 0 // Default diskon 0%
            }
        ]);
    };

    // Helper: Hapus Baris
    const removeItemRow = (index: number) => {
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    // Helper: Update Data Row
    const updateItemRow = (index: number, field: keyof PurchaseItem, value: any) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-fill nama barang saat item dipilih
        if (field === 'item_code') {
            const selectedItem = items.find(i => i.item_code === value);
            if (selectedItem) {
                newItems[index].item_name = selectedItem.item_name;
            }
        }
        setData('items', newItems);
    };

    // Kalkulasi Grand Total (Memperhitungkan Diskon)
    const grandTotal = data.items.reduce((acc, item) => {
        const priceAfterDiscount = item.buy_price - (item.buy_price * (item.discount_item / 100));
        return acc + (priceAfterDiscount * item.quantity);
    }, 0);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('purchases.store'));
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Transaksi Pembelian', href: '#' }]}>
            <Head title="Transaksi Pembelian" />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Header: Supplier & Info */}
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

                        {/* Summary Card */}
                        <Card className="flex flex-col justify-center items-center bg-muted/50">
                            <CardContent className="text-center pt-6">
                                <h3 className="text-lg font-medium text-muted-foreground">Total Transaksi</h3>
                                <p className="text-4xl font-bold text-primary mt-2">
                                    Rp {grandTotal.toLocaleString('id-ID')}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table Items */}
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
                                        // Hitung subtotal per baris untuk ditampilkan
                                        const priceAfterDiscount = item.buy_price - (item.buy_price * (item.discount_item / 100));
                                        const rowSubtotal = priceAfterDiscount * item.quantity;

                                        return (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Select 
                                                        value={item.item_code}
                                                        onValueChange={(val) => updateItemRow(index, 'item_code', val)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Pilih Item" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {items.map((i) => (
                                                                <SelectItem key={i.item_code} value={i.item_code}>
                                                                    {i.item_name} (Stok: {i.item_stock})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
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
                                                    {/* Input Diskon */}
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

                    <div className="flex justify-end">
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