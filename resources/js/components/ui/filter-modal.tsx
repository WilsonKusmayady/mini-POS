// components/filters/filter-modal.tsx
import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Filter, CalendarIcon, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

export type FilterType = 
    | 'select'
    | 'radio'
    | 'date'
    | 'date-range'
    | 'text'
    | 'number';

export interface FilterOption {
    value: string;
    label: string;
}

export interface FilterField {
    key: string;
    label: string;
    type: FilterType;
    placeholder?: string;
    options?: FilterOption[];
    defaultValue?: string;
    min?: number;
    max?: number;
    step?: number;
}

export interface FilterSchema {
    fields: FilterField[];
    title?: string;
    description?: string;
}

export interface FilterParams {
    [key: string]: string | number | Date | null | undefined;
}

interface FilterModalProps {
    // Trigger props
    triggerText?: string;
    triggerVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    triggerSize?: 'default' | 'sm' | 'lg' | 'icon';
    triggerIcon?: React.ReactNode;
    triggerClassName?: string;
    
    // Modal props
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    
    // Filter props
    schema: FilterSchema;
    initialFilters?: FilterParams;
    onFilterChange?: (filters: FilterParams) => void;
    
    // Customization
    showActiveFilters?: boolean;
    showResetButton?: boolean;
}

export function FilterModal({
    triggerText = 'Filter',
    triggerVariant = 'outline',
    triggerSize = 'default',
    triggerIcon = <Filter className="h-4 w-4" />,
    triggerClassName,
    open,
    onOpenChange,
    schema,
    initialFilters = {},
    onFilterChange,
    showActiveFilters = true,
    showResetButton = true,
}: FilterModalProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [filters, setFilters] = React.useState<FilterParams>(initialFilters);
    const [tempFilters, setTempFilters] = React.useState<FilterParams>(initialFilters);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (onOpenChange) {
            onOpenChange(open);
        }
        // Reset temp filters ketika modal dibuka
        if (open) {
            setTempFilters(filters);
        }
    };

    const currentOpen = open !== undefined ? open : isOpen;

    const handleTempFilterChange = (key: string, value: any) => {
        setTempFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        const newFilters = { ...tempFilters };
        
        // Hapus filter dengan value undefined atau string kosong
        Object.keys(newFilters).forEach(key => {
            if (newFilters[key] === undefined || newFilters[key] === '' || newFilters[key] === null) {
                delete newFilters[key];
            }
        });
        
        setFilters(newFilters);
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
        setIsOpen(false);
    };

    const handleResetFilters = () => {
        const resetFilters: FilterParams = {};
        schema.fields.forEach(field => {
            resetFilters[field.key] = field.defaultValue || '';
        });
        
        setFilters(resetFilters);
        setTempFilters(resetFilters);
        if (onFilterChange) {
            onFilterChange(resetFilters);
        }
        setIsOpen(false);
    };

    const handleResetTempFilters = () => {
        const resetFilters: FilterParams = {};
        schema.fields.forEach(field => {
            resetFilters[field.key] = field.defaultValue || '';
        });
        setTempFilters(resetFilters);
    };

    const FieldWrapper = ({ children }: { children: React.ReactNode }) => (
        <div className="space-y-1.5">{children}</div>
    );


    const getActiveFilterCount = () => {
        return Object.keys(filters).filter(key => 
            filters[key] !== undefined && 
            filters[key] !== null && 
            filters[key] !== '' &&
            filters[key] !== (schema.fields.find(f => f.key === key)?.defaultValue || '')
        ).length;
    };

    const renderFilterField = (field: FilterField) => {
        const value = tempFilters[field.key] || field.defaultValue || '';

        switch (field.type) {
            case 'select':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={field.key}>{field.label}</Label>
                        <Select
                            value={value as string}
                            onValueChange={(val) => handleTempFilterChange(field.key, val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={field.placeholder || `Pilih ${field.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );

            case 'radio':
                return (
                    <FieldWrapper>
                        <Label>{field.label}</Label>
                        <RadioGroup
                            value={value as string}
                            onValueChange={(val) => handleTempFilterChange(field.key, val)}
                            className="space-y-2"
                        >
                            {field.options?.map((option) => (
                                <label
                                    key={option.value}
                                    htmlFor={`${field.key}-${option.value}`}
                                    className="flex items-center gap-2 text-sm font-normal"
                                >
                                    <RadioGroupItem
                                        value={option.value}
                                        id={`${field.key}-${option.value}`}
                                    />
                                    {option.label}
                                </label>
                            ))}
                        </RadioGroup>
                    </FieldWrapper>
                );

            case 'date':
                return (
                    <FieldWrapper>
                        <Label htmlFor={field.key}>{field.label}</Label>
                        <Input
                            id={field.key}
                            type="date"
                            value={value as string || ''}
                            onChange={(e) => handleTempFilterChange(field.key, e.target.value)}
                        />
                    </FieldWrapper>
                );

            case 'date-range':
                return (
                    <div className="space-y-2">
                        <Label>{field.label}</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">
                                    Dari Tanggal
                                </Label>
                                <Input
                                    type="date"
                                    value={tempFilters[`${field.key}_start`] as string || ''}
                                    onChange={(e) =>
                                        handleTempFilterChange(`${field.key}_start`, e.target.value)
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">
                                    Sampai Tanggal
                                </Label>
                                <Input
                                    type="date"
                                    value={tempFilters[`${field.key}_end`] as string || ''}
                                    onChange={(e) =>
                                        handleTempFilterChange(`${field.key}_end`, e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    </div>
                );


            case 'text':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={field.key}>{field.label}</Label>
                        <Input
                            id={field.key}
                            type="text"
                            value={value as string || ''}
                            onChange={(e) => handleTempFilterChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                        />
                    </div>
                );

            case 'number':
                return (
                    <div className="space-y-2">
                        <Label htmlFor={field.key}>{field.label}</Label>
                        <Input
                            id={field.key}
                            type="number"
                            value={value as string || ''}
                            onChange={(e) => handleTempFilterChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    const getFilterDisplayValue = (key: string, value: any): string => {
        const field = schema.fields.find(f => f.key === key);
        if (!field) return String(value);

        if (field.type === 'select' || field.type === 'radio') {
            const option = field.options?.find(opt => opt.value === value);
            return option?.label || String(value);
        }

        if (key.endsWith('_start') || key.endsWith('_end')) {
            // Format tanggal
            if (value) {
                const date = new Date(value);
                return date.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            }
        }

        return String(value);
    };

    return (
        <>
            <Dialog open={currentOpen} onOpenChange={handleOpenChange}>
                {triggerText && (
                    <DialogTrigger asChild>
                        <Button
                            variant={triggerVariant}
                            size={triggerSize}
                            className={cn("flex items-center gap-2", triggerClassName)}
                        >
                            {triggerIcon}
                            {triggerText}
                            {getActiveFilterCount() > 0 && (
                                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                                    {getActiveFilterCount()}
                                </Badge>
                            )}
                        </Button>
                    </DialogTrigger>
                )}
                
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg">
                            {schema.title || 'Filter Data'}
                        </DialogTitle>
                        {schema.description && (
                            <DialogDescription>
                                {schema.description}
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {schema.fields.map((field, index) => (
                            <React.Fragment key={field.key}>
                                {renderFilterField(field)}
                                {index < schema.fields.length - 1 && <Separator />}
                            </React.Fragment>
                        ))}

                        {/* Active Filters Summary */}
                        {showActiveFilters && Object.keys(filters).length > 0 && (
                            <Card>
                                <CardContent className="pt-4">
                                    <h4 className="text-sm font-medium mb-2">Filter Aktif:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(filters)
                                            .filter(([key, value]) => 
                                                value !== undefined && 
                                                value !== null && 
                                                value !== '' &&
                                                value !== (schema.fields.find(f => f.key === key)?.defaultValue || '')
                                            )
                                            .map(([key, value]) => {
                                                const field = schema.fields.find(f => 
                                                    f.key === key || 
                                                    (f.type === 'date-range' && (key === `${f.key}_start` || key === `${f.key}_end`))
                                                );
                                                
                                                if (!field) return null;

                                                let displayKey = field.label;
                                                if (key.endsWith('_start')) {
                                                    displayKey = `${field.label} (Dari)`;
                                                } else if (key.endsWith('_end')) {
                                                    displayKey = `${field.label} (Sampai)`;
                                                }

                                                return (
                                                    <Badge key={key} variant="secondary" className="gap-1">
                                                        {displayKey}: {getFilterDisplayValue(key, value)}
                                                        <button 
                                                            onClick={() => {
                                                                const newFilters = { ...tempFilters };
                                                                delete newFilters[key];
                                                                setTempFilters(newFilters);
                                                            }}
                                                            className="hover:bg-gray-200 rounded-full p-0.5"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                );
                                            })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    
                    <DialogFooter className="gap-2">
                        {showResetButton && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleResetTempFilters}
                                className="flex-1"
                            >
                                Reset Filter
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            className="flex-1"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleApplyFilters}
                            className="flex-1"
                        >
                            Terapkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}