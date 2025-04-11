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

    // Se estiver carregando, mostrar tela de carregamento
    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#09A08D] mb-4"></div>
                <p className="text-gray-600 font-medium">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={user} />
            <div className="flex">
                <Sidebar />
                <div className="flex-1 transition-all duration-200 ease-in-out">
                    {children}
                </div>
            </div>
        </div>
    );
}