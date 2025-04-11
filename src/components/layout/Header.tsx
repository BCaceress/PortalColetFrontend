'use client';

import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types/auth';
import { Bell, ChevronDown, LogOut, Search, Settings, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface HeaderProps {
    user: User | null;
}

export default function Header({ user }: HeaderProps) {
    const { signOut } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const profileButtonRef = useRef<HTMLButtonElement>(null);

    // Função para alternar o menu de perfil
    const toggleProfileMenu = () => setShowProfileMenu(!showProfileMenu);

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

    // Focar o input quando o campo de busca é aberto
    useEffect(() => {
        if (showSearch && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [showSearch]);

    // Manipula o envio da busca
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Pesquisando por:', searchTerm);
        // Implementar funcionalidade de busca aqui
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10 backdrop-blur-md bg-white/95">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo à esquerda */}
                <div className="flex items-center">
                    <div className="hidden lg:block">
                        <Image
                            src="/images/logo-colet.png"
                            alt="Logo Colet"
                            width={130}
                            height={40}
                            className="object-contain"
                        />
                    </div>
                    <div className="block lg:hidden">
                        <Image
                            src="/images/logo-colet.png"
                            alt="Logo Colet"
                            width={90}
                            height={30}
                            className="object-contain"
                        />
                    </div>
                </div>

                {/* Campo de busca central */}
                <div className={`
                    absolute left-0 right-0 mx-auto transition-all duration-300 ease-in-out
                    ${showSearch
                        ? 'top-full opacity-100 translate-y-0 shadow-md'
                        : 'top-[120%] opacity-0 pointer-events-none translate-y-2'}
                    md:static md:opacity-100 md:shadow-none md:pointer-events-auto md:translate-y-0 md:w-64 lg:w-96
                    md:mx-4 bg-white md:bg-transparent`}
                >
                    <form onSubmit={handleSearchSubmit} className="p-2 md:p-0">
                        <div className="relative">
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#09A08D]/30 focus:border-transparent transition-all duration-200"
                            />
                            <div className="absolute left-0 top-0 h-full flex items-center pl-3.5">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Controles à direita */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                    {/* Botão de busca para mobile */}
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className="p-2 rounded-full hover:bg-gray-100 relative transition-all duration-200 md:hidden"
                    >
                        <Search className="h-5 w-5 text-gray-600" />
                    </button>

                    {/* Notificações com animação de ping */}
                    <button className="p-2 rounded-full hover:bg-gray-100 relative transition-all duration-200">
                        <Bell className="h-5 w-5 text-gray-600" />
                        <span className="absolute top-1 right-1.5 h-2 w-2 bg-red-500 rounded-full 
                                        animate-pulse ring-2 ring-red-400 ring-opacity-50"></span>
                    </button>

                    {/* Configurações com efeito hover */}
                    <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-all duration-200 
                                      hover:rotate-12">
                        <Settings className="h-5 w-5" />
                    </button>

                    {/* Separador vertical */}
                    <div className="h-8 w-px bg-gray-200 mx-0.5 sm:mx-1.5"></div>

                    {/* Menu de usuário */}
                    <div className="relative">
                        <button
                            ref={profileButtonRef}
                            onClick={toggleProfileMenu}
                            className="flex items-center space-x-2 sm:space-x-3 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-all duration-200 group"
                        >
                            <div className="w-8 h-8 bg-gradient-to-r from-[#09A08D] to-teal-500 text-white rounded-full flex items-center justify-center font-medium uppercase shadow-sm group-hover:shadow-md transition-all duration-200 ring-2 ring-white">
                                {user?.nome?.charAt(0) || 'U'}
                            </div>
                            <div className="text-left hidden sm:block">
                                <p className="font-medium text-gray-800 text-sm">{user?.nome || 'Usuário'}</p>
                                <p className="text-xs text-gray-500 truncate max-w-[120px]">{user?.email}</p>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-gray-400 hidden sm:block transition-transform duration-200 ${showProfileMenu ? 'transform rotate-180' : ''}`} />
                        </button>

                        {/* Menu dropdown */}
                        {showProfileMenu && (
                            <div
                                ref={profileMenuRef}
                                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 z-20 border border-gray-100 
                                          transform transition-all duration-200 origin-top-right
                                          animate-in fade-in slide-in-from-top-5 zoom-in-95"
                            >
                                <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                                    <p className="font-medium text-gray-800">{user?.nome || 'Usuário'}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>

                                <div className="px-4 py-2 sm:py-3 sm:flex items-center space-x-3 border-b border-gray-100 hidden">
                                    <div className="w-10 h-10 bg-gradient-to-r from-[#09A08D] to-teal-500 text-white rounded-full flex items-center justify-center font-medium uppercase shadow-sm">
                                        {user?.nome?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{user?.nome || 'Usuário'}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                </div>

                                <div className="py-1">
                                    <a href="#" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                        <UserIcon size={16} className="mr-3 text-gray-500" />
                                        Perfil
                                    </a>
                                    <a href="#" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                        <Settings size={16} className="mr-3 text-gray-500" />
                                        Preferências
                                    </a>
                                </div>

                                <div className="py-1 border-t border-gray-100">
                                    <button
                                        onClick={signOut}
                                        className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut size={16} className="mr-3" />
                                        <span>Sair</span>
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