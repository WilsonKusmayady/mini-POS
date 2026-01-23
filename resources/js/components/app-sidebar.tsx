import * as React from 'react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from '@/components/ui/sidebar';
import { usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    ShoppingCart,
    CreditCard,
    Users,
    User,
    Package,
    Database,
    FileText,
    ClipboardList,
    BarChart3
} from 'lucide-react';
import { type NavItem } from '@/types';

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    const navMain: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/',
            icon: LayoutGrid,
        },
        {
            title: 'Master Data',
            icon: Database,
            items: [
                {
                    title: 'User',
                    href: '/users',
                    icon: User,
                },
                {
                    title: 'Membership',
                    href: '/members',
                    icon: Users,
                },
                {
                    title: 'Inventory',
                    href: '/items',
                    icon: Package,
                },
            ],
        },
        {
            title: 'Transaksi',
            icon: FileText,
            items: [
                {
                    title: 'Purchase',
                    href: '/purchases',
                    icon: ShoppingCart,
                },
                {
                    title: 'Sales',
                    href: '/sales',
                    icon: CreditCard,
                },
                {
                    title: 'Summary',
                    href: '/summary',
                    icon: BarChart3,
                },
                {
                    title: 'Report',
                    href: '/reports',
                    icon: ClipboardList,
                },
            ],
        },
    ];

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <AppLogo />
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navMain} />
            </SidebarContent>

            <SidebarFooter>
                {user && (
                    <NavUser
                        user={{
                            ...user,
                            name: user.user_name ?? 'Staff POS',
                            email: user.email ?? 'staff@minipos.local',
                            avatar: '',
                        }}
                    />
                )}
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}