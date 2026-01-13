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
} from 'lucide-react';

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    const navMain = [
        {
            title: 'Dashboard',
            href: '/',
            icon: LayoutGrid,
        },
        {
            title: 'Pembelian',
            href: '/purchase/create',
            icon: ShoppingCart,
        },
        {
            title: 'Penjualan',
            href: '/sales',
            icon: CreditCard,
        },
        {
            title: 'Membership',
            href: '/memberships',
            icon: Users,
        },
        {
            title: 'User',
            href: '/users',
            icon: User,
        },
        {
            title: 'Inventory',
            href: '/items',
            icon: Package,
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
