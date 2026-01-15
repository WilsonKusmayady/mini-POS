import { InertiaLinkProps } from '@inertiajs/react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { LucideIcon, LucideProps } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export type IconType = ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
>;

export interface NavLink {
    title: string;
    href: string;
    icon?: IconType;
}

export interface NavGroup {
    title: string;
    icon?: IconType;
    items: NavLink[];
}

export interface NavItem {
    title: string;
    icon?: IconType;
    href?: string; 
    items?: NavLink[];  
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    flash: {
        success: string | null;
        error: string | null;
    };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export function isNavGroupItem(item: NavItem): item is NavGroup {
    return !!(item.items && item.items.length > 0);
}

export function isNavLinkItem(item: NavItem): item is NavLink {
    return !!(item.href && !item.items);
}