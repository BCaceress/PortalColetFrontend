'use client';

import {
    Building2,
    ClipboardList,
    LayoutDashboard,
    User,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
    collapsed: boolean;
    mobileOpen: boolean;
}

export default function Sidebar({ collapsed, mobileOpen }: SidebarProps) {
    const pathname = usePathname();

    const menuItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: <LayoutDashboard size={20} className="stroke-current" />
        },
        {
            name: 'Clientes',
            href: '/dashboard/clientes',
            icon: <Building2 size={20} className="stroke-current" />
        },
        {
            name: 'Contatos',
            href: '/dashboard/contatos',
            icon: <User size={20} className="stroke-current" />
        },
        {
            name: 'Usuários',
            href: '/dashboard/usuarios',
            icon: <Users size={20} className="stroke-current" />
        },
        {
            name: 'RATs',
            href: '/dashboard/rats',
            icon: <ClipboardList size={20} className="stroke-current" />
        },
    ];

    // Function to determine if a menu item is active based on current pathname
    const isItemActive = (itemHref: string) => {
        // Exact match
        if (pathname === itemHref) return true;

        // Special case for dashboard root
        if (itemHref === '/dashboard' && pathname === '/dashboard') return true;

        // Check if current path is a subpath of item, but only if it's not dashboard root
        if (itemHref !== '/dashboard' && pathname.startsWith(`${itemHref}/`)) return true;

        return false;
    };

    return (
        <>
            {/* Overlay for mobile menu */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300 ease-in-out"
                />
            )}

            {/* Sidebar - modificado para ser fixo sem scroll */}
            <aside
                className={`
                    fixed lg:static top-0 left-0 z-20
                    h-[calc(100vh-64px)] bg-[#3A3A3A] shadow-xl
                    flex flex-col overflow-hidden
                    transition-all duration-300 ease-in-out
                    ${collapsed ? 'w-20' : 'w-72'} 
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    border-r border-gray-700
                `}
            >
                {/* Menu de navegação fixo */}
                <nav className="flex-1">
                    <ul className="py-6 px-3 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = isItemActive(item.href);
                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={`
                                            group flex items-center rounded-xl transition-all duration-200
                                            ${collapsed ? 'justify-center py-3 px-2' : 'px-3 py-2.5'}
                                            ${isActive
                                                ? 'bg-gradient-to-r from-[#09A08D]/90 to-teal-500/90 text-white shadow-md shadow-[#09A08D]/20'
                                                : 'text-gray-200 hover:bg-[#4a4a4a] hover:shadow-sm'}
                                        `}
                                        title={collapsed ? item.name : ""}
                                    >
                                        <div className={`
                                            ${collapsed ? '' : 'mr-3'} 
                                            ${isActive ? 'transform scale-110 transition-transform duration-200' : ''}
                                        `}>
                                            {item.icon}
                                        </div>
                                        {!collapsed && (
                                            <span className={`font-medium transition-all duration-200 ${isActive ? 'transform translate-x-1' : ''}`}>
                                                {item.name}
                                            </span>
                                        )}
                                        {!collapsed && isActive && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-white ml-auto mr-1"></div>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>
        </>
    );
}