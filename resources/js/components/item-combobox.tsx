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

import { Check, ChevronsUpDown, Loader2} from 'lucide-react';
import { cn } from "@/lib/utils";
import axios from 'axios';

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
}

export function ItemCombobox({
    value,
    onSelect,
    placeholder = "Pilih Item...",
    className,
    disabled = false
}: ItemCombobox) {
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
                const res = await axios.get('/items/search', {
                params: {
                    page: pageParam,
                    q: searchParam
                }
            });

            let newItems: Item[] = [];

            if (Array.isArray(res.data?.data)) {
                newItems = res.data.data;
                setHasMore(!!res.data.next_page_url);
            }
            else if (Array.isArray(res.data)) {
                newItems = res.data;
                setHasMore(false);
            }
            else {
                newItems = [];
                setHasMore(false);
            }

            setItems(prev => reset ? newItems : [...prev, ...newItems]);
        } catch (error) {
            console.error("Gagal load item", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open) return;

        // Tambahan biar lansung memunculkan data (belum fix)
        if (search.trim() === '') { 
            setPage(1);
            fetchItems(1, '', true);
            return
        }

        const timeoutId = setTimeout(() => {
            setPage(1);
            fetchItems(1, search, true);
        }, 50); // Debounce 50ms biar tidak smooth loading nya (belum fix)
        return () => clearTimeout(timeoutId);
    }, [search, open]);

    // Infinite scroll 
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

    // Label yang ditampilkan pada tombol
    const displayLabel = items.find(i => i.item_code === value)?.item_name
    || selectedItemCache?.item_name
    || (value ? `Item ${value}` : placeholder);

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
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command shouldFilter={false}> 
                    <CommandInput 
                        placeholder="Cari kode atau nama..." 
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList onScroll={handleScroll} className="max-h-[250px] overflow-y-auto">
                        {items.length === 0 && !loading && (
                            <CommandEmpty>Item tidak ditemukan.</CommandEmpty>
                        )}
                        <CommandGroup>
                            {items.map((item) => (
                                <CommandItem
                                    key={item.item_code}
                                    value={item.item_code} 
                                    onSelect={() => {
                                        onSelect(item);
                                        setSelectedItemCache(item); 
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === item.item_code ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{item.item_name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            Stok: {item.item_stock} | Kode: {item.item_code}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
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