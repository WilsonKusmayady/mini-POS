// pages/sales/edit.tsx
import AppLayout from '@/layouts/app-layout';
import { appRoutes } from '@/lib/app-routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, Save, ArrowLeft, User, Users, Search, AlertCircle, Eye, X, Info } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';
import { ItemCombobox, Item } from '@/components/item-combobox';
import { MemberEditCombobox, Member } from '@/components/member-edit-combobox';
import { MoneyInput } from '@/components/ui/money-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const breadcrumbs: (invoiceCode?: string) => BreadcrumbItem[] = (invoiceCode) => [
  {
    title: 'Dashboard',
    href: appRoutes.dashboard(),
  },
  {
    title: 'Sales',
    href: appRoutes.sales.index(),
  },
  {
    title: invoiceCode ? `Edit: ${invoiceCode}` : 'Edit Transaksi',
    href: appRoutes.sales.edit(invoiceCode || ''),
  }
];

interface SaleItem {
  item_code: string;
  item_name: string;
  sell_price: number;
  sales_quantity: number;
  sales_discount_item: number;
  sales_hasil_diskon_item: number;
  total_item_price: number;
  stock: number; // Stock asli dari database
  original_quantity: number; // Jumlah original sebelum edit
}

interface SaleData {
  sales_invoice_code: string;
  customer_name: string;
  member_code: string | null;
  member?: {
    member_code: string;
    member_name: string;
  } | null;
  sales_date: string;
  sales_subtotal: number;
  sales_discount_value: number;
  sales_hasil_discount_value: number;
  sales_grand_total: number;
  sales_payment_method: 'cash' | 'debit' | 'qris';
  sales_status: boolean;
  items: SaleItem[];
}

interface EditProps {
  sale: SaleData;
}

interface StockInfo {
  [itemCode: string]: {
    originalStock: number;
    originalQuantity: number;
    currentStock: number;
    availableStock: number;
  };
}

export default function EditSale({ sale: initialSale }: EditProps) {
  const [sale, setSale] = useState<SaleData>(initialSale);
  const [memberType, setMemberType] = useState<'member' | 'non-member'>(
    initialSale.member_code ? 'member' : 'non-member'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemStocks, setItemStocks] = useState<Record<string, number>>({});
  const [originalItemQuantities, setOriginalItemQuantities] = useState<Record<string, number>>({});
  const [stockInfo, setStockInfo] = useState<StockInfo>({});
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    sales_date: initialSale.sales_date
    ? initialSale.sales_date.split('T')[0]
    : '',
    sales_payment_method: initialSale.sales_payment_method,
    sales_discount_value: initialSale.sales_discount_value,
    sales_status: initialSale.sales_status,
    member_code: initialSale.member_code || '',
    customer_name: initialSale.customer_name || '',
    items: initialSale.items.map(item => ({
      ...item,
      original_quantity: item.sales_quantity,
      stock: item.stock || 0
    })),
    new_member: {
      member_name: '',
      phone_number: '',
      address: '',
      gender: '1' as '1' | '0',
      birth_date: new Date().toISOString().split('T')[0],
    }
  });

  // Inisialisasi stock info
  useEffect(() => {
    const newStockInfo: StockInfo = {};
    const stockMap: Record<string, number> = {};
    const originalQtyMap: Record<string, number> = {};
    const totalOriginalQty: Record<string, number> = {};
    
    formData.items.forEach(item => {
        totalOriginalQty[item.item_code] = (totalOriginalQty[item.item_code] || 0) + item.original_quantity;
    });
    
    // Hitung total current quantity per item
    const totalCurrentQty: Record<string, number> = {};
    formData.items.forEach(item => {
        totalCurrentQty[item.item_code] = (totalCurrentQty[item.item_code] || 0) + item.sales_quantity;
    });
    
    formData.items.forEach(item => {
        const originalQty = item.original_quantity || item.sales_quantity;
        const currentStock = item.stock || 0;
        
        // PERBAIKAN: Hitung stock yang benar-benar tersedia
        // Stok tersedia = stok asli + (selisih antara original dan current)
        // Jika mengurangi quantity, stok bertambah
        const totalOriginalForItem = totalOriginalQty[item.item_code] || 0;
        const totalCurrentForItem = totalCurrentQty[item.item_code] || 0;
        const quantityDiff = totalOriginalForItem - totalCurrentForItem;
        
        // Stok yang tersedia untuk dipakai lagi
        const availableStock = Math.max(0, currentStock + quantityDiff);
        
        newStockInfo[item.item_code] = {
            originalStock: currentStock,
            originalQuantity: originalQty,
            currentStock: currentStock,
            availableStock: availableStock
        };
        
        stockMap[item.item_code] = currentStock;
        originalQtyMap[item.item_code] = originalQty;
    });
    formData.items.forEach(item => {
        const originalQty = item.original_quantity || item.sales_quantity;
        const currentStock = item.stock || 0;
        
        // PERBAIKAN: Hitung stock yang benar-benar tersedia
        // Stok tersedia = stok asli + (selisih antara original dan current)
        // Jika mengurangi quantity, stok bertambah
        const totalOriginalForItem = totalOriginalQty[item.item_code] || 0;
        const totalCurrentForItem = totalCurrentQty[item.item_code] || 0;
        const quantityDiff = totalOriginalForItem - totalCurrentForItem;
        
        // Stok yang tersedia untuk dipakai lagi
        const availableStock = Math.max(0, currentStock + quantityDiff);
        
        newStockInfo[item.item_code] = {
            originalStock: currentStock,
            originalQuantity: originalQty,
            currentStock: currentStock,
            availableStock: availableStock
        };
        
        stockMap[item.item_code] = currentStock;
        originalQtyMap[item.item_code] = originalQty;
    });
    
    setStockInfo(newStockInfo);
    setItemStocks(stockMap);
    setOriginalItemQuantities(originalQtyMap);
  }, [formData.items]);

  // Fungsi untuk mendapatkan total stock yang tersedia untuk suatu item
  // Fungsi untuk mendapatkan total stock yang tersedia untuk suatu item
const getAvailableStock = (itemCode: string, excludeIndex?: number): number => {
  const info = stockInfo[itemCode];
  if (!info) return 0;
  
  const { originalStock, originalQuantity, availableStock } = info;
  
  // Jika item ini sudah ada original quantity (artinya sudah di transaksi sebelumnya)
  const currentItem = formData.items.find((item, idx) => 
    item.item_code === itemCode && idx === excludeIndex
  );
  
  if (currentItem && currentItem.original_quantity > 0) {
    // Item sudah ada di transaksi sebelumnya
    // Hitung total quantity yang sudah dipilih di semua row
    const totalSelected = formData.items.reduce((total, item, idx) => {
      if (item.item_code === itemCode) {
        return total + item.sales_quantity;
      }
      return total;
    }, 0);
    
    // Stok tersedia = stok asli + total original - total yang sudah dipilih
    const totalOriginal = formData.items
      .filter(item => item.item_code === itemCode)
      .reduce((sum, item) => sum + item.original_quantity, 0);
    
    return Math.max(0, originalStock + totalOriginal - totalSelected);
  } else {
    // Item baru ditambahkan
    // Hitung total quantity yang sudah dipilih di semua row (kecuali row saat ini)
    const totalSelectedOthers = formData.items.reduce((total, item, idx) => {
      if (item.item_code === itemCode && idx !== excludeIndex) {
        return total + item.sales_quantity;
      }
      return total;
    }, 0);
    
    return Math.max(0, availableStock - totalSelectedOthers);
  }
};

  // Fungsi untuk mendapatkan informasi stock yang diperbarui
  const getStockInfo = (itemCode: string): string => {
    const info = stockInfo[itemCode];
    if (!info) return 'Stok: 0';
    
    const { originalStock, originalQuantity, availableStock } = info;
    const totalStock = originalStock + originalQuantity;
    
    return `Stok asli: ${originalStock} + Transaksi: ${originalQuantity} = ${totalStock}. Tersedia: ${availableStock}`;
  };

  // Handle member selection
  const handleMemberSelect = (member: Member) => {
    setFormData({
      ...formData,
      member_code: member.member_code,
      customer_name: member.member_name
    });
  };

  // Handle new member creation
  const handleCreateMember = async () => {
    try {
      const response = await axios.post(appRoutes.members.store(), formData.new_member);
      
      if (response.data.success) {
        setIsMemberDialogOpen(false);
        toast.success('Member berhasil dibuat');
        
        if (response.data.member) {
          setMemberType('member');
          setFormData({
            ...formData,
            member_code: response.data.member.member_code,
            customer_name: response.data.member.member_name
          });
        }
        
        // Reset form
        setFormData(prev => ({
          ...prev,
          new_member: {
            member_name: '',
            phone_number: '',
            address: '',
            gender: '1',
            birth_date: new Date().toISOString().split('T')[0],
          }
        }));
      } else {
        toast.error(response.data.message || 'Gagal membuat member');
      }
      
    } catch (error: any) {
      console.error('Error creating member:', error);
      
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        toast.error(errorMessages.join(', '));
      } else {
        toast.error('Gagal membuat member');
      }
    }
  };

  // Sales item functions
  const addItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { 
          item_code: '', 
          item_name: '', 
          sell_price: 0, 
          sales_quantity: 1, 
          sales_discount_item: 0,
          sales_hasil_diskon_item: 0,
          total_item_price: 0,
          stock: 0,
          original_quantity: 0
        }
      ]
    }));
  };

  const removeItemRow = (index: number) => {
    const newItems = [...formData.items];
    const removedItem = newItems[index];
    
    // Jika item yang dihapus punya original quantity, update stock info
    if (removedItem.item_code && removedItem.original_quantity > 0) {
      const itemCode = removedItem.item_code;
      setStockInfo(prev => {
        const info = prev[itemCode];
        if (!info) return prev;
        
        return {
          ...prev,
          [itemCode]: {
            ...info,
            availableStock: info.availableStock + removedItem.sales_quantity
          }
        };
      });
    }
    
    newItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const updateItemRow = (index: number, field: keyof SaleItem, value: any) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index], [field]: value };
    
    // Validasi quantity
    if (field === 'sales_quantity') {
      const itemCode = item.item_code;
      const quantity = parseInt(value) || 0;
      
      if (itemCode) {
        const availableStock = getAvailableStock(itemCode, index);
        
        if (quantity > availableStock) {
          toast.error(`Stok tidak cukup untuk ${item.item_name}. Stok tersedia: ${availableStock}`);
          item.sales_quantity = Math.max(1, Math.min(availableStock, quantity));
        }
        
        if (quantity <= 0) {
          item.sales_quantity = 1;
        }
      }
    }
    
    // Recalculate discount value and total price
    if (field === 'sell_price' || field === 'sales_quantity' || field === 'sales_discount_item') {
      const sellPrice = parseFloat(item.sell_price.toString()) || 0;
      const quantity = parseInt(item.sales_quantity.toString()) || 0;
      const discountPercent = parseFloat(item.sales_discount_item.toString()) || 0;
      
      item.sales_hasil_diskon_item = (sellPrice * (discountPercent / 100)) * quantity;
      item.total_item_price = (sellPrice * quantity) - item.sales_hasil_diskon_item;
    }
    
    newItems[index] = item;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleItemSelect = async (index: number, item: Item) => {
    try {
      // Ambil info stok terbaru
      const stockResponse = await axios.get(`/api/items/${item.item_code}/stock`);
      const currentStock = stockResponse.data.stock || item.item_stock || 0;
      
      const newItems = [...formData.items];
      
      // Simpan stok
      setItemStocks(prev => ({
        ...prev,
        [item.item_code]: currentStock
      }));
      
      // Update stock info
      setStockInfo(prev => ({
        ...prev,
        [item.item_code]: {
          originalStock: currentStock,
          originalQuantity: 0, // Item baru, belum ada di transaksi sebelumnya
          currentStock: currentStock,
          availableStock: currentStock - newItems
            .filter((i, idx) => idx !== index && i.item_code === item.item_code)
            .reduce((sum, i) => sum + i.sales_quantity, 0)
        }
      }));
      
      // Set quantity maksimum = stok yang tersedia
      const availableStock = getAvailableStock(item.item_code, index);
      const quantity = Math.min(1, availableStock);
      
      newItems[index] = {
        ...newItems[index],
        item_code: item.item_code,
        item_name: item.item_name,
        sell_price: item.item_price || 0,
        sales_quantity: quantity,
        stock: currentStock,
        original_quantity: 0, // Baru ditambahkan
        sales_hasil_diskon_item: 0,
        total_item_price: (item.item_price || 0) * quantity
      };
      
      setFormData(prev => ({ ...prev, items: newItems }));
      
      // Tampilkan peringatan jika stok rendah
      if (currentStock < 10) {
        toast.warning(`Stok ${item.item_name} rendah: ${currentStock} unit`, {
          description: "Segera lakukan restock"
        });
      }
      
    } catch (error) {
      console.error('Error fetching stock:', error);
      toast.error('Gagal mengambil data stok');
    }
  };

  // Calculations
  const subtotal = formData.items.reduce((acc, item) => 
    acc + (item.sell_price * item.sales_quantity), 0
  );
  
  const totalItemDiscount = formData.items.reduce((acc, item) => 
    acc + item.sales_hasil_diskon_item, 0
  );
  
  const discountPercentage = formData.sales_discount_value || 0;
  const transactionDiscount = (subtotal - totalItemDiscount) * (discountPercentage / 100);
  const grandTotal = (subtotal - totalItemDiscount) - transactionDiscount;

  // Validasi sebelum submit
  const validateBeforeSubmit = (): boolean => {
    // Validasi nama pelanggan
    if (!formData.customer_name.trim()) {
      toast.error('Nama pelanggan harus diisi');
      return false;
    }
    
    // Validasi minimal 1 item
    if (formData.items.length === 0) {
      toast.error('Transaksi harus memiliki minimal 1 item');
      return false;
    }
    
    // Validasi semua item memiliki item_code
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      
      if (!item.item_code) {
        toast.error(`Baris ${i + 1}: Pilih item terlebih dahulu`);
        return false;
      }
      
      const availableStock = getAvailableStock(item.item_code, i);
      
      if (item.sales_quantity > availableStock) {
        toast.error(`Baris ${i + 1}: ${item.item_name} - Quantity melebihi stok tersedia (${availableStock})`);
        return false;
      }
      
      if (item.sales_quantity <= 0) {
        toast.error(`Baris ${i + 1}: ${item.item_name} - Quantity harus lebih dari 0`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit: FormEventHandler = async (e) => {
    e.preventDefault();
    
    if (!validateBeforeSubmit()) {
      return;
    }
    
    // Prepare data for submission
    const updateData = {
      customer_name: formData.customer_name,
      member_code: memberType === 'member' ? formData.member_code : null,
      sales_date: formData.sales_date,
      sales_discount_value: formData.sales_discount_value,
      sales_payment_method: formData.sales_payment_method,
      sales_status: formData.sales_status,
      items: formData.items.map(item => ({
        item_code: item.item_code,
        sales_quantity: item.sales_quantity,
        sell_price: item.sell_price,
        sales_discount_item: item.sales_discount_item,
        sales_hasil_diskon_item: item.sales_hasil_diskon_item,
        total_item_price: item.total_item_price,
        stock: item.stock, // Kirim info stok untuk validasi
        original_quantity: item.original_quantity // Kirim original quantity
      }))
    };

    try {
      setIsSubmitting(true);
      
      const response = await axios.put(
        `/api/sales/${sale.sales_invoice_code}`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        }
      );

      if (response.data.success) {
        toast.success('Transaksi berhasil diperbarui');
        
        // Redirect ke halaman detail atau history
        router.visit(appRoutes.sales.index());
      } else {
        throw new Error(response.data.message);
      }
      
    } catch (error: any) {
      console.error('Error updating sale:', error);
      
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        toast.error(`Validasi gagal: ${errorMessages.join(', ')}`);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Gagal memperbarui transaksi');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs(sale.sales_invoice_code)}>
      <Head title={`Edit: ${sale.sales_invoice_code}`} />
      
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={appRoutes.sales.index()}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Edit Transaksi: {sale.sales_invoice_code}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={sale.sales_status ? "default" : "destructive"}>
                  {sale.sales_status ? 'Paid' : 'Cancelled'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Tanggal: {new Date(sale.sales_date).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href={appRoutes.sales.nota(sale.sales_invoice_code)} target="_blank">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Lihat Nota
              </Button>
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Status dan Informasi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Status Transaksi</span>
                <div className="flex items-center gap-2">
                  <Label htmlFor="sales_status" className="text-sm font-normal">
                    Status Paid
                  </Label>
                  <Switch
                    id="sales_status"
                    checked={formData.sales_status}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, sales_status: checked }))
                    }
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Jika status dinonaktifkan, semua stok barang akan dikembalikan. Aktifkan kembali untuk mengurangi stok.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Customer Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Tipe Pelanggan</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs 
                value={memberType} 
                onValueChange={(value) => setMemberType(value as 'member' | 'non-member')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="non-member">
                    <User className="w-4 h-4 mr-2" />
                    Non-Member
                  </TabsTrigger>
                  <TabsTrigger value="member">
                    <Users className="w-4 h-4 mr-2" />
                    Member
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="non-member" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nama Pelanggan *</Label>
                      <Input
                        placeholder="Nama pelanggan non-member"
                        value={formData.customer_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="flex items-end space-y-2">
                      <div className="flex-1">
                        <Label>Ingin menjadi member?</Label>
                        <p className="text-sm text-muted-foreground">
                          Pelanggan bisa dibuat sebagai member baru
                        </p>
                      </div>
                      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline">
                            Buat Member Baru
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Daftar Member Baru</DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Nama Member *</Label>
                              <Input
                                value={formData.new_member.member_name}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  new_member: {
                                    ...prev.new_member,
                                    member_name: e.target.value
                                  }
                                }))}
                                placeholder="Nama lengkap"
                                required
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Nomor Telepon *</Label>
                                <Input
                                  value={formData.new_member.phone_number}
                                  placeholder="0812-3456-7890"
                                  required
                                  onKeyDown={(e) => {
                                    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
                                    if (allowedKeys.includes(e.key) || /^[0-9+\-() ]$/.test(e.key)) {
                                      return;
                                    }
                                    e.preventDefault();
                                  }}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    new_member: {
                                      ...prev.new_member,
                                      phone_number: e.target.value,
                                    }
                                  }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Tanggal Lahir</Label>
                                <Input
                                  type="date"
                                  value={formData.new_member.birth_date}
                                  onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    new_member: {
                                      ...prev.new_member,
                                      birth_date: e.target.value
                                    }
                                  }))}
                                  max={new Date().toISOString().split('T')[0]}
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Jenis Kelamin</Label>
                              <RadioGroup
                                value={formData.new_member.gender}
                                onValueChange={(value) => setFormData(prev => ({
                                  ...prev,
                                  new_member: {
                                    ...prev.new_member,
                                    gender: value as '1' | '0'
                                  }
                                }))}
                                className="flex space-x-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="1" id="male" />
                                  <Label htmlFor="male">Laki-laki</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="0" id="female" />
                                  <Label htmlFor="female">Perempuan</Label>
                                </div>
                              </RadioGroup>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Alamat</Label>
                              <Textarea
                                value={formData.new_member.address}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  new_member: {
                                    ...prev.new_member,
                                    address: e.target.value
                                  }
                                }))}
                                placeholder="Alamat lengkap"
                                rows={3}
                              />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsMemberDialogOpen(false)}
                            >
                              Batal
                            </Button>
                            <Button
                              type="button"
                              onClick={handleCreateMember}
                              disabled={!formData.new_member.member_name || !formData.new_member.phone_number}
                            >
                              Simpan Member
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="member" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pilih Member</Label>
                    <MemberEditCombobox
                      value={formData.member_code || ''}
                      onSelect={handleMemberSelect}
                      placeholder="Cari member dengan kode atau nama..."
                      initialValue={sale.member ? {
                        member_code: sale.member.member_code,
                        member_name: sale.member.member_name
                      } : undefined}
                      disabled={!!sale.member_code}
                    />
                  </div>
                  
                  {formData.member_code && (
                    <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                      <p className="font-medium">Member terpilih:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Nama:</span>
                          <p className="font-medium">{formData.customer_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Kode:</span>
                          <p className="font-medium">{formData.member_code}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Informasi Transaksi - SAMA DENGAN CREATE.TSX */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Transaksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input
                    type="date"
                    value={formData.sales_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, sales_date: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>   
                <div className="space-y-2">
                  <Label>Metode Pembayaran</Label>
                  <Select
                    value={formData.sales_payment_method}
                    onValueChange={(value: 'cash' | 'debit' | 'qris') => 
                      setFormData(prev => ({ ...prev, sales_payment_method: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih metode pembayaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="debit">Debit</SelectItem>
                      <SelectItem value="qris">QRIS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Diskon Transaksi (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={formData.sales_discount_value === 0 ? '' : formData.sales_discount_value}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setFormData(prev => ({ ...prev, sales_discount_value: 0 }));
                        return;
                      }
                      const numValue = Number(value);
                      if (isNaN(numValue) || numValue < 0) {
                        setFormData(prev => ({ ...prev, sales_discount_value: 0 }));
                        return;
                      }
                      setFormData(prev => ({ ...prev, sales_discount_value: Math.min(numValue, 100) }));
                    }}
                    onBlur={(e) => {
                      const numValue = Number(e.target.value);
                      if (isNaN(numValue) || numValue < 0) {
                        setFormData(prev => ({ ...prev, sales_discount_value: 0 }));
                      }
                    }}
                    placeholder="0%"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ringkasan Total */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium text-muted-foreground mb-4">Ringkasan Total</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Diskon Barang:</span>
                    <span>- Rp {totalItemDiscount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Diskon Transaksi ({discountPercentage}%):</span>
                    <span>- Rp {transactionDiscount.toLocaleString('id-ID')}</span>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>Grand Total:</span>
                    <span className="text-primary">
                      Rp {grandTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-4">
                    <p>Total sebelumnya: Rp {sale.sales_grand_total.toLocaleString('id-ID')}</p>
                    <p>Selisih: Rp {(grandTotal - sale.sales_grand_total).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daftar Barang */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daftar Barang</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Stok yang ditampilkan sudah termasuk quantity dari transaksi ini
                </p>
              </div>
              <Button type="button" onClick={addItemRow} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" /> Tambah Barang
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">Barang</TableHead>
                    <TableHead className="w-[15%]">Harga Jual (Rp)</TableHead>
                    <TableHead className="w-[20%]">Qty / Stok</TableHead>
                    <TableHead className="w-[15%]">Diskon Item (%)</TableHead>
                    <TableHead className="w-[15%] text-right">Diskon (Rp)</TableHead>
                    <TableHead className="w-[10%] text-right">Subtotal</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Belum ada barang dipilih. Klik "Tambah Barang".
                      </TableCell>
                    </TableRow>
                  )}
                  {formData.items.map((item, index) => {
                    const itemCode = item.item_code;
                    const availableStock = getAvailableStock(itemCode, index);
                    const stockWarning = availableStock <= 5;
                    const hasOriginalQuantity = item.original_quantity > 0;
                    
                    return (
                      <TableRow key={index} className={stockWarning ? "bg-amber-50" : ""}>
                        <TableCell>
                          <div className="space-y-1">
                            <ItemCombobox
                            value={itemCode}
                            displayValue={item.item_name || ''} // TAMBAH INI: tampilkan nama item
                            onSelect={(selectedItem) => handleItemSelect(index, selectedItem)}
                            placeholder="Cari Barang..."
                            disabledItems={formData.items
                                .map(i => i.item_code)
                                .filter(code => code !== '' && code !== itemCode)}
                            />
                            {itemCode && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                <span>{getStockInfo(itemCode)}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <MoneyInput
                            placeholder="Rp 0"
                            value={item.sell_price}
                            onValueChange={(values) => {
                              updateItemRow(index, 'sell_price', values.floatValue || 0);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              min="1"
                              max={availableStock}
                              value={item.sales_quantity}
                              onChange={(e) => {
                                const value = e.target.value;
                                const numValue = parseInt(value, 10);
                                
                                if (value === '') return;
                                
                                if (!isNaN(numValue)) {
                                  updateItemRow(index, 'sales_quantity', numValue);
                                }
                              }}
                              onBlur={(e) => {
                                let value = parseInt(e.target.value, 10);
                                
                                if (isNaN(value) || value < 1) {
                                  value = 1;
                                }
                                
                                if (value > availableStock) {
                                  value = availableStock;
                                  toast.warning(`Quantity dibatasi ke stok tersedia: ${availableStock}`);
                                }
                                
                                updateItemRow(index, 'sales_quantity', value);
                              }}
                              className={stockWarning ? "border-amber-300" : ""}
                            />
                            
                            <div className="flex justify-between text-xs">
                              <span className={stockWarning ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                                Tersedia: {availableStock}
                              </span>
                              {hasOriginalQuantity && (
                                <span className="text-blue-600">
                                  Original: {item.original_quantity}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={item.sales_discount_item === 0 ? '' : item.sales_discount_item}
                            onKeyDown={(e) => {
                              if (e.key === '-' || e.key === 'e') {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || value === '-' || value === '.') {
                                updateItemRow(index, 'sales_discount_item', 0);
                              } else {
                                const numValue = parseFloat(value);
                                const finalValue = Math.min(isNaN(numValue) ? 0 : numValue, 100);
                                updateItemRow(index, 'sales_discount_item', finalValue);
                              }
                            }}
                            onBlur={(e) => {
                              if (e.target.value === '' || e.target.value === '-' || e.target.value === '.') {
                                updateItemRow(index, 'sales_discount_item', 0);
                              }
                            }}
                            placeholder="0%"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-red-600">
                            - Rp {item.sales_hasil_diskon_item.toLocaleString('id-ID')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          Rp {item.total_item_price.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItemRow(index)}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Link href={appRoutes.sales.index()}>
              <Button type="button" variant="outline" size="lg">
                Batal
              </Button>
            </Link>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || formData.items.length === 0}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </AppLayout>
  );
}