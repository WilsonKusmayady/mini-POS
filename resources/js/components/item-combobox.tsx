import { useState, useEffect } from "react";
import { Button } from "./ui/button";
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
import { Check, ChevronsUpDown, Loader2, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import axios from 'axios';
import { Badge } from "@/components/ui/badge";

export interface Item {
    item_code: string;
    item_name: string;
    item_stock: number;
    item_price: number;
}

interface ItemCombobox {
    value?: string;
    onSelect: (item: Item) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    disabledItems?: string[]; 
    
    // ✅ Tambahkan Props Baru Ini
    allowOutOfStock?: boolean; 
}

export function ItemCombobox({
    value,
    onSelect,
    placeholder = "Pilih Item...",
    className,
    disabled = false,
    disabledItems = [],
    
    // ✅ Default false (artinya perilaku default seperti Sales: Stok habis = Disabled)
    allowOutOfStock = false 
}: ItemCombobox) {
    // ... (State dan useEffect fetchItems biarkan sama seperti sebelumnya) ...
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedItemCache, setSelectedItemCache] = useState<Item | null>(null);

    // ... (fetchItems logic sama) ...
    const fetchItems = async (pageParam: number, searchParam: string, reset = false) => {
         // Copy paste logic fetchItems yang lama di sini
         // ...
         try {
            setLoading(true);
            const res = await axios.get('/items/search', {
                params: { page: pageParam, q: searchParam }
            });
            // ... dst
            let newItems: Item[] = [];
            if (Array.isArray(res.data?.data)) {
                newItems = res.data.data;
                setHasMore(!!res.data.next_page_url);
            } else if (Array.isArray(res.data)) {
                newItems = res.data;
                setHasMore(false);
            } else {
                newItems = [];
                setHasMore(false);
            }
            setItems(prev => reset ? newItems : [...prev, ...newItems]);
            setLoading(false);
        } catch (error) {
            console.error("Gagal load item", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        // ... (useEffect sama)
        if (!open) return;
        if (search.trim() === '') { 
            setPage(1);
            fetchItems(1, '', true);
            return
        }
        const timeoutId = setTimeout(() => {
            setPage(1);
            fetchItems(1, search, true);
        }, 50); 
        return () => clearTimeout(timeoutId);
    }, [search, open]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        // ... (handleScroll sama)
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            if (!loading && hasMore) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchItems(nextPage, search, false);
            }
        }
    };

    // Label logic ...
    const displayLabel = items.find(i => i.item_code === value)?.item_name
    || selectedItemCache?.item_name
    || (value ? `Item ${value}` : placeholder);

    // ✅ LOGIC UTAMA DISINI
    const isItemDisabled = (item: Item): boolean => {
        // 1. Cek stok: Jika allowOutOfStock TRUE, maka abaikan stok 0
        if (!allowOutOfStock && item.item_stock <= 0) return true;
        
        // 2. Cek duplikasi item di row lain
        if (disabledItems.includes(item.item_code) && item.item_code !== value) return true;
        
        return false;
    };

    const getStockStatus = (item: Item) => {
        // ... (Logic stock status biarkan sama untuk visual)
        if (item.item_stock <= 0) {
            return { text: "Stok Habis", variant: "destructive" as const };
        } else if (item.item_stock < 10) {
            return { text: `Stok: ${item.item_stock}`, variant: "destructive" as const };
        } else if (item.item_stock < 20) {
            return { text: `Stok: ${item.item_stock}`, variant: "default" as const };
        } else {
            return { text: `Stok: ${item.item_stock}`, variant: "secondary" as const };
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn("w-full justify-between font-normal text-left", className)}
                >
                    <span className="truncate">{displayLabel}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0" align="start">
                <Command shouldFilter={false}> 
                    <CommandInput 
                        placeholder="Cari kode atau nama..." 
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList onScroll={handleScroll} className="max-h-[300px] overflow-y-auto">
                        {items.length === 0 && !loading && (
                            <CommandEmpty>Item tidak ditemukan.</CommandEmpty>
                        )}
                        <CommandGroup>
                            {items.map((item) => {
                                const itemDisabled = isItemDisabled(item);
                                const stockStatus = getStockStatus(item);
                                
                                return (
                                    <CommandItem
                                        key={item.item_code}
                                        value={item.item_code} 
                                        onSelect={() => {
                                            if (!itemDisabled) {
                                                onSelect(item);
                                                setSelectedItemCache(item); 
                                                setOpen(false);
                                            }
                                        }}
                                        disabled={itemDisabled}
                                        className={cn(
                                            "relative",
                                            itemDisabled && "opacity-60 cursor-not-allowed"
                                        )}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === item.item_code ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="font-medium">{item.item_name}</span>
                                                    <span className="text-xs text-muted-foreground block">
                                                        Kode: {item.item_code}
                                                    </span>
                                                </div>
                                                <Badge 
                                                    variant={stockStatus.variant} 
                                                    className="text-xs ml-2"
                                                >
                                                    {stockStatus.text}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-sm text-primary font-medium">
                                                    Rp {Number(item.item_price).toLocaleString('id-ID', { maximumFractionDigits: 0 })}                                                </span>
                                                {/* Logic UI Warning */}
                                                {itemDisabled && item.item_code !== value && (
                                                    <span className="text-xs text-muted-foreground flex items-center">
                                                        <AlertCircle className="h-3 w-3 mr-1" />
                                                        {/* Tampilkan pesan yang sesuai */}
                                                        {(!allowOutOfStock && item.item_stock <= 0) ? "Stok habis" : "Sudah dipilih"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </CommandItem>
                                );
                            })}
                            {loading && (
                                <div className="p-2 flex justify-center items-center text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2"/> Memuat...
                                </div>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}