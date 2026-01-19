import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
    value?: string;
    onSearch: (value: string) => void;
    placeholder?: string;
    className?: string;
    debounce?: number; // Waktu tunda dalam ms (default 300ms)
}

export function SearchInput({ 
    value = '', 
    onSearch, 
    placeholder = "Cari...", 
    className,
    debounce = 300 
}: SearchInputProps) {
    // State lokal untuk handle input user secara instan
    const [localValue, setLocalValue] = useState(value);
    const isFirstRender = useRef(true);

    // Sinkronisasi jika value dari props berubah (misal dari URL)
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Logika Debounce
    useEffect(() => {
        // Hindari trigger saat pertama kali render
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const handler = setTimeout(() => {
            // Panggil fungsi pencarian parent hanya jika value berubah
            onSearch(localValue);
        }, debounce);

        return () => {
            clearTimeout(handler);
        };
    }, [localValue, debounce, onSearch]);

    const handleClear = () => {
        setLocalValue('');
        onSearch(''); // Langsung trigger search kosong
    };

    return (
        <div className={cn("relative w-full md:w-64", className)}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                placeholder={placeholder}
                className="pl-9 pr-8"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
            />
            {localValue && (
                <button 
                    onClick={handleClear} 
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}