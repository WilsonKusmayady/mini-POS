// import * as React from 'react';
// import {
//     Dialog,
//     DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
// import { Card, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Calendar } from '@/components/ui/calendar';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { Label } from '@/components/ui/label';
// import { cn } from '@/lib/utils';
// import { format } from 'date-fns';
// import { id } from 'date-fns/locale';
// import { Search, Filter, CalendarIcon, X } from 'lucide-react';

// export interface FilterParams {
//     search?: string;
//     gender?: string;
//     startDate?: Date;
//     endDate?: Date;
// }

// interface FilterModalProps {
//     // Trigger props
//     triggerText?: string;
//     triggerVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
//     triggerSize?: 'default' | 'sm' | 'lg' | 'icon';
//     triggerIcon?: React.ReactNode;
//     triggerClassName?: string;
    
//     // Modal props
//     open?: boolean;
//     onOpenChange?: (open: boolean) => void;
    
//     // Filter props
//     initialFilters?: FilterParams;
//     onFilterChange?: (filters: FilterParams) => void;
    
//     // Customization
//     title?: string;
//     showSearch?: boolean;
//     showGender?: boolean;
//     showDateRange?: boolean;
//     genderOptions?: Array<{ value: string; label: string }>;
// }

// export function FilterModal({
//     triggerText = 'Filter',
//     triggerVariant = 'outline',
//     triggerSize = 'default',
//     triggerIcon = <Filter className="h-4 w-4" />,
//     triggerClassName,
//     open,
//     onOpenChange,
//     initialFilters = {},
//     onFilterChange,
//     title = 'Filter Data',
//     showSearch = true,
//     showGender = true,
//     showDateRange = true,
//     genderOptions = [
//         { value: 'all', label: 'Semua Gender' },
//         { value: '1', label: 'Laki-laki' },
//         { value: '0', label: 'Perempuan' },
//     ],
// }: FilterModalProps) {
//     const [isOpen, setIsOpen] = React.useState(false);
//     const [filters, setFilters] = React.useState<FilterParams>(initialFilters);

//     const handleOpenChange = (open: boolean) => {
//         setIsOpen(open);
//         if (onOpenChange) {
//             onOpenChange(open);
//         }
//     };

//     const currentOpen = open !== undefined ? open : isOpen;

//     const handleFilterChange = (key: keyof FilterParams, value: any) => {
//         const newFilters = { ...filters, [key]: value };
//         setFilters(newFilters);
//     };

//     const handleApplyFilters = () => {
//         if (onFilterChange) {
//             onFilterChange(filters);
//         }
//         setIsOpen(false);
//     };

//     const handleResetFilters = () => {
//         const resetFilters: FilterParams = {};
//         setFilters(resetFilters);
//         if (onFilterChange) {
//             onFilterChange(resetFilters);
//         }
//         setIsOpen(false);
//     };

//     const formatDateDisplay = (date?: Date) => {
//         return date ? format(date, 'dd MMM yyyy', { locale: id }) : '';
//     };

//     return (
//         <Dialog open={currentOpen} onOpenChange={handleOpenChange}>
//             {triggerText && (
//                 <DialogTrigger asChild>
//                     <Button
//                         variant={triggerVariant}
//                         size={triggerSize}
//                         className={cn("flex items-center gap-2", triggerClassName)}
//                     >
//                         {triggerIcon}
//                         {triggerText}
//                     </Button>
//                 </DialogTrigger>
//             )}
            
//             <DialogContent className="max-w-md">
//                 <DialogHeader>
//                     <DialogTitle className="text-xl font-bold flex items-center gap-2">
//                         <Filter className="h-5 w-5" />
//                         {title}
//                     </DialogTitle>
//                 </DialogHeader>

//                 <div className="space-y-6 py-4">
//                     {/* Search Input */}
//                     {showSearch && (
//                         <div className="space-y-2">
//                             <Label htmlFor="search">Cari Nama</Label>
//                             <div className="relative">
//                                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                                 <Input
//                                     id="search"
//                                     placeholder="Cari nama..."
//                                     className="pl-9"
//                                     value={filters.search || ''}
//                                     onChange={(e) => handleFilterChange('search', e.target.value)}
//                                 />
//                                 {filters.search && (
//                                     <Button
//                                         type="button"
//                                         variant="ghost"
//                                         size="sm"
//                                         className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
//                                         onClick={() => handleFilterChange('search', '')}
//                                     >
//                                         <X className="h-3 w-3" />
//                                     </Button>
//                                 )}
//                             </div>
//                         </div>
//                     )}

//                     {/* Gender Filter */}
//                     {showGender && (
//                         <div className="space-y-2">
//                             <Label htmlFor="gender">Gender</Label>
//                             <Select
//                                 value={filters.gender || 'all'}
//                                 onValueChange={(value) => handleFilterChange('gender', value === 'all' ? undefined : value)}
//                             >
//                                 <SelectTrigger>
//                                     <SelectValue placeholder="Pilih Gender" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     {genderOptions.map((option) => (
//                                         <SelectItem key={option.value} value={option.value}>
//                                             {option.label}
//                                         </SelectItem>
//                                     ))}
//                                 </SelectContent>
//                             </Select>
//                         </div>
//                     )}

//                     {/* Date Range Filter */}
//                     {showDateRange && (
//                         <div className="space-y-4">
//                             <Label>Rentang Tanggal</Label>
//                             <div className="grid grid-cols-2 gap-3">
//                                 {/* Start Date */}
//                                 <div className="space-y-2">
//                                     <Label htmlFor="start-date" className="text-sm">
//                                         Dari Tanggal
//                                     </Label>
//                                     <Popover>
//                                         <PopoverTrigger asChild>
//                                             <Button
//                                                 variant="outline"
//                                                 className={cn(
//                                                     "w-full justify-start text-left font-normal",
//                                                     !filters.startDate && "text-muted-foreground"
//                                                 )}
//                                             >
//                                                 <CalendarIcon className="mr-2 h-4 w-4" />
//                                                 {filters.startDate ? (
//                                                     formatDateDisplay(filters.startDate)
//                                                 ) : (
//                                                     <span>Pilih tanggal</span>
//                                                 )}
//                                             </Button>
//                                         </PopoverTrigger>
//                                         <PopoverContent className="w-auto p-0">
//                                             <Calendar
//                                                 mode="single"
//                                                 selected={filters.startDate}
//                                                 onSelect={(date) => handleFilterChange('startDate', date)}
//                                                 initialFocus
//                                             />
//                                         </PopoverContent>
//                                     </Popover>
//                                     {filters.startDate && (
//                                         <Button
//                                             type="button"
//                                             variant="ghost"
//                                             size="sm"
//                                             className="h-7 px-2 text-xs"
//                                             onClick={() => handleFilterChange('startDate', undefined)}
//                                         >
//                                             <X className="mr-1 h-3 w-3" />
//                                             Hapus
//                                         </Button>
//                                     )}
//                                 </div>

//                                 {/* End Date */}
//                                 <div className="space-y-2">
//                                     <Label htmlFor="end-date" className="text-sm">
//                                         Sampai Tanggal
//                                     </Label>
//                                     <Popover>
//                                         <PopoverTrigger asChild>
//                                             <Button
//                                                 variant="outline"
//                                                 className={cn(
//                                                     "w-full justify-start text-left font-normal",
//                                                     !filters.endDate && "text-muted-foreground"
//                                                 )}
//                                             >
//                                                 <CalendarIcon className="mr-2 h-4 w-4" />
//                                                 {filters.endDate ? (
//                                                     formatDateDisplay(filters.endDate)
//                                                 ) : (
//                                                     <span>Pilih tanggal</span>
//                                                 )}
//                                             </Button>
//                                         </PopoverTrigger>
//                                         <PopoverContent className="w-auto p-0">
//                                             <Calendar
//                                                 mode="single"
//                                                 selected={filters.endDate}
//                                                 onSelect={(date) => handleFilterChange('endDate', date)}
//                                                 initialFocus
//                                                 disabled={(date) => 
//                                                     filters.startDate ? date < filters.startDate : false
//                                                 }
//                                             />
//                                         </PopoverContent>
//                                     </Popover>
//                                     {filters.endDate && (
//                                         <Button
//                                             type="button"
//                                             variant="ghost"
//                                             size="sm"
//                                             className="h-7 px-2 text-xs"
//                                             onClick={() => handleFilterChange('endDate', undefined)}
//                                         >
//                                             <X className="mr-1 h-3 w-3" />
//                                             Hapus
//                                         </Button>
//                                     )}
//                                 </div>
//                             </div>
//                         </div>
//                     )}

//                     {/* Active Filters Summary */}
//                     {(filters.search || filters.gender || filters.startDate || filters.endDate) && (
//                         <Card>
//                             <CardContent className="pt-4">
//                                 <h4 className="text-sm font-medium mb-2">Filter Aktif:</h4>
//                                 <div className="flex flex-wrap gap-2">
//                                     {filters.search && (
//                                         <Badge variant="secondary" className="text-xs">
//                                             Nama: {filters.search}
//                                         </Badge>
//                                     )}
//                                     {filters.gender && (
//                                         <Badge variant="secondary" className="text-xs">
//                                             Gender: {genderOptions.find(g => g.value === filters.gender)?.label}
//                                         </Badge>
//                                     )}
//                                     {filters.startDate && (
//                                         <Badge variant="secondary" className="text-xs">
//                                             Dari: {formatDateDisplay(filters.startDate)}
//                                         </Badge>
//                                     )}
//                                     {filters.endDate && (
//                                         <Badge variant="secondary" className="text-xs">
//                                             Sampai: {formatDateDisplay(filters.endDate)}
//                                         </Badge>
//                                     )}
//                                 </div>
//                             </CardContent>
//                         </Card>
//                     )}
//                 </div>

//                 <DialogFooter className="flex justify-between gap-2">
//                     <Button
//                         type="button"
//                         variant="outline"
//                         onClick={handleResetFilters}
//                         className="flex-1"
//                     >
//                         Reset Filter
//                     </Button>
//                     <Button
//                         type="button"
//                         onClick={handleApplyFilters}
//                         className="flex-1"
//                     >
//                         Terapkan Filter
//                     </Button>
//                 </DialogFooter>
//             </DialogContent>
//         </Dialog>
//     );
// }

// // Hook untuk menggunakan filter modal secara programmatic
// export function useFilterModal() {
//     const [isOpen, setIsOpen] = React.useState(false);
//     const [filters, setFilters] = React.useState<FilterParams>({});
//     const [onApplyCallback, setOnApplyCallback] = React.useState<(filters: FilterParams) => void>();

//     const openModal = (currentFilters?: FilterParams, onApply?: (filters: FilterParams) => void) => {
//         if (currentFilters) {
//             setFilters(currentFilters);
//         }
//         if (onApply) {
//             setOnApplyCallback(() => onApply);
//         }
//         setIsOpen(true);
//     };

//     const closeModal = () => {
//         setIsOpen(false);
//     };

//     const handleApply = (newFilters: FilterParams) => {
//         setFilters(newFilters);
//         if (onApplyCallback) {
//             onApplyCallback(newFilters);
//         }
//         closeModal();
//     };

//     const Modal = (props: Omit<FilterModalProps, 'open' | 'onOpenChange' | 'initialFilters' | 'onFilterChange'>) => (
//         <FilterModal
//             open={isOpen}
//             onOpenChange={setIsOpen}
//             initialFilters={filters}
//             onFilterChange={handleApply}
//             {...props}
//         />
//     );

//     return {
//         openModal,
//         closeModal,
//         Modal,
//         isOpen,
//         currentFilters: filters,
//     };
// }