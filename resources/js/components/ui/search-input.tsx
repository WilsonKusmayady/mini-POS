import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
    value?: string;
    onSearch: (value: string) => void;
    placeholder?: string;
    className?: string;
    debounce?: number; 
}

export function SearchInput({ 
    value = '', 
    onSearch, 
    placeholder = "Cari...", 
    className,
    debounce = 300 
}: SearchInputProps) {
    const [localValue, setLocalValue] = useState(value);
    const isFirstRender = useRef(true);
    
    // Simpan onSearch terbaru di ref agar tidak mentrigger useEffect
    const onSearchRef = useRef(onSearch);

    // Update ref setiap kali prop onSearch berubah (tanpa re-render logic utama)
    useEffect(() => {
        onSearchRef.current = onSearch;
    }, [onSearch]);

    // Sinkronisasi value dari URL/Props
    useEffect(() => {
        if (value !== localValue) {
            setLocalValue(value);
        }
    }, [value]); // Hapus localValue dari sini untuk cegah loop

    // Logika Debounce
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const handler = setTimeout(() => {
            // Gunakan ref untuk memanggil fungsi, jadi onSearch tidak perlu masuk dependency array
            onSearchRef.current(localValue);
        }, debounce);

        return () => {
            clearTimeout(handler);
        };
    }, [localValue, debounce]); 

    const handleClear = () => {
        setLocalValue('');
        onSearchRef.current(''); 
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