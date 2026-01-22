// Di file: components/sales/SalesItemsEditor.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface ItemSearchResult {
  item_code: string;
  item_name: string;
  sell_price: number;
  stock: number;
  unit: string;
}

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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ItemSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce untuk mencegah terlalu banyak render
  const updateParent = useCallback((newItems: SalesItemFormData[]) => {
    onChange(newItems);
  }, [onChange]);

  // Sync dengan parent hanya ketika value berubah dari parent
  useEffect(() => {
    console.log('SalesItemsEditor: value changed from parent', value);
    setItems(value || []);
  }, [value]);

  // Update parent hanya ketika items benar-benar berubah
  useEffect(() => {
    console.log('SalesItemsEditor: items changed', items);
    // Hanya update parent jika items berbeda dengan value sebelumnya
    if (JSON.stringify(items) !== JSON.stringify(value)) {
      updateParent(items);
    }
  }, [items, updateParent, value]);

  const handleSearchItem = async () => {
    if (!searchTerm.trim()) {
      toast.error('Masukkan kode atau nama item');
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(`/api/items/search?q=${encodeURIComponent(searchTerm)}`);
      setSearchResults(response.data.data || []);
    } catch (error: any) {
      console.error('Error searching items:', error);
      toast.error('Gagal mencari item');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddItem = (item: ItemSearchResult) => {
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
        sell_price: item.sell_price,
        sales_discount_item: 0,
        sales_hasil_diskon_item: 0,
        total_item_price: item.sell_price * 1,
        stock: item.stock,
        unit: item.unit,
      };
      
      setItems(prev => {
        const newItems = [...prev, newItem];
        console.log('Adding new item:', newItem, 'Total items:', newItems.length);
        return newItems;
      });
    }
    
    setSearchTerm('');
    setSearchResults([]);
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

  // Handle Enter key for search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchItem();
    }
  };

  return (
    <div className="space-y-4">
      {/* Item Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Label>Tambah Item</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Cari item dengan kode atau nama..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <Button 
                onClick={handleSearchItem} 
                disabled={isSearching || !searchTerm.trim()}
              >
                {isSearching ? 'Searching...' : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((item) => (
                      <TableRow key={item.item_code}>
                        <TableCell className="font-mono">{item.item_code}</TableCell>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>{item.sell_price.toLocaleString('id-ID')}</TableCell>
                        <TableCell>{item.stock}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleAddItem(item)}
                            disabled={item.stock === 0}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Daftar Item</Label>
              <span className="text-sm text-muted-foreground">
                {items.length} item
              </span>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada item. Tambahkan item terlebih dahulu.
              </div>
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Item</TableHead>
                      <TableHead className="w-32">Qty</TableHead>
                      <TableHead className="w-40">Harga</TableHead>
                      <TableHead className="w-32">Diskon</TableHead>
                      <TableHead className="w-40">Subtotal</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.item_code}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.item_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.item_code} • Stok: {item.stock} {item.unit}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuantityChange(item.item_code, item.sales_quantity - 1)}
                              disabled={item.sales_quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.sales_quantity}
                              onChange={(e) => handleQuantityChange(item.item_code, parseInt(e.target.value) || 1)}
                              className="w-16 text-center"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuantityChange(item.item_code, item.sales_quantity + 1)}
                              disabled={item.stock !== undefined && item.sales_quantity >= item.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.sell_price}
                            onChange={(e) => handlePriceChange(item.item_code, parseFloat(e.target.value) || 0)}
                            className="w-full"
                            min="0"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.sales_discount_item}
                              onChange={(e) => handleDiscountChange(item.item_code, parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                            <span className="text-sm">%</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.total_item_price.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(item.item_code)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Summary */}
            {items.length > 0 && (
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      {calculateSubtotal().toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diskon Item:</span>
                    <span className="text-red-600">
                      -{calculateTotalDiscount().toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>
                        {(calculateSubtotal() - calculateTotalDiscount()).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}