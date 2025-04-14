'use client';

import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types/auth';
import { Bell, ChevronDown, ChevronLeft, ChevronRight, Expand, LogOut, Menu, Minimize, Settings, User as UserIcon, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface HeaderProps {
    user: User | null;
    collapsed: boolean;
    setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    mobileOpen: boolean;
    setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isFullscreen?: boolean;
    setIsFullscreen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Header({
    user,
    collapsed,
    setCollapsed,
    mobileOpen,
    setMobileOpen,
    isFullscreen: propIsFullscreen,
    setIsFullscreen: propSetIsFullscreen
}: HeaderProps) {
    const { signOut } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    // Use props if provided, otherwise use internal state
    const [localIsFullscreen, setLocalIsFullscreen] = useState(false);
    const isFullscreen = propIsFullscreen !== undefined ? propIsFullscreen : localIsFullscreen;
    const setIsFullscreen = propSetIsFullscreen || setLocalIsFullscreen;
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const profileButtonRef = useRef<HTMLButtonElement>(null);

    // Função para alternar o menu de perfil
    const toggleProfileMenu = () => setShowProfileMenu(!showProfileMenu);

    // Função para alternar o sidebar
    const toggleSidebar = () => setCollapsed(!collapsed);
    const toggleMobile = () => setMobileOpen(!mobileOpen);

    // Fechar o menu ao clicar fora dele
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current &&
                profileButtonRef.current &&
                !profileMenuRef.current.contains(event.target as Node) &&
                !profileButtonRef.current.contains(event.target as Node)) {
                setShowProfileMenu(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Check fullscreen status when component mounts
    useEffect(() => {
        const updateFullscreenState = () => {
            setIsFullscreen(document.fullscreenElement !== null);
        };

        document.addEventListener('fullscreenchange', updateFullscreenState);
        return () => document.removeEventListener('fullscreenchange', updateFullscreenState);
    }, []);

    // Toggle fullscreen function
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    return (
        <header className={`bg-[#3A3A3A] shadow-md sticky top-0 z-30 backdrop-blur-md transition-all duration-300 ease-in-out`}>
            <div className="max-w-full px-4 md:px-6 h-16 flex items-center justify-between">
                {/* Área esquerda com botão de menu e logo */}
                <div className="flex items-center space-x-3">
                    {/* Botão toggle para o sidebar em desktop */}
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-full hover:bg-[#4a4a4a] text-gray-300 hidden lg:flex items-center justify-center hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#09A08D]/20"
                        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>

                    {/* Botão para menu mobile */}
                    <button
                        onClick={toggleMobile}
                        className="p-2 rounded-full hover:bg-[#4a4a4a] text-gray-300 flex lg:hidden items-center justify-center"
                        aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
                    >
                        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>

                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center group">
                        <div className="flex items-center transition-transform duration-300 ease-out group-hover:scale-105">
                            <Image
                                src="/images/logoColet.png"
                                alt="Colet Sistemas"
                                width={38}
                                height={38}
                                className="object-contain"
                                priority
                            />
                            <span className={`ml-2 font-semibold text-xl text-white hidden sm:inline-block transition-opacity duration-300 ${collapsed ? 'lg:opacity-100' : 'lg:opacity-100'}`}>
                                <span className="text-[#09A08D]">Colet</span> Sistemas
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Controles na extremidade direita */}
                <div className="flex items-center space-x-1 sm:space-x-3">
                    {/* Notificações com animação de ping */}
                    <button className="p-2 rounded-full hover:bg-[#4a4a4a] relative transition-all duration-200">
                        <Bell className="h-5 w-5 text-gray-200" />
                        <span className="absolute top-1 right-1.5 h-2 w-2 bg-red-500 rounded-full 
                                      animate-pulse ring-2 ring-[#3A3A3A]"></span>
                    </button>

                    {/* Botões em telas maiores */}
                    <div className="hidden sm:flex items-center">
                        {/* Botão de tela cheia */}
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 rounded-full hover:bg-[#4a4a4a] text-gray-200 transition-all duration-200 ml-1"
                        >
                            {isFullscreen ? (
                                <Minimize className="h-5 w-5" />
                            ) : (
                                <Expand className="h-5 w-5" />
                            )}
                        </button>
                        {/* Configurações com efeito hover */}
                        <button className="p-2 rounded-full hover:bg-[#4a4a4a] text-gray-200 transition-all duration-200 
                                        hover:text-[#09A08D]">
                            <Settings className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Separador vertical em telas maiores */}
                    <div className="hidden sm:block h-8 w-px bg-gray-600 mx-1"></div>

                    {/* Menu de usuário */}
                    <div className="relative">
                        <button
                            ref={profileButtonRef}
                            onClick={toggleProfileMenu}
                            className="flex items-center space-x-2 sm:space-x-3 py-1.5 px-1.5 sm:px-3 rounded-lg hover:bg-[#4a4a4a] transition-all duration-200 group"
                            aria-expanded={showProfileMenu}
                            aria-haspopup="true"
                        >
                            <div className="w-9 h-9 bg-gradient-to-r from-[#09A08D] to-teal-500 text-white rounded-full flex items-center justify-center font-medium uppercase shadow-md group-hover:shadow-lg transition-all duration-200">
                                {user?.nome?.charAt(0) || 'U'}
                            </div>
                            <div className="text-left hidden md:block">
                                <p className="font-medium text-white text-sm leading-tight">{user?.nome || 'Usuário'}</p>
                                <p className="text-xs text-gray-300 truncate max-w-[140px] leading-tight">{user?.email}</p>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-gray-300 hidden md:block transition-transform duration-200 ${showProfileMenu ? 'transform rotate-180' : ''}`} />
                        </button>

                        {/* Menu dropdown */}
                        {showProfileMenu && (
                            <div
                                ref={profileMenuRef}
                                className="absolute right-0 mt-1 w-64 bg-[#3A3A3A] rounded-xl shadow-lg py-1.5 z-40 border border-gray-700 
                                          transform origin-top-right
                                          animate-in fade-in-50 slide-in-from-top-5 duration-150"
                                role="menu"
                            >
                                <div className="px-4 py-3 border-b border-gray-700">
                                    <p className="font-medium text-white">{user?.nome || 'Usuário'}</p>
                                    <p className="text-xs text-gray-300 truncate mt-0.5">{user?.email}</p>
                                </div>

                                <div className="py-1.5">
                                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-[#4a4a4a] hover:text-[#09A08D] transition-colors" role="menuitem">
                                        <UserIcon size={16} className="mr-3 text-gray-300" />
                                        Meu Perfil
                                    </a>
                                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-[#4a4a4a] hover:text-[#09A08D] transition-colors" role="menuitem">
                                        <Settings size={16} className="mr-3 text-gray-300" />
                                        Configurações
                                    </a>
                                </div>

                                <div className="py-1.5 border-t border-gray-700">
                                    <button
                                        onClick={signOut}
                                        className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                                        role="menuitem"
                                    >
                                        <LogOut size={16} className="mr-3" />
                                        <span>Sair do Sistema</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}