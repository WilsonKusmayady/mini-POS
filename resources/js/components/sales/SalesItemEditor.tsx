// Di file: components/sales/SalesItemsEditor.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ItemCombobox, Item } from '@/components/item-combobox';
import { Badge } from '@/components/ui/badge';

interface SalesItemFormData {
  item_code: string;
  item_name?: string;
  sales_quantity: number;
  sell_price: number;
  sales_discount_item: number;
  sales_hasil_diskon_item: number;
  total_item_price: number;
  stock?: number;
  unit?: string;
}

interface SalesItemsEditorProps {
  value: SalesItemFormData[];
  onChange: (items: SalesItemFormData[]) => void;
}

export function SalesItemsEditor({ value, onChange }: SalesItemsEditorProps) {
  const [items, setItems] = useState<SalesItemFormData[]>(value || []);
  const [isLoading, setIsLoading] = useState(false);

  // Sync dengan parent hanya ketika value berubah dari parent
  useEffect(() => {
    const fetchMissingStock = async () => {
        const updatedItems = await Promise.all(
        items.map(async (item) => {
            if (item.stock !== undefined) return item;

            try {
            const res = await fetch(`/api/items/${item.item_code}/info`);
            const json = await res.json();

            if (json.success) {
                return {
                ...item,
                stock: json.data.stock,
                unit: json.data.unit,
                sell_price: item.sell_price || json.data.sell_price,
                };
            }
            } catch (e) {
            console.error('Gagal ambil stok item', item.item_code);
            }

            return item;
        })
        );

        setItems(updatedItems);
    };

    if (items.some(i => i.stock === undefined)) {
        fetchMissingStock();
    }
    }, [items]);

  // Update parent hanya ketika items benar-benar berubah
  useEffect(() => {
    console.log('SalesItemsEditor: items changed', items);
    // Hanya update parent jika items berbeda dengan value sebelumnya
    if (JSON.stringify(items) !== JSON.stringify(value)) {
      onChange(items);
    }
  }, [items, onChange, value]);

  const handleAddItem = (item: Item) => {
    // Check if item already exists
    const existingItem = items.find(i => i.item_code === item.item_code);
    
    if (existingItem) {
      // Increase quantity if item exists
      handleQuantityChange(item.item_code, existingItem.sales_quantity + 1);
    } else {
      // Add new item
      const newItem: SalesItemFormData = {
        item_code: item.item_code,
        item_name: item.item_name,
        sales_quantity: 1,
        sell_price: item.item_price,
        sales_discount_item: 0,
        sales_hasil_diskon_item: 0,
        total_item_price: item.item_price * 1,
        stock: item.item_stock,
        unit: 'pcs',
      };
      
      setItems(prev => {
        const newItems = [...prev, newItem];
        console.log('Adding new item:', newItem, 'Total items:', newItems.length);
        return newItems;
      });
    }
  };

  const handleRemoveItem = useCallback((itemCode: string) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.item_code !== itemCode);
      console.log('Removing item:', itemCode, 'Remaining items:', newItems.length);
      return newItems;
    });
  }, []);

  const handleQuantityChange = useCallback((itemCode: string, quantity: number) => {
    if (quantity < 1) {
      handleRemoveItem(itemCode);
      return;
    }

    setItems(prev => prev.map(item => {
      if (item.item_code === itemCode) {
        // Check stock if available
        if (quantity > (item.stock || 0)) {
          toast.error(`Stok tidak cukup. Stok tersedia: ${item.stock}`);
          return item;
        }
        
        const totalPrice = item.sell_price * quantity;
        const itemDiscount = (item.sales_discount_item / 100) * totalPrice;
        const finalTotal = totalPrice - itemDiscount;
        
        return {
          ...item,
          sales_quantity: quantity,
          total_item_price: finalTotal,
          sales_hasil_diskon_item: itemDiscount,
        };
      }
      return item;
    }));
  }, [handleRemoveItem]);

  const handlePriceChange = useCallback((itemCode: string, price: number) => {
    setItems(prev => prev.map(item => {
      if (item.item_code === itemCode) {
        const totalPrice = price * item.sales_quantity;
        const itemDiscount = (item.sales_discount_item / 100) * totalPrice;
        const finalTotal = totalPrice - itemDiscount;
        
        return {
          ...item,
          sell_price: price,
          total_item_price: finalTotal,
          sales_hasil_diskon_item: itemDiscount,
        };
      }
      return item;
    }));
  }, []);

  const handleDiscountChange = useCallback((itemCode: string, discount: number) => {
    setItems(prev => prev.map(item => {
      if (item.item_code === itemCode) {
        const totalPrice = item.sell_price * item.sales_quantity;
        const itemDiscount = (discount / 100) * totalPrice;
        const finalTotal = totalPrice - itemDiscount;
        
        return {
          ...item,
          sales_discount_item: discount,
          sales_hasil_diskon_item: itemDiscount,
          total_item_price: finalTotal,
        };
      }
      return item;
    }));
  }, []);

  const calculateSubtotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.total_item_price, 0);
  }, [items]);

  const calculateTotalDiscount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.sales_hasil_diskon_item, 0);
  }, [items]);

  // Dapatkan daftar item_code yang sudah dipilih untuk disabled items
  const getDisabledItems = () => {
    return items.map(item => item.item_code);
  };

  return (
    <div className="space-y-6">
      {/* Item Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Tambah Item</Label>
              <span className="text-sm text-muted-foreground">
                {items.length} item
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <ItemCombobox
                    onSelect={handleAddItem}
                    placeholder="Pilih item..."
                    disabled={isLoading}
                    disabledItems={getDisabledItems()}
                  />
                </div>
                <Button 
                  onClick={() => {
                    // Untuk manual add, bisa tambahkan tombol atau biarkan hanya combobox
                  }}
                  disabled={true}
                  variant="outline"
                  className="opacity-50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                • Pilih item dari dropdown untuk menambahkannya ke daftar
                • Item yang sudah dipilih tidak akan muncul lagi di dropdown
                • Item dengan stok habis akan ditandai
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      {items.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Daftar Item</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Total: {calculateSubtotal().toLocaleString('id-ID')}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Diskon: -{calculateTotalDiscount().toLocaleString('id-ID')}
                  </Badge>
                </div>
              </div>

              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Item</TableHead>
                      <TableHead className="w-24">Qty</TableHead>
                      <TableHead className="w-32">Harga</TableHead>
                      <TableHead className="w-24">Diskon</TableHead>
                      <TableHead className="w-32">Subtotal</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.item_code}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.item_name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <span>Kode: {item.item_code}</span>
                              <span className="text-red-600">•</span>
                              <span>Stok: {item.stock}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min="1"
                              value={item.sales_quantity}
                              onChange={(e) => handleQuantityChange(item.item_code, parseInt(e.target.value) || 1)}
                              className="w-16 text-center h-8"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                              Rp
                            </span>
                            <Input
                              type="number"
                              value={item.sell_price}
                              onChange={(e) => handlePriceChange(item.item_code, parseFloat(e.target.value) || 0)}
                              className="w-full pl-10"
                              min="0"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={item.sales_discount_item}
                              onChange={(e) => handleDiscountChange(item.item_code, parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                            <span className="text-sm">%</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{item.total_item_price.toLocaleString('id-ID')}</span>
                            {item.sales_discount_item > 0 && (
                              <span className="text-xs text-red-600">
                                -{item.sales_hasil_diskon_item.toLocaleString('id-ID')}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(item.item_code)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="flex justify-end">
                <div className="w-80 space-y-3 bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium text-lg">
                      {calculateSubtotal().toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Diskon Item:</span>
                    <span className="text-red-600 font-medium">
                      -{calculateTotalDiscount().toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-primary">
                        {(calculateSubtotal() - calculateTotalDiscount()).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Belum ada item</h3>
              <p className="text-muted-foreground mb-6">
                Pilih item dari dropdown di atas untuk menambahkannya ke transaksi
              </p>
              <div className="inline-flex items-center justify-center px-4 py-2 border border-dashed rounded-lg text-sm text-muted-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Tambah item pertama
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Tambahkan import untuk Badge jika belum ada
