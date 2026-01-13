import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useActiveUrl } from '@/hooks/use-active-url';
import { type NavItem, isNavGroupItem, isNavLinkItem } from '@/types';
import { Link } from '@inertiajs/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { urlIsActive } = useActiveUrl();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebar-expanded-groups');
            return saved ? JSON.parse(saved) : {};
        }
        return {};
    });

    useEffect(() => {
        localStorage.setItem('sidebar-expanded-groups', JSON.stringify(expandedGroups));
    }, [expandedGroups]);

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [title]: !prev[title],
        }));
    };

    useEffect(() => {
        items.forEach(item => {
            if (isNavGroupItem(item)) {
                const hasActiveChild = item.items.some(subItem => 
                    subItem.href && urlIsActive(subItem.href)
                );
                if (hasActiveChild && !expandedGroups[item.title]) {
                    setExpandedGroups(prev => ({
                        ...prev,
                        [item.title]: true,
                    }));
                }
            }
        });
    }, [items, urlIsActive, expandedGroups]);

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>

            <SidebarMenu>
                {items.map((item) => {
                    // Handle NavGroupItem (menu dengan subitems)
                    if (isNavGroupItem(item)) {
                        const isExpanded = expandedGroups[item.title] || false;
                        
                        return (
                            <SidebarMenuItem key={item.title}>
                                {/* Group Header */}
                                <SidebarMenuButton
                                    onClick={() => toggleGroup(item.title)}
                                    className="cursor-pointer justify-between hover:bg-accent"
                                >
                                    <span className="flex items-center gap-2">
                                        {item.icon && <item.icon className="h-4 w-4" />}
                                        <span className="font-medium">{item.title}</span>
                                    </span>
                                    <span className="transition-transform duration-200">
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </span>
                                </SidebarMenuButton>

                                {/* Submenu Items */}
                                {isExpanded && (
                                    <div className="mt-1 ml-4 space-y-1">
                                        {item.items.map((subItem) => (
                                            <SidebarMenuItem key={subItem.title}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={urlIsActive(subItem.href)}
                                                    className="h-8 text-sm hover:bg-accent/50"
                                                >
                                                    <Link href={subItem.href} prefetch>
                                                        <span className="flex items-center gap-2">
                                                            {subItem.icon && (
                                                                <subItem.icon className="h-3.5 w-3.5" />
                                                            )}
                                                            <span>{subItem.title}</span>
                                                        </span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </div>
                                )}
                            </SidebarMenuItem>
                        );
                    }
                    
                    // Handle NavLinkItem (single menu item)
                    if (isNavLinkItem(item)) {
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={urlIsActive(item.href)}
                                    tooltip={{ children: item.title }}
                                    className="hover:bg-accent"
                                >
                                    <Link href={item.href} prefetch>
                                        <span className="flex items-center gap-2">
                                            {item.icon && <item.icon className="h-4 w-4" />}
                                            <span>{item.title}</span>
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    }
                    
                    return null;
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}