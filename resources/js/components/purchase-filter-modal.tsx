import * as React from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Filter, X } from 'lucide-react';

export interface PurchaseFilterParams {
    search?: string;
    supplierId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    minTotal?: string;
    maxTotal?: string;
}

interface PurchaseFilterModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    suppliers: Array<{ supplier_id: number; supplier_name: string }>;
    users: Array<{ user_id: number; user_name: string }>; // Sesuaikan dengan kolom user
    initialFilters: PurchaseFilterParams;
    onApply: (filters: PurchaseFilterParams) => void;
    onReset: () => void;
}

export function PurchaseFilterModal({
    open,
    onOpenChange,
    suppliers,
    users,
    initialFilters,
    onApply,
    onReset
}: PurchaseFilterModalProps) {
    const [filters, setFilters] = React.useState<PurchaseFilterParams>(initialFilters);

    // Sync filters ketika modal dibuka
    React.useEffect(() => {
        setFilters(initialFilters);
    }, [initialFilters, open]);

    const handleApply = () => {
        onApply(filters);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" /> Filter Pembelian
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Dari Tanggal</Label>
                            <Input 
                                type="date" 
                                value={filters.startDate || ''}
                                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sampai Tanggal</Label>
                            <Input 
                                type="date" 
                                value={filters.endDate || ''}
                                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Supplier */}
                    <div className="space-y-2">
                        <Label>Supplier</Label>
                        <Select 
                            value={filters.supplierId?.toString() || 'all'} 
                            onValueChange={(val) => setFilters({...filters, supplierId: val === 'all' ? undefined : val})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Semua Supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Supplier</SelectItem>
                                {suppliers.map(s => (
                                    <SelectItem key={s.supplier_id} value={s.supplier_id.toString()}>
                                        {s.supplier_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Operator / User */}
                    <div className="space-y-2">
                        <Label>Operator (User)</Label>
                        <Select 
                            value={filters.userId?.toString() || 'all'} 
                            onValueChange={(val) => setFilters({...filters, userId: val === 'all' ? undefined : val})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Semua Operator" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Operator</SelectItem>
                                {users.map(u => (
                                    <SelectItem key={u.user_id} value={u.user_id.toString()}>
                                        {u.user_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Total Price Range */}
                    <div className="space-y-2">
                        <Label>Range Total Harga (Rp)</Label>
                        <div className="flex items-center gap-2">
                            <Input 
                                type="number" 
                                placeholder="Min" 
                                value={filters.minTotal || ''}
                                onChange={(e) => setFilters({...filters, minTotal: e.target.value})}
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input 
                                type="number" 
                                placeholder="Max" 
                                value={filters.maxTotal || ''}
                                onChange={(e) => setFilters({...filters, maxTotal: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between gap-2">
                    <Button variant="ghost" type="button" onClick={onReset} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        Reset Filter
                    </Button>
                    <Button type="button" onClick={handleApply}>
                        Terapkan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}