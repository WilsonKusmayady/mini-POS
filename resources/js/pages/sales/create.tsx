import AppLayout from '@/layouts/app-layout';
import { appRoutes } from '@/lib/app-routes';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, Save, ArrowLeft, User, Users, Search } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';
import { ItemCombobox, Item } from '@/components/item-combobox';
import { MemberCombobox, Member } from '@/components/member-combobox';
import { MoneyInput } from '@/components/ui/money-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';



const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: appRoutes.dashboard(),
  },
  {
    title: 'Sales',
    href: appRoutes.sales.index(),
  },
  {
    title: 'Transaksi Baru',
    href: appRoutes.sales.create(),
  }
];

// interface Member {
//   member_code: string;
//   member_name: string;
//   phone_number: string;
//   address: string;
//   gender: boolean; // 1 = L, 0 = P
//   birth_date: string;
// }

interface SalesItem {
  item_code: string;
  item_name: string;
  sell_price: number;
  quantity: number;
  discount_item: number;
  discount_value: number;
  total_price: number;
}

// export interface Item {
//   item_code: string;
//   item_name: string;
//   item_price: number; // dari migration, bukan sell_price
//   item_description?: string;
//   item_stock?: number;
//   item_min_stock?: number;
// }

interface CreateProps {
  initialMembers?: Member[];
}

export default function CreateSale({ initialMembers = [] }: CreateProps) {
  const [memberType, setMemberType] = useState<'member' | 'non-member'>('non-member');
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [searchMember, setSearchMember] = useState('');
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data, setData, post, processing, errors } = useForm({
    sales_date: new Date().toISOString().split('T')[0],
    sales_payment_method: 'cash' as 'cash' | 'debit' | 'qris',
    sales_discount_value: 0,
    member_code: '',
    customer_name: '',
    items: [] as SalesItem[],
    new_member: {
      member_name: '',
      phone_number: '',
      address: '',
      gender: '1' as '1' | '0',
      birth_date: new Date().toISOString().split('T')[0],
    }
  });

  // Filter members berdasarkan pencarian
  const filteredMembers = members.filter(member =>
    member.member_code.toLowerCase().includes(searchMember.toLowerCase()) ||
    member.member_name.toLowerCase().includes(searchMember.toLowerCase())
  );

  // Handle member selection
  const handleMemberSelect = (member: Member) => {
    setData({
      ...data,
      member_code: member.member_code,
      customer_name: member.member_name
    });
  };

  // Handle new member creation
  const handleCreateMember = async () => {
  try {
    const response = await axios.post(appRoutes.members.store(), data.new_member);
    
    if (response.data.success) {
      setIsMemberDialogOpen(false);
      toast.success('Member berhasil dibuat');
      
      // Jika ingin otomatis pilih member yang baru dibuat
      if (response.data.member) {
        setMemberType('member');
        setData({
          ...data,
          member_code: response.data.member.member_code,
          customer_name: response.data.member.member_name
        });
      }
      
      // Reset form
      setData('new_member', {
        member_name: '',
        phone_number: '',
        address: '',
        gender: '1',
        birth_date: new Date().toISOString().split('T')[0],
      });
    } else {
      toast.error(response.data.message || 'Gagal membuat member');
    }
    
  } catch (error: any) {
    console.error('Error creating member:', error);
    
    if (error.response?.data?.errors) {
      // Tampilkan error validasi
      const errorMessages = Object.values(error.response.data.errors).flat();
      toast.error(errorMessages.join(', '));
    } else {
      toast.error('Gagal membuat member');
    }
  }
};

  // Sales item functions
  const addItemRow = () => {
    setData('items', [
      ...data.items,
      { 
        item_code: '', 
        item_name: '', 
        sell_price: 0, 
        quantity: 1, 
        discount_item: 0,
        discount_value: 0,
        total_price: 0
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    const newItems = [...data.items];
    newItems.splice(index, 1);
    setData('items', newItems);
  };

  const updateItemRow = (index: number, field: keyof SalesItem, value: any) => {
    const newItems = [...data.items];
    const item = { ...newItems[index], [field]: value };
    
    // Recalculate discount value and total price
    if (field === 'sell_price' || field === 'quantity' || field === 'discount_item') {
      item.discount_value = (item.sell_price * (item.discount_item / 100)) * item.quantity;
      item.total_price = (item.sell_price - (item.sell_price * (item.discount_item / 100))) * item.quantity;
    }
    
    newItems[index] = item;
    setData('items', newItems);
  };

  const handleItemSelect = (index: number, item: Item) => {
    const newItems = [...data.items];
    newItems[index] = {
      ...newItems[index],
      item_code: item.item_code,
      item_name: item.item_name,
      sell_price: item.item_price || 0,
      discount_value: 0,
      total_price: (item.item_price || 0) * newItems[index].quantity
    };
    setData('items', newItems);
  };

  // Calculations
  const subtotal = data.items.reduce((acc, item) => acc + (item.sell_price * item.quantity), 0);
  const totalDiscount = data.items.reduce((acc, item) => acc + item.discount_value, 0);
  const discountPercentage = data.sales_discount_value || 0;
  const additionalDiscount = (subtotal - totalDiscount) * (discountPercentage / 100);
  const grandTotal = (subtotal - totalDiscount) - additionalDiscount;

 const handleSubmit: FormEventHandler = async (e) => {
    e.preventDefault();
    
    // Validasi minimal 1 item
    if (data.items.length === 0) {
      toast.error('Tambahkan minimal 1 item');
      return;
    }
    
    // Prepare data for submission
    const salesData = {
      sales_date: data.sales_date,
      sales_payment_method: data.sales_payment_method,
      sales_discount_value: data.sales_discount_value,
      sales_subtotal: subtotal,
      sales_hasil_discount_value: additionalDiscount,
      sales_grand_total: grandTotal,
      member_code: memberType === 'member' ? data.member_code : null,
      customer_name: memberType === 'member' ? data.customer_name : data.customer_name,
      items: data.items.map(item => ({
        item_code: item.item_code,
        sales_quantity: item.quantity,
        sell_price: item.sell_price,
        sales_discount_item: item.discount_item,
        sales_hasil_diskon_item: item.discount_value / item.quantity,
        total_item_price: item.total_price
      }))
    };

    try {
      setIsSubmitting(true);
      const response = await axios.post(appRoutes.sales.store(), salesData);
      
      toast.success('Transaksi berhasil disimpan');
      
      // Redirect ke halaman sales
      router.visit(appRoutes.sales.index());
      
    } catch (error: any) {
      toast.error('Gagal menyimpan transaksi');
      console.error('Error details:', error.response?.data);
      
      // Set errors jika ada
      if (error.response?.data?.errors) {
        // Atur error ke state jika diperlukan
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Transaksi Baru" />
      
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        
        {/* Header dengan Tombol Kembali */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={appRoutes.sales.index()}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Transaksi Baru</h2>
              <p className="text-sm text-muted-foreground">Input data penjualan kepada pelanggan.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
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
                      <Label>Nama Pelanggan</Label>
                      <Input
                        placeholder="Nama pelanggan non-member"
                        value={data.customer_name}
                        onChange={(e) => setData('customer_name', e.target.value)}
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
                                value={data.new_member.member_name}
                                onChange={(e) => setData('new_member', {
                                  ...data.new_member,
                                  member_name: e.target.value
                                })}
                                placeholder="Nama lengkap"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Nomor Telepon *</Label>
                                <Input
                                  value={data.new_member.phone_number}
                                  onChange={(e) => setData('new_member', {
                                    ...data.new_member,
                                    phone_number: e.target.value
                                  })}
                                  placeholder="0812-3456-7890"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Tanggal Lahir</Label>
                                <Input
                                  type="date"
                                  value={data.new_member.birth_date}
                                  onChange={(e) => setData('new_member', {
                                    ...data.new_member,
                                    birth_date: e.target.value
                                  })}
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Jenis Kelamin</Label>
                              <RadioGroup
                                value={data.new_member.gender}
                                onValueChange={(value) => setData('new_member', {
                                  ...data.new_member,
                                  gender: value as '1' | '0'
                                })}
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
                                value={data.new_member.address}
                                onChange={(e) => setData('new_member', {
                                  ...data.new_member,
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
                              onClick={() => setIsMemberDialogOpen(false)}
                            >
                              Batal
                            </Button>
                            <Button
                              type="button"
                              onClick={handleCreateMember}
                              disabled={!data.new_member.member_name || !data.new_member.phone_number}
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
                    <MemberCombobox
                      value={data.member_code}
                      onSelect={handleMemberSelect}
                      placeholder="Cari member dengan kode atau nama..."
                    />
                  </div>
                  
                  {data.member_code && (
                    <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                      <p className="font-medium">Member terpilih:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Nama:</span>
                          <p className="font-medium">{data.customer_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Kode:</span>
                          <p className="font-medium">{data.member_code}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Informasi Transaksi */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Transaksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input
                    type="date"
                    value={data.sales_date}
                    onChange={(e) => setData('sales_date', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Metode Pembayaran</Label>
                  <Select
                    value={data.sales_payment_method}
                    onValueChange={(value: 'cash' | 'debit' | 'qris') => 
                      setData('sales_payment_method', value)
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
                    min="0"
                    max="100"
                    value={data.sales_discount_value}
                    onChange={(e) => setData('sales_discount_value', parseFloat(e.target.value) || 0)}
                    placeholder="0%"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ringkasan Total */}
            <Card className="flex flex-col justify-center items-center bg-muted/50">
              <CardContent className="text-center pt-6 w-full">
                <h3 className="text-lg font-medium text-muted-foreground">Total Transaksi</h3>
                <p className="text-4xl font-bold text-primary mt-2 mb-4">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </p>
                
                <div className="text-sm text-left w-full space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Diskon Barang:</span>
                    <span>- Rp {totalDiscount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Diskon Transaksi ({discountPercentage}%):</span>
                    <span>- Rp {additionalDiscount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="border-t pt-1 mt-1 flex justify-between font-bold">
                    <span>Grand Total:</span>
                    <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daftar Barang */}
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
                    <TableHead className="w-[15%]">Harga Jual (Rp)</TableHead>
                    <TableHead className="w-[10%]">Qty</TableHead>
                    <TableHead className="w-[15%]">Diskon Item (%)</TableHead>
                    <TableHead className="w-[15%] text-right">Diskon (Rp)</TableHead>
                    <TableHead className="w-[15%] text-right">Subtotal</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Belum ada barang dipilih. Klik "Tambah Barang".
                      </TableCell>
                    </TableRow>
                  )}
                  {data.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <ItemCombobox
                          value={item.item_code}
                          onSelect={(selectedItem) => handleItemSelect(index, selectedItem)}
                          placeholder="Cari Barang..."
                        />
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
                      <TableCell className="text-right">
                        <span className="text-red-600">
                          - Rp {item.discount_value.toLocaleString('id-ID')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        Rp {item.total_price.toLocaleString('id-ID')}
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
                  ))}
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
              disabled={processing || data.items.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              Checkout
            </Button>
          </div>

        </form>
      </div>
    </AppLayout>
  );
}