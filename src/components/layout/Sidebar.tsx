'use client';

import {
    BookUser,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    LayoutDashboard,
    Menu,
    Users,
    X
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeItem, setActiveItem] = useState('');

    const menuItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: <LayoutDashboard size={20} className="stroke-current" />
        },
        {
            name: 'Clientes',
            href: '/dashboard/clientes',
            icon: <Users size={20} className="stroke-current" />
        },
        {
            name: 'Contatos',
            href: '/dashboard/contatos',
            icon: <BookUser size={20} className="stroke-current" />
        },
        {
            name: 'RATs',
            href: '/dashboard/rats',
            icon: <ClipboardList size={20} className="stroke-current" />
        },
    ];

    useEffect(() => {
        // Set active item based on current path
        const currentPath = menuItems.find(item => pathname === item.href || pathname.startsWith(`${item.href}/`));
        if (currentPath) {
            setActiveItem(currentPath.name);
        }
    }, [pathname]);

    const toggleSidebar = () => setCollapsed(!collapsed);
    const toggleMobile = () => setMobileOpen(!mobileOpen);

    return (
        <>
            {/* Mobile menu button - visible only on small screens */}
            <div className="fixed top-4 left-4 z-30 lg:hidden">
                <button
                    onClick={toggleMobile}
                    className="p-2.5 rounded-full bg-white shadow-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#09A08D]/20"
                    aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
                >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Overlay for mobile menu */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300 ease-in-out"
                    onClick={toggleMobile}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static top-0 left-0 z-20
                    h-screen lg:h-auto bg-white shadow-xl
                    transition-all duration-300 ease-in-out
                    ${collapsed ? 'w-20' : 'w-72'} 
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    border-r border-gray-100
                `}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        {!collapsed && (
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#09A08D] to-teal-500 flex items-center justify-center">
                                    <Image
                                        src="/images/logo-colet.png"
                                        width={24}
                                        height={24}
                                        alt="Colet"
                                        className="object-contain"
                                    />
                                </div>
                                <h2 className="text-lg font-bold bg-gradient-to-r from-[#09A08D] to-teal-500 text-transparent bg-clip-text">Colet</h2>
                            </div>
                        )}
                        {collapsed && (
                            <div className="mx-auto">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#09A08D] to-teal-500 flex items-center justify-center">
                                    <Image
                                        src="/images/logo-colet.png"
                                        width={24}
                                        height={24}
                                        alt="Colet"
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        )}
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-full hover:bg-gray-50 text-gray-600 hidden lg:flex items-center justify-center hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#09A08D]/20"
                            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
                        >
                            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                        <button
                            onClick={toggleMobile}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 flex lg:hidden items-center justify-center"
                            aria-label="Fechar menu"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-6 px-3">
                        <ul className="space-y-2">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={`
                                                group flex items-center rounded-xl transition-all duration-200
                                                ${collapsed ? 'justify-center py-3 px-2' : 'px-4 py-3'}
                                                ${isActive
                                                    ? 'bg-gradient-to-r from-[#09A08D]/90 to-teal-500/90 text-white shadow-md shadow-[#09A08D]/20'
                                                    : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'}
                                            `}
                                            title={collapsed ? item.name : ""}
                                            onClick={() => setActiveItem(item.name)}
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

                    {/* Footer - Version info or any bottom content */}
                    <div className={`
                        p-4 border-t border-gray-100 text-gray-500 text-xs
                        ${collapsed ? 'text-center' : ''}
                    `}>
                        {!collapsed && <span className="opacity-70">Portal Colet v1.0</span>}
                    </div>
                </div>
            </aside>
        </>
    );
}