import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
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
import { Search, Filter, CalendarIcon, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

// Helper functions untuk kalender
const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
};

const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const shortMonthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

const dayNames = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];

export interface FilterParams {
    search?: string;
    gender?: string;
    startDate?: Date;
    endDate?: Date;
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
    initialFilters?: FilterParams;
    onFilterChange?: (filters: FilterParams) => void;
    
    // Customization
    title?: string;
    showSearch?: boolean;
    showGender?: boolean;
    showDateRange?: boolean;
    genderOptions?: Array<{ value: string; label: string }>;
}

export function FilterModal({
    triggerText = 'Filter',
    triggerVariant = 'outline',
    triggerSize = 'default',
    triggerIcon = <Filter className="h-4 w-4" />,
    triggerClassName,
    open,
    onOpenChange,
    initialFilters = {},
    onFilterChange,
    title = 'Filter Data',
    showSearch = true,
    showGender = true,
    showDateRange = true,
    genderOptions = [
        { value: 'all', label: 'Semua Gender' },
        { value: '1', label: 'Pria' },
        { value: '0', label: 'Wanita' },
    ],
}: FilterModalProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [filters, setFilters] = React.useState<FilterParams>(initialFilters);
    const [showStartCalendar, setShowStartCalendar] = React.useState(false);
    const [showEndCalendar, setShowEndCalendar] = React.useState(false);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (onOpenChange) {
            onOpenChange(open);
        }
        // Reset calendar state ketika modal ditutup
        if (!open) {
            setShowStartCalendar(false);
            setShowEndCalendar(false);
        }
    };

    const currentOpen = open !== undefined ? open : isOpen;

    const handleFilterChange = (key: keyof FilterParams, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
    };

    const handleApplyFilters = () => {
        if (onFilterChange) {
            onFilterChange(filters);
        }
        setIsOpen(false);
    };

    const handleResetFilters = () => {
        const resetFilters: FilterParams = {};
        setFilters(resetFilters);
        if (onFilterChange) {
            onFilterChange(resetFilters);
        }
        setIsOpen(false);
    };

    const formatDateDisplay = (date?: Date) => {
        if (!date) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const month = shortMonthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };

    // Komponen Badge
    const Badge = ({ children, variant = 'secondary', className }: { children: React.ReactNode; variant?: 'default' | 'secondary'; className?: string }) => (
        <span className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
            variant === 'secondary' ? "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80" : "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
            className
        )}>
            {children}
        </span>
    );

    // Komponen Calendar yang lebih canggih dengan pilihan tahun
    const EnhancedCalendar = ({ 
        selected, 
        onSelect,
        disabled,
        minDate,
        maxDate
    }: { 
        selected?: Date; 
        onSelect: (date: Date | undefined) => void;
        disabled?: (date: Date) => boolean;
        minDate?: Date;
        maxDate?: Date;
    }) => {
        const [currentDate, setCurrentDate] = React.useState(selected || new Date());
        const [viewMode, setViewMode] = React.useState<'days' | 'months' | 'years'>('days');
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Fungsi untuk navigasi
        const prevMonth = () => {
            setCurrentDate(new Date(year, month - 1, 1));
        };
        
        const nextMonth = () => {
            setCurrentDate(new Date(year, month + 1, 1));
        };
        
        const prevYear = () => {
            setCurrentDate(new Date(year - 1, month, 1));
        };
        
        const nextYear = () => {
            setCurrentDate(new Date(year + 1, month, 1));
        };
        
        // Render tampilan hari
        const renderDaysView = () => {
            const daysInMonth = getDaysInMonth(year, month);
            const firstDayOfMonth = getFirstDayOfMonth(year, month);
            
            const days = [];
            
            // Empty cells for days before the first day of the month
            for (let i = 0; i < firstDayOfMonth; i++) {
                days.push(<div key={`empty-${i}`} className="h-9 w-9"></div>);
            }
            
            // Days of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const isSelected = selected && 
                    date.getDate() === selected.getDate() &&
                    date.getMonth() === selected.getMonth() &&
                    date.getFullYear() === selected.getFullYear();
                const isDisabled = disabled ? disabled(date) : false;
                const isToday = date.toDateString() === new Date().toDateString();
                
                days.push(
                    <button
                        key={day}
                        onClick={() => !isDisabled && onSelect(date)}
                        className={cn(
                            "h-9 w-9 rounded-md text-sm transition-colors relative",
                            isSelected 
                                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                                : isToday
                                ? "bg-accent text-accent-foreground hover:bg-accent/90"
                                : "hover:bg-accent hover:text-accent-foreground",
                            isDisabled && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={isDisabled}
                    >
                        {day}
                    </button>
                );
            }
            
            return (
                <>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={prevYear}
                                className="h-7 w-7 p-0"
                            >
                                <ChevronsLeft className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={prevMonth}
                                className="h-7 w-7 p-0"
                            >
                                <ChevronLeft className="h-3 w-3" />
                            </Button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('months')}
                                className="px-2"
                            >
                                {monthNames[month]}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('years')}
                                className="px-2"
                            >
                                {year}
                            </Button>
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={nextMonth}
                                className="h-7 w-7 p-0"
                            >
                                <ChevronRight className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={nextYear}
                                className="h-7 w-7 p-0"
                            >
                                <ChevronsRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
                        {dayNames.map((day, i) => (
                            <div key={i} className="h-6 flex items-center justify-center">
                                {day}
                            </div>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                        {days}
                    </div>
                </>
            );
        };
        
        // Render tampilan bulan
        const renderMonthsView = () => {
            return (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={prevYear}
                            className="h-7 w-7 p-0"
                        >
                            <ChevronsLeft className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setViewMode('years')}
                            className="px-4"
                        >
                            {year}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={nextYear}
                            className="h-7 w-7 p-0"
                        >
                            <ChevronsRight className="h-3 w-3" />
                        </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                        {monthNames.map((monthName, index) => {
                            const monthDate = new Date(year, index, 1);
                            const isSelected = selected && 
                                selected.getMonth() === index && 
                                selected.getFullYear() === year;
                            
                            return (
                                <Button
                                    key={monthName}
                                    variant={isSelected ? "default" : "outline"}
                                    onClick={() => {
                                        setCurrentDate(monthDate);
                                        setViewMode('days');
                                    }}
                                    className="h-10"
                                >
                                    {monthName}
                                </Button>
                            );
                        })}
                    </div>
                </>
            );
        };
        
        // Render tampilan tahun
        const renderYearsView = () => {
            const currentYear = new Date().getFullYear();
            const startYear = Math.floor(currentYear / 10) * 10 - 10; // 10 tahun sebelum decade sekarang
            const years = [];
            
            for (let i = 0; i < 20; i++) {
                const year = startYear + i;
                const yearDate = new Date(year, 0, 1);
                const isSelected = selected && selected.getFullYear() === year;
                const isCurrentYear = year === currentYear;
                
                years.push(
                    <Button
                        key={year}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => {
                            setCurrentDate(yearDate);
                            setViewMode('months');
                        }}
                        className={cn(
                            "h-10",
                            isCurrentYear && !isSelected && "border-primary"
                        )}
                    >
                        {year}
                    </Button>
                );
            }
            
            return (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                // Navigasi ke decade sebelumnya
                                const newDate = new Date(startYear - 20, 0, 1);
                                setCurrentDate(newDate);
                            }}
                            className="px-4"
                        >
                            {startYear - 20} - {startYear - 1}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                // Navigasi ke decade berikutnya
                                const newDate = new Date(startYear + 20, 0, 1);
                                setCurrentDate(newDate);
                            }}
                            className="px-4"
                        >
                            {startYear + 20} - {startYear + 39}
                        </Button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                        {years}
                    </div>
                </>
            );
        };
        
        return (
            <div className="p-3 w-64">
                {viewMode === 'days' && renderDaysView()}
                {viewMode === 'months' && renderMonthsView()}
                {viewMode === 'years' && renderYearsView()}
                
                <div className="mt-4 pt-3 border-t flex justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelect(undefined)}
                        className="text-xs"
                    >
                        Hapus
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelect(new Date())}
                        className="text-xs"
                    >
                        Hari ini
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode('days')}
                        className="text-xs"
                    >
                        Tutup
                    </Button>
                </div>
            </div>
        );
    };

    return (
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
                    </Button>
                </DialogTrigger>
            )}
            
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Gender Filter */}
                    {showGender && (
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select
                                value={filters.gender || 'all'}
                                onValueChange={(value) => handleFilterChange('gender', value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    {genderOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Date Range Filter */}
                    {showDateRange && (
                        <div className="space-y-4">
                            <Label>Rentang Tanggal (Tanggal Lahir)</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Start Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="start-date" className="text-sm">
                                        Dari Tanggal
                                    </Label>
                                    <div className="relative">
                                        <div className="relative">
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !filters.startDate && "text-muted-foreground"
                                                )}
                                                onClick={() => {
                                                    setShowStartCalendar(!showStartCalendar);
                                                    setShowEndCalendar(false);
                                                }}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {filters.startDate ? (
                                                    formatDateDisplay(filters.startDate)
                                                ) : (
                                                    <span>Pilih tanggal</span>
                                                )}
                                            </Button>
                                            
                                            {filters.startDate && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                                                    onClick={() => {
                                                        handleFilterChange('startDate', undefined);
                                                        if (filters.endDate && filters.endDate < filters.startDate!) {
                                                            handleFilterChange('endDate', undefined);
                                                        }
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                        
                                        {/* Calendar untuk start date */}
                                        {showStartCalendar && (
                                            <div className="absolute z-50 mt-1 left-0 bg-background border rounded-md shadow-lg">
                                                <EnhancedCalendar
                                                    selected={filters.startDate}
                                                    onSelect={(date) => {
                                                        handleFilterChange('startDate', date);
                                                        setShowStartCalendar(false);
                                                        // Jika end date lebih kecil dari start date yang baru, reset end date
                                                        if (filters.endDate && date && filters.endDate < date) {
                                                            handleFilterChange('endDate', undefined);
                                                        }
                                                    }}
                                                    maxDate={filters.endDate || new Date()} // Tidak boleh lebih dari end date atau hari ini
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* End Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="end-date" className="text-sm">
                                        Sampai Tanggal
                                    </Label>
                                    <div className="relative">
                                        <div className="relative">
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !filters.endDate && "text-muted-foreground"
                                                )}
                                                onClick={() => {
                                                    setShowEndCalendar(!showEndCalendar);
                                                    setShowStartCalendar(false);
                                                }}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {filters.endDate ? (
                                                    formatDateDisplay(filters.endDate)
                                                ) : (
                                                    <span>Pilih tanggal</span>
                                                )}
                                            </Button>
                                            
                                            {filters.endDate && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                                                    onClick={() => handleFilterChange('endDate', undefined)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                        
                                        {/* Calendar untuk end date */}
                                        {showEndCalendar && (
                                            <div className="absolute z-50 mt-1 right-0 bg-background border rounded-md shadow-lg">
                                                <EnhancedCalendar
                                                    selected={filters.endDate}
                                                    onSelect={(date) => {
                                                        handleFilterChange('endDate', date);
                                                        setShowEndCalendar(false);
                                                    }}
                                                    minDate={filters.startDate} // Tidak boleh kurang dari start date
                                                    maxDate={new Date()} // Tidak boleh lebih dari hari ini
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Info tanggal */}
                            <div className="text-xs text-muted-foreground">
                                <p>• Pilih rentang tanggal lahir member</p>
                                <p>• Tanggal akhir tidak boleh kurang dari tanggal awal</p>
                                <p>• Tanggal tidak boleh melebihi hari ini</p>
                            </div>
                        </div>
                    )}

                    {/* Active Filters Summary */}
                    {(filters.search || filters.gender || filters.startDate || filters.endDate) && (
                        <Card>
                            <CardContent className="pt-4">
                                <h4 className="text-sm font-medium mb-2">Filter Aktif:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {filters.search && (
                                        <Badge variant="secondary" className="text-xs">
                                            <span className="flex items-center gap-1">
                                                <Search className="h-3 w-3" />
                                                {filters.search}
                                            </span>
                                        </Badge>
                                    )}
                                    {filters.gender && (
                                        <Badge variant="secondary" className="text-xs">
                                            Gender: {genderOptions.find(g => g.value === filters.gender)?.label}
                                        </Badge>
                                    )}
                                    {filters.startDate && (
                                        <Badge variant="secondary" className="text-xs">
                                            <span className="flex items-center gap-1">
                                                <CalendarIcon className="h-3 w-3" />
                                                {formatDateDisplay(filters.startDate)}
                                            </span>
                                        </Badge>
                                    )}
                                    {filters.endDate && (
                                        <Badge variant="secondary" className="text-xs">
                                            <span className="flex items-center gap-1">
                                                <CalendarIcon className="h-3 w-3" />
                                                {formatDateDisplay(filters.endDate)}
                                            </span>
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <DialogFooter className="flex justify-between gap-2">
                    <Button
                        type="button"
                        onClick={handleApplyFilters}
                        className="flex-1"
                    >
                        Terapkan Filter
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Hook untuk menggunakan filter modal secara programmatic
export function useFilterModal() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [filters, setFilters] = React.useState<FilterParams>({});
    const [onApplyCallback, setOnApplyCallback] = React.useState<(filters: FilterParams) => void>();

    const openModal = (currentFilters?: FilterParams, onApply?: (filters: FilterParams) => void) => {
        if (currentFilters) {
            setFilters(currentFilters);
        }
        if (onApply) {
            setOnApplyCallback(() => onApply);
        }
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    const handleApply = (newFilters: FilterParams) => {
        setFilters(newFilters);
        if (onApplyCallback) {
            onApplyCallback(newFilters);
        }
        closeModal();
    };

    const Modal = (props: Omit<FilterModalProps, 'open' | 'onOpenChange' | 'initialFilters' | 'onFilterChange'>) => (
        <FilterModal
            open={isOpen}
            onOpenChange={setIsOpen}
            initialFilters={filters}
            onFilterChange={handleApply}
            {...props}
        />
    );

    return {
        openModal,
        closeModal,
        Modal,
        isOpen,
        currentFilters: filters,
    };
}