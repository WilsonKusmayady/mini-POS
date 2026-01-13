import * as React from 'react';
import AppLogo from '@/components/app-logo'; // [PERBAIKAN 1] Hapus kurung kurawal { }
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
import { LayoutDashboard, Package, ShoppingCart } from 'lucide-react';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { auth } = usePage().props as any; 
    const user = auth?.user;

    const navMain = [
        {
            title: 'Dashboard',
            href: '/', // Ganti url -> href
            icon: LayoutDashboard,
        },
        {
            title: 'Inventory',
            href: '/items', // Ganti url -> href
            icon: Package,
        },
        {
            title: 'Purchase',
            href: '/purchase/create', // Ganti url -> href
            icon: ShoppingCart,
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
                {}
                {user && (
                    <NavUser
                        user={{
                            // Mapping manual karena beda struktur DB
                            ...user, // Spread props asli
                            name: user.user_name || user.name || 'Admin POS',
                            email: user.email || 'staff@minipos.local', 
                            avatar: user.profile_photo_url || '',
                        }}
                    />
                )}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}