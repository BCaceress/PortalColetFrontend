'use client';

import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import { motion } from 'framer-motion';
import { debounce } from 'lodash';
import { BadgeCheck, BadgeX, Edit, Plus, Search, Shield, User, UserCog, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Import our reusable components
import { UserFormModal } from '@/components/modals/UserFormModal';
import { ActiveFilters } from '@/components/ui/ActiveFilters';
import { Column, DataTable } from '@/components/ui/DataTable';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';

// Define the user type to match the API response
interface Usuario {
    id_usuario: number;
    nome: string;
    email: string;
    funcao: string;
    fl_ativo: boolean;
}

// Interface for new user request payload
interface UsuarioPayload {
    nome: string;
    email: string;
    funcao: string;
    senha?: string;
    fl_ativo: boolean;
}

// Modal mode type
type ModalMode = 'create' | 'edit' | 'view';

// Tipos de funções disponíveis
type FuncaoType = 'todos' | 'Administrador' | 'Analista' | 'Desenvolvedor' | 'Implantador' | 'Suporte';

export default function Usuarios() {
    const { user } = useAuth();
    const router = useRouter();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [funcaoFilter, setFuncaoFilter] = useState<FuncaoType>('todos');
    const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('ativo');
    const [animateItems, setAnimateItems] = useState(false);

    // Estado para rastreamento de carregamento de dados
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Array para filtro multi-seleção de funções
    const [funcoesSelecionadas, setFuncoesSelecionadas] = useState<FuncaoType[]>([]);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('create');
    const [currentUsuario, setCurrentUsuario] = useState<Usuario | null>(null);

    // Toast notification state
    const [notification, setNotification] = useState<{
        message: string;
        type: 'success' | 'error';
        visible: boolean;
    }>({
        message: '',
        type: 'success',
        visible: false
    });

    // Usar useRef para garantir que a função só é executada uma vez
    const fetchExecutedRef = useRef(false);

    // Função para lidar com o clique no botão de atualizar com animação personalizada
    const [refreshButtonAnimation, setRefreshButtonAnimation] = useState(false);

    const handleRefreshButtonClick = () => {
        // Ativar a animação do botão
        setRefreshButtonAnimation(true);

        // Executar a atualização dos dados
        fetchUsuarios();

        // Desativar a animação após 1 segundo
        setTimeout(() => {
            setRefreshButtonAnimation(false);
        }, 1000);
    };

    // Verificar se o usuário é administrador e redirecionar se não for
    useEffect(() => {
        // Se o usuário não for Administrador, redirecionar
        if (user && user.funcao !== 'Administrador') {
            router.push('/dashboard');
            return;
        }

        // Chamar a API apenas uma vez quando o usuário estiver disponível
        // e se ainda não tiver sido executada
        if (user && !fetchExecutedRef.current) {
            fetchExecutedRef.current = true;
            fetchUsuarios();
        }
    }, [user, router]);

    // Função memoizada para buscar os usuários da API
    const fetchUsuarios = useCallback(async () => {
        try {
            setLoading(true);
            setIsRefreshing(true);
            const response = await api.get('/usuarios');
            setUsuarios(response.data);

            // Filtra para aplicar os filtros atuais
            applyFilters(response.data, searchTerm, funcaoFilter, statusFilter, funcoesSelecionadas);

            setError(null);
        } catch (err) {
            console.error('Erro ao buscar usuários:', err);
            setError('Não foi possível carregar os usuários. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
            // Trigger animation after data loads with slight delay for smooth UX
            setTimeout(() => setAnimateItems(true), 100);
        }
    }, [searchTerm, funcaoFilter, statusFilter, funcoesSelecionadas]);

    // Função para mostrar notificações toast
    const showNotification = useCallback((message: string, type: 'success' | 'error') => {
        setNotification({
            message,
            type,
            visible: true
        });

        // Auto-hide after 5 seconds
        setTimeout(() => {
            setNotification(prev => ({ ...prev, visible: false }));
        }, 5000);
    }, []);

    // Funções otimizadas para filtrar usuários
    const applyFilters = useCallback((data: Usuario[],
        term: string,
        funcao: FuncaoType,
        status: 'todos' | 'ativo' | 'inativo',
        funcoesSel: FuncaoType[]) => {
        // Desativar animação antes de aplicar filtros
        setAnimateItems(false);

        // Filtra os dados de forma eficiente
        let filtered = [...data];

        // Aplicar termo de busca (case insensitive)
        if (term) {
            const termLower = term.toLowerCase();
            filtered = filtered.filter(usuario =>
                usuario.nome.toLowerCase().includes(termLower) ||
                usuario.email.toLowerCase().includes(termLower)
            );
        }

        // Aplicar filtro de funções selecionadas
        if (funcoesSel.length > 0) {
            filtered = filtered.filter(usuario =>
                funcoesSel.includes(usuario.funcao as FuncaoType)
            );
        }
        // Ou aplicar filtro único de função se não houver múltiplas selecionadas
        else if (funcao !== 'todos') {
            filtered = filtered.filter(usuario => usuario.funcao === funcao);
        }

        // Aplicar filtro de status
        if (status !== 'todos') {
            filtered = filtered.filter(usuario =>
                (status === 'ativo' ? usuario.fl_ativo : !usuario.fl_ativo)
            );
        }

        // Atualizar os resultados filtrados
        setFilteredUsuarios(filtered);

        // Reativar animações com um pequeno delay para melhor UX
        setTimeout(() => setAnimateItems(true), 50);
    }, []);

    // Função debounced para pesquisa
    const debouncedSearch = useMemo(() =>
        debounce((term: string) => {
            setSearchTerm(term);
            applyFilters(usuarios, term, funcaoFilter, statusFilter, funcoesSelecionadas);
        }, 300),
        [usuarios, funcaoFilter, statusFilter, funcoesSelecionadas, applyFilters]);

    // Handlers de filtro otimizados com useCallback
    const handleSearch = useCallback((term: string) => {
        debouncedSearch(term);
    }, [debouncedSearch]);

    const handleFuncaoFilter = useCallback((funcao: FuncaoType) => {
        setFuncaoFilter(funcao);
        setFuncoesSelecionadas([]); // Limpa o filtro múltiplo quando seleciona único
        applyFilters(usuarios, searchTerm, funcao, statusFilter, []);
    }, [usuarios, searchTerm, statusFilter, applyFilters]);

    const handleMultiFuncaoFilter = useCallback((funcoes: FuncaoType[]) => {
        setFuncoesSelecionadas(funcoes);
        setFuncaoFilter('todos'); // Resetar o filtro único quando usa múltiplo
        applyFilters(usuarios, searchTerm, 'todos', statusFilter, funcoes);
    }, [usuarios, searchTerm, statusFilter, applyFilters]);

    const handleStatusFilter = useCallback((status: 'todos' | 'ativo' | 'inativo') => {
        setStatusFilter(status);
        applyFilters(usuarios, searchTerm, funcaoFilter, status, funcoesSelecionadas);
    }, [usuarios, searchTerm, funcaoFilter, funcoesSelecionadas, applyFilters]);

    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setFuncaoFilter('todos');
        setStatusFilter('ativo');
        setFuncoesSelecionadas([]);
        applyFilters(usuarios, '', 'todos', 'ativo', []);
    }, [usuarios, applyFilters]);

    // Handler para criar novo usuário 
    const handleCreateNewUser = useCallback(() => {
        setCurrentUsuario(null);
        setModalMode('create');
        setIsModalOpen(true);
    }, []);

    // Handler para sucesso nas operações do modal
    const handleModalSuccess = useCallback((message: string) => {
        showNotification(message, 'success');
        fetchUsuarios(); // Recarrega a lista de usuários
    }, [showNotification, fetchUsuarios]);

    // Handler para erros nas operações do modal
    const handleModalError = useCallback((message: string) => {
        showNotification(message, 'error');
    }, [showNotification]);

    // Create active filters array - memoizado para evitar re-renderizações
    const activeFilters = useMemo(() => [
        ...(funcoesSelecionadas.length > 0 ? [{
            id: 'funcoes',
            label: `${funcoesSelecionadas.length} funções selecionadas`,
            type: 'feature' as const,
            onRemove: () => handleMultiFuncaoFilter([])
        }] : []),
        // Mostrar filtro de status apenas quando for 'inativo' ou 'todos'
        ...(statusFilter === 'inativo' || statusFilter === 'todos' ? [{
            id: 'status',
            label: statusFilter === 'inativo' ? 'Inativo' : 'Todos',
            type: 'status' as const,
            onRemove: () => handleStatusFilter('ativo')
        }] : []),
        // Adicionar filtro de pesquisa se estiver preenchido
        ...(searchTerm ? [{
            id: 'search',
            label: `Busca: ${searchTerm}`,
            type: 'feature' as const,
            onRemove: () => handleSearch('')
        }] : [])
    ], [funcoesSelecionadas, statusFilter, searchTerm, handleMultiFuncaoFilter, handleStatusFilter, handleSearch]);

    // Configuração dos ícones para cada função - memoizada para evitar recriação
    const getFuncaoIcon = useCallback((funcao: string) => {
        switch (funcao) {
            case 'Administrador':
                return <Shield size={14} className="text-purple-600" />;
            case 'Analista':
                return <User size={14} className="text-blue-600" />;
            case 'Desenvolvedor':
                return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600"><path d="m18 16 4-4-4-4" /><path d="m6 8-4 4 4 4" /><path d="m14.5 4-5 16" /></svg>;
            case 'Implantador':
                return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M19 10v1a7 7 0 0 1-14 0v-1" /><line x1="12" x2="12" y1="18" y2="22" /></svg>;
            case 'Suporte':
                return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path d="M11.11 12a1 1 0 1 1 1.86-.5" /><path d="M11 17v.01" /><path d="M10 5v.4A3.4 3.4 0 0 1 14 2" /><path d="M7 3a5 5 0 1 0 10 0" /><path d="m2 2 20 20" /><path d="M8.5 11a2 2 0 0 0 3.5-1" /></svg>;
            default:
                return <Users size={14} className="text-gray-600" />;
        }
    }, []);

    // Create filter configurations for the FilterPanel - memoizado
    const filterConfig = useMemo(() => [
        {
            name: 'Status',
            type: 'multi-toggle' as const,
            icon: statusFilter === 'ativo' ? <BadgeCheck size={14} className="text-green-600" /> :
                statusFilter === 'inativo' ? <BadgeX size={14} className="text-red-600" /> : null,
            options: [
                { id: 'todos', label: 'Todos', value: 'todos' },
                { id: 'ativo', label: 'Ativo', value: 'ativo', icon: <BadgeCheck size={14} className="text-green-600" /> },
                { id: 'inativo', label: 'Inativo', value: 'inativo', icon: <BadgeX size={14} className="text-red-600" /> }
            ],
            currentValue: statusFilter,
            onChange: handleStatusFilter
        },
        {
            name: 'Filtrar por Funções',
            type: 'chip' as const,
            icon: <Users size={14} className="text-gray-600" />,
            options: [
                { id: 'Administrador', label: 'Administrador', value: 'Administrador', icon: <Shield size={14} /> },
                { id: 'Analista', label: 'Analista', value: 'Analista', icon: <User size={14} /> },
                { id: 'Desenvolvedor', label: 'Desenvolvedor', value: 'Desenvolvedor' },
                { id: 'Implantador', label: 'Implantador', value: 'Implantador' },
                { id: 'Suporte', label: 'Suporte', value: 'Suporte' }
            ],
            currentValue: funcoesSelecionadas,
            onChange: handleMultiFuncaoFilter
        }
    ], [statusFilter, funcoesSelecionadas, handleStatusFilter, handleMultiFuncaoFilter]);

    // Define columns for the DataTable - memoizado para evitar reconstrução
    const columns: Column<Usuario>[] = useMemo(() => [
        {
            header: 'Nome',
            accessor: 'nome',
            cellRenderer: (value) => (
                <div className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-none">
                    {value}
                </div>
            )
        },
        {
            header: 'E-mail',
            accessor: 'email',
            cellRenderer: (value) => (
                <span className="text-gray-700 truncate max-w-[200px] sm:max-w-none">
                    {value}
                </span>
            )
        },
        {
            header: 'Função',
            accessor: 'funcao',
            cellRenderer: (value) => {
                let badgeClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ";

                switch (value) {
                    case 'Administrador':
                        badgeClasses += "bg-purple-100 text-purple-800 border border-purple-200";
                        return <span className={badgeClasses}>
                            <Shield size={12} className="mr-1" /> Administrador
                        </span>;
                    case 'Analista':
                        badgeClasses += "bg-blue-100 text-blue-800 border border-blue-200";
                        return <span className={badgeClasses}>
                            <User size={12} className="mr-1" /> Analista
                        </span>;
                    case 'Desenvolvedor':
                        badgeClasses += "bg-teal-100 text-teal-800 border border-teal-200";
                        return <span className={badgeClasses}>Desenvolvedor</span>;
                    case 'Implantador':
                        badgeClasses += "bg-yellow-100 text-yellow-800 border border-yellow-200";
                        return <span className={badgeClasses}>Implantador</span>;
                    case 'Suporte':
                        badgeClasses += "bg-red-100 text-red-800 border border-red-200";
                        return <span className={badgeClasses}>Suporte</span>;
                    default:
                        badgeClasses += "bg-gray-100 text-gray-800 border border-gray-200";
                        return <span className={badgeClasses}>{value}</span>;
                }
            }
        },
        {
            header: 'Status',
            accessor: 'fl_ativo',
            cellRenderer: (value) => {
                const badgeClasses = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                    }`;

                return (
                    <span className={badgeClasses}>
                        {value ?
                            <><BadgeCheck size={12} className="mr-1" /> Ativo</> :
                            <><BadgeX size={12} className="mr-1" /> Inativo</>
                        }
                    </span>
                );
            }
        }
    ], []);

    // Row actions - memoizado para evitar recriação em cada renderização
    const usuarioActions = useCallback((usuario: Usuario) => (
        <div className="flex space-x-1">
            <motion.button
                onClick={() => {
                    setCurrentUsuario(usuario);
                    setModalMode('view');
                    setIsModalOpen(true);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.97 }}
                className="p-1.5 text-gray-500 rounded hover:bg-gray-100 transition-colors"
                title="Ver detalhes"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c-4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </motion.button>
            <motion.button
                onClick={() => {
                    setCurrentUsuario(usuario);
                    setModalMode('edit');
                    setIsModalOpen(true);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.97 }}
                className="p-1.5 text-amber-600 rounded hover:bg-amber-50 transition-colors"
                title="Editar"
            >
                <Edit size={18} />
            </motion.button>
        </div>
    ), []);

    // Custom mobile card renderer - memoizado 
    const renderMobileUsuarioCard = useCallback((usuario: Usuario) => {
        let roleBadgeClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ";
        let roleLabel = usuario.funcao;
        let roleIcon = null;

        switch (usuario.funcao) {
            case 'Administrador':
                roleBadgeClasses += "bg-purple-100 text-purple-800 border border-purple-200";
                roleLabel = "Administrador";
                roleIcon = <Shield size={12} className="mr-1" />;
                break;
            case 'Analista':
                roleBadgeClasses += "bg-blue-100 text-blue-800 border border-blue-200";
                roleLabel = "Analista";
                roleIcon = <User size={12} className="mr-1" />;
                break;
            case 'Desenvolvedor':
                roleBadgeClasses += "bg-teal-100 text-teal-800 border border-teal-200";
                roleLabel = "Desenvolvedor";
                break;
            case 'Implantador':
                roleBadgeClasses += "bg-yellow-100 text-yellow-800 border border-yellow-200";
                roleLabel = "Implantador";
                break;
            case 'Suporte':
                roleBadgeClasses += "bg-red-100 text-red-800 border border-red-200";
                roleLabel = "Suporte";
                break;
            default:
                roleBadgeClasses += "bg-gray-100 text-gray-800 border border-gray-200";
        }

        const statusBadgeClasses = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${usuario.fl_ativo
            ? "bg-green-100 text-green-800 border border-green-200"
            : "bg-red-100 text-red-800 border border-red-200"
            }`;

        return (
            <motion.div
                className="p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{usuario.nome}</h3>
                        <p className="text-sm text-gray-500 mt-1 truncate">{usuario.email}</p>
                    </div>
                    <div className="ml-2 flex flex-col gap-1 items-end">
                        <span className={roleBadgeClasses}>
                            {roleIcon}
                            {roleLabel}
                        </span>
                        <span className={statusBadgeClasses}>
                            {usuario.fl_ativo ?
                                <><BadgeCheck size={12} className="mr-1" /> Ativo</> :
                                <><BadgeX size={12} className="mr-1" /> Inativo</>
                            }
                        </span>
                    </div>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end space-x-2">
                    <motion.button
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentUsuario(usuario);
                            setModalMode('view');
                            setIsModalOpen(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c-4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Ver
                    </motion.button>
                    <motion.button
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentUsuario(usuario);
                            setModalMode('edit');
                            setIsModalOpen(true);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-md hover:bg-amber-100 flex items-center gap-1"
                    >
                        <Edit size={14} />
                        Editar
                    </motion.button>
                </div>
            </motion.div>
        );
    }, []);

    // Display full-screen loading spinner while data is being loaded initially
    if (loading && usuarios.length === 0) {
        return <LoadingSpinner fullScreen text="Carregando usuários..." />;
    }

    return (
        <div className="p-1 sm:p-5 max-w-8xl mx-auto">
            {/* Page header with title and action button */}
            <PageHeader
                title="Usuários"
                description="Gerenciamento de usuários do sistema"
                actionButton={
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="bg-gradient-to-r from-[#09A08D] to-teal-500 text-white px-4 sm:px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-all w-full sm:w-auto justify-center font-medium"
                        onClick={handleCreateNewUser}
                    >
                        <UserCog size={18} />
                        <span>Novo Usuário</span>
                    </motion.button>
                }
            />

            {/* Search and filter container */}
            <div className="mb-6">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                    {/* Search and filter buttons row */}
                    <div className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                            {/* Campo de pesquisa - expandido em telas menores */}
                            <div className="flex-1 w-full">
                                <SearchBar
                                    onSearch={handleSearch}
                                    placeholder="Buscar por nome ou email"
                                    initialValue={searchTerm}
                                    className="w-full"
                                    icon={<Search size={18} className="text-gray-400" />}
                                />
                            </div>
                            <div className="flex justify-between items-center gap-2">
                                <FilterPanel
                                    filters={filterConfig}
                                    onClearFilters={clearFilters}
                                />

                                {/* Botão de atualizar com animação aprimorada */}
                                <motion.button
                                    onClick={handleRefreshButtonClick}
                                    disabled={isRefreshing}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.9 }}
                                    animate={refreshButtonAnimation
                                        ? {
                                            rotate: [0, 360],
                                            scale: [1, 1.1, 1],
                                            borderColor: ['#e5e7eb', '#09A08D', '#e5e7eb']
                                        }
                                        : {}}
                                    transition={refreshButtonAnimation
                                        ? {
                                            duration: 1,
                                            ease: "easeInOut"
                                        }
                                        : {}}
                                    className={`flex items-center justify-center p-2.5 h-[42px] w-[42px] rounded-lg border transition-all
                                        ${isRefreshing
                                            ? 'bg-gray-50 opacity-70 border-gray-300'
                                            : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-[#09A08D] hover:text-[#09A08D]'}`}
                                >
                                    <svg
                                        className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-[#09A08D]' : 'text-gray-500'}`}
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    {/* Filter Panel Content - this will expand when the filter button is clicked */}
                    <div id="filter-panel-content"></div>

                    {/* Active filters */}
                    <ActiveFilters
                        filters={activeFilters}
                        onClearAll={clearFilters}
                    />
                </motion.div>
            </div>

            {/* Data table */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
                <DataTable<Usuario>
                    data={filteredUsuarios}
                    columns={columns}
                    keyField="id_usuario"
                    isLoading={loading}
                    error={error}
                    loadingComponent={<LoadingSpinner size="medium" color="primary" text="Carregando..." />}
                    rowActions={usuarioActions}
                    mobileCardRenderer={renderMobileUsuarioCard}
                    animationEnabled={animateItems}
                    emptyState={{
                        title: "Nenhum usuário encontrado",
                        description: "Adicione um novo usuário ou ajuste os filtros de busca",
                        primaryAction: {
                            label: "Novo Usuário",
                            icon: <UserCog size={16} />,
                            onClick: handleCreateNewUser
                        },
                        secondaryAction: {
                            label: "Limpar Filtros",
                            onClick: clearFilters
                        }
                    }}
                    refreshData={fetchUsuarios}
                    virtualizedList={true}  // Ativar virtualização para melhor performance
                />
            </motion.div>

            {/* Floating action button for mobile */}
            <FloatingActionButton
                icon={<Plus size={24} />}
                onClick={handleCreateNewUser}
                label="Novo Usuário"
            />

            {/* Toast Notification - Redesenhado para melhor UX */}
            {notification.visible && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg max-w-sm z-50 border-l-4
                        ${notification.type === 'success' ?
                            'bg-white border-green-500 text-green-800' :
                            'bg-white border-red-500 text-red-800'}`}
                >
                    <div className="flex items-center">
                        <div className={`p-1.5 rounded-full ${notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'} mr-3`}>
                            {notification.type === 'success' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <p className="font-medium">
                                {notification.type === 'success' ? 'Sucesso!' : 'Atenção!'}
                            </p>
                            <p className="text-sm font-normal mt-0.5">{notification.message}</p>
                        </div>
                    </div>

                    <motion.button
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                        onClick={() => setNotification(prev => ({ ...prev, visible: false }))}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <X size={16} />
                    </motion.button>
                </motion.div>
            )}

            {/* User Form Modal */}
            <UserFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                modalMode={modalMode}
                currentUser={currentUsuario}
                onSuccess={handleModalSuccess}
                onError={handleModalError}
            />
        </div>
    );
}