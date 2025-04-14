'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Proteger a rota - redirecionar se não estiver autenticado após verificação
    useEffect(() => {
        // Verificar se existe token no localStorage diretamente
        const token = localStorage.getItem('@ColetPortal:token');

        if (!token && !isAuthenticated) {
            router.push('/');
        } else {
            // Se temos token ou isAuthenticated é true, paramos de carregar
            setIsLoading(false);
        }
    }, [isAuthenticated, router]);

    // Check fullscreen status when component mounts
    useEffect(() => {
        const updateFullscreenState = () => {
            setIsFullscreen(document.fullscreenElement !== null);
        };

        document.addEventListener('fullscreenchange', updateFullscreenState);
        return () => document.removeEventListener('fullscreenchange', updateFullscreenState);
    }, []);

    // Se estiver carregando, mostrar tela de carregamento
    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#09A08D] mb-4"></div>
                <p className="text-gray-700 font-medium">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col overflow-hidden">
            <Header
                user={user}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
                isFullscreen={isFullscreen}
                setIsFullscreen={setIsFullscreen}
            />
            <div className="flex flex-1 h-[calc(100vh-64px)] relative">
                <Sidebar
                    collapsed={collapsed}
                    mobileOpen={mobileOpen}
                />
                <div
                    className={`
                        flex-1 transition-all duration-300 ease-in-out 
                        overflow-auto h-[calc(100vh-64px)] w-full
                        ${collapsed ? 'lg:ml-20 pl-0' : 'lg:ml-72 pl-0'}
                        ${isFullscreen ? 'ml-0' : ''}
                    `}
                >
                    <div className="pl-0 sm:pl-1">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}