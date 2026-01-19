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
    }
    [key: string]: unknown;
}

export interface User {
    user_id: number;       
    user_name: string;     
    email: string;
    user_role: number | boolean; 
    email_verified_at: string | null;
    avatar?: string;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: Auth;
    flash: {
        success: string | null;
        error: string | null;
        warning?: string | null;
        info?: string | null;
    };
};

export function isNavGroupItem(item: NavItem): item is NavGroup {
    return !!(item.items && item.items.length > 0);
}

export function isNavLinkItem(item: NavItem): item is NavLink {
    return !!(item.href && !item.items);
}