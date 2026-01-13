import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface DataItemProps {
    label: string;
    value: React.ReactNode;
    className?: string;
}

export function DataItem({ label, value, className }: DataItemProps) {
    return (
        <div className={cn("grid grid-cols-3 gap-4 py-2", className)}>
            <div className="font-medium text-muted-foreground">{label}</div>
            <div className="col-span-2">{value}</div>
        </div>
    );
}

interface DataSectionProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

export function DataSection({ title, children, className }: DataSectionProps) {
    return (
        <Card className={className}>
            <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">{title}</h3>
                {children}
            </CardContent>
        </Card>
    );
}

interface StatusBadgeProps {
    status: string | boolean | number;
    type?: 'success' | 'error' | 'warning' | 'info' | 'default';
    labels?: Record<string, string>;
}

export function StatusBadge({ status, type, labels }: StatusBadgeProps) {
    let badgeType = type;
    let label = String(status);

    if (typeof status === 'boolean') {
        badgeType = status ? 'success' : 'error';
        label = status ? 'Active' : 'Inactive';
    } else if (typeof status === 'number') {
        badgeType = status === 1 ? 'success' : status === 0 ? 'error' : 'warning';
        label = status === 1 ? 'Active' : status === 0 ? 'Inactive' : 'Pending';
    }

    // Custom labels
    if (labels && labels[label]) {
        label = labels[label];
    }

    const variantMap = {
        success: 'bg-green-100 text-green-800 hover:bg-green-100',
        error: 'bg-red-100 text-red-800 hover:bg-red-100',
        warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
        info: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
        default: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    };

    return (
        <Badge className={variantMap[badgeType || 'default']} variant="outline">
            {label}
        </Badge>
    );
}

interface CurrencyDisplayProps {
    amount: number;
    currency?: string;
    className?: string;
}

export function CurrencyDisplay({ amount, currency = 'IDR', className }: CurrencyDisplayProps) {
    const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
    }).format(amount);

    return <span className={cn("font-medium", className)}>{formatted}</span>;
}

interface DateDisplayProps {
    date: string | Date;
    format?: 'date' | 'datetime' | 'relative';
    className?: string;
}

export function DateDisplay({ date, format = 'date', className }: DateDisplayProps) {
    const dateObj = new Date(date);
    
    let formatted = '';
    
    if (format === 'date') {
        formatted = dateObj.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } else if (format === 'datetime') {
        formatted = dateObj.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } else if (format === 'relative') {
        const now = new Date();
        const diffMs = now.getTime() - dateObj.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            formatted = 'Hari ini';
        } else if (diffDays === 1) {
            formatted = 'Kemarin';
        } else if (diffDays < 7) {
            formatted = `${diffDays} hari lalu`;
        } else {
            formatted = dateObj.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        }
    }

    return <span className={className}>{formatted}</span>;
}