'use client';

import api from '@/services/api';
import { motion } from 'framer-motion';
import { Edit, Plus, UserCog } from 'lucide-react';
import { useEffect, useState } from 'react';

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

export default function Usuarios() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [funcaoFilter, setFuncaoFilter] = useState<'todos' | 'Administrador' | 'Analista' | 'Desenvolvedor' | 'Implantador' | 'Suporte'>('todos');
    const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>('todos');
    const [animateItems, setAnimateItems] = useState(false);

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

    useEffect(() => {
        fetchUsuarios();
    }, []);

    // Função para buscar os usuários da API
    const fetchUsuarios = async () => {
        try {
            setLoading(true);
            const response = await api.get('/usuarios');
            setUsuarios(response.data);
            setFilteredUsuarios(response.data);
            setError(null);

            // Trigger animation after data loads
            setTimeout(() => setAnimateItems(true), 100);
        } catch (err) {
            console.error('Erro ao buscar usuários:', err);
            setError('Não foi possível carregar os usuários. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    // Função para mostrar notificações toast
    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({
            message,
            type,
            visible: true
        });

        // Auto-hide after 5 seconds
        setTimeout(() => {
            setNotification(prev => ({ ...prev, visible: false }));
        }, 5000);
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        filterUsuarios(term, funcaoFilter, statusFilter);
    };

    const handleFuncaoFilter = (funcao: 'todos' | 'Administrador' | 'Analista' | 'Desenvolvedor' | 'Implantador' | 'Suporte') => {
        setFuncaoFilter(funcao);
        filterUsuarios(searchTerm, funcao, statusFilter);
    };

    const handleStatusFilter = (status: 'todos' | 'ativo' | 'inativo') => {
        setStatusFilter(status);
        filterUsuarios(searchTerm, funcaoFilter, status);
    };

    const clearFilters = () => {
        setFuncaoFilter('todos');
        setStatusFilter('todos');
        filterUsuarios(searchTerm, 'todos', 'todos');
    };

    const filterUsuarios = (
        term: string,
        funcao: 'todos' | 'Administrador' | 'Analista' | 'Desenvolvedor' | 'Implantador' | 'Suporte',
        status: 'todos' | 'ativo' | 'inativo'
    ) => {
        // Trigger fade-out animation
        setAnimateItems(false);

        setTimeout(() => {
            let filtered = usuarios;

            if (term) {
                filtered = filtered.filter(usuario =>
                    usuario.nome.toLowerCase().includes(term.toLowerCase()) ||
                    usuario.email.toLowerCase().includes(term.toLowerCase())
                );
            }

            if (funcao !== 'todos') {
                filtered = filtered.filter(usuario => usuario.funcao === funcao);
            }

            if (status !== 'todos') {
                filtered = filtered.filter(usuario =>
                    (status === 'ativo' ? usuario.fl_ativo : !usuario.fl_ativo)
                );
            }

            setFilteredUsuarios(filtered);
            // Trigger fade-in animation
            setTimeout(() => setAnimateItems(true), 100);
        }, 200);
    };

    // Handler para criar novo usuário 
    const handleCreateNewUser = () => {
        setCurrentUsuario(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    // Handler para sucesso nas operações do modal
    const handleModalSuccess = (message: string) => {
        showNotification(message, 'success');
        fetchUsuarios(); // Recarrega a lista de usuários
    };

    // Handler para erros nas operações do modal
    const handleModalError = (message: string) => {
        showNotification(message, 'error');
    };

    // Create active filters array
    const activeFilters = [
        ...(funcaoFilter !== 'todos' ? [{
            id: 'funcao',
            label: funcaoFilter,
            type: 'feature' as const,
            onRemove: () => handleFuncaoFilter('todos')
        }] : []),
        ...(statusFilter !== 'todos' ? [{
            id: 'status',
            label: statusFilter === 'ativo' ? 'Ativo' : 'Inativo',
            type: 'feature' as const,
            onRemove: () => handleStatusFilter('todos')
        }] : [])
    ];

    // Create filter configurations for the FilterPanel
    const filterConfig = [
        {
            name: 'Função',
            type: 'multi-toggle' as const,
            options: [
                { id: 'todos', label: 'Todos', value: 'todos' },
                { id: 'Administrador', label: 'Administrador', value: 'Administrador' },
                { id: 'Analista', label: 'Analista', value: 'Analista' },
                { id: 'Desenvolvedor', label: 'Desenvolvedor', value: 'Desenvolvedor' },
                { id: 'Implantador', label: 'Implantador', value: 'Implantador' },
                { id: 'Suporte', label: 'Suporte', value: 'Suporte' }
            ],
            currentValue: funcaoFilter,
            onChange: handleFuncaoFilter
        },
        {
            name: 'Status',
            type: 'multi-toggle' as const,
            options: [
                { id: 'todos', label: 'Todos', value: 'todos' },
                { id: 'ativo', label: 'Ativo', value: 'ativo' },
                { id: 'inativo', label: 'Inativo', value: 'inativo' }
            ],
            currentValue: statusFilter,
            onChange: handleStatusFilter
        }
    ];

    // Define columns for the DataTable
    const columns: Column<Usuario>[] = [
        {
            header: 'Nome',
            accessor: 'nome',
            cellRenderer: (value) => (
                <div className="font-medium text-gray-900">{value}</div>
            )
        },
        {
            header: 'E-mail',
            accessor: 'email',
            cellRenderer: (value) => (
                <span className="text-gray-700">{value}</span>
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
                        return <span className={badgeClasses}>Administrador</span>;
                    case 'Analista':
                        badgeClasses += "bg-blue-100 text-blue-800 border border-blue-200";
                        return <span className={badgeClasses}>Analista</span>;
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

                return <span className={badgeClasses}>{value ? 'Ativo' : 'Inativo'}</span>;
            }
        }
    ];

    // Row actions
    const usuarioActions = (usuario: Usuario) => (
        <>
            <motion.button
                onClick={() => {
                    setCurrentUsuario(usuario);
                    setModalMode('view');
                    setIsModalOpen(true);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.97 }}
                className="p-1 text-gray-500 rounded hover:bg-gray-100 transition-colors"
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
                className="p-1 text-amber-600 rounded hover:bg-amber-50 transition-colors"
                title="Editar"
            >
                <Edit size={18} />
            </motion.button>
        </>
    );

    // Custom mobile card renderer
    const renderMobileUsuarioCard = (usuario: Usuario) => {
        let roleBadgeClasses = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ";
        let roleLabel = usuario.funcao;

        switch (usuario.funcao) {
            case 'Administrador':
                roleBadgeClasses += "bg-purple-100 text-purple-800 border border-purple-200";
                roleLabel = "Administrador";
                break;
            case 'Analista':
                roleBadgeClasses += "bg-blue-100 text-blue-800 border border-blue-200";
                roleLabel = "Analista";
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

        const statusBadgeClasses = `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${usuario.fl_ativo
            ? "bg-green-100 text-green-800 border border-green-200"
            : "bg-red-100 text-red-800 border border-red-200"
            }`;

        return (
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-medium text-gray-900">{usuario.nome}</h3>
                        <p className="text-sm text-gray-500 mt-1">{usuario.email}</p>
                    </div>
                    <div className="ml-2 flex flex-col gap-1 items-end">
                        <span className={roleBadgeClasses}>
                            {roleLabel}
                        </span>
                        <span className={statusBadgeClasses}>
                            {usuario.fl_ativo ? 'Ativo' : 'Inativo'}
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
                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center gap-1"
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
                        className="px-3 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-md hover:bg-amber-100 flex items-center gap-1"
                    >
                        <Edit size={14} />
                        Editar
                    </motion.button>
                </div>
            </div>
        );
    };

    // Display full-screen loading spinner while data is being loaded initially
    if (loading && usuarios.length === 0) {
        return <LoadingSpinner fullScreen text="Carregando usuários..." />;
    }

    return (
        <div className="p-1 sm:p-4 max-w-7xl mx-auto">
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
                    {/* Search and filter row */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 p-3 sm:p-4">
                        <SearchBar
                            onSearch={handleSearch}
                            placeholder="Buscar por nome ou email"
                            initialValue={searchTerm}
                        />

                        <FilterPanel
                            filters={filterConfig}
                            onClearFilters={clearFilters}
                        />
                    </div>

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
                />
            </motion.div>

            {/* Floating action button for mobile */}
            <FloatingActionButton
                icon={<Plus size={24} />}
                onClick={handleCreateNewUser}
            />

            {/* Toast Notification */}
            {notification.visible && (
                <div
                    className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg max-w-xs z-50 transition-all duration-300 transform translate-y-0 opacity-100
                        ${notification.type === 'success' ?
                            'bg-green-100 border border-green-200 text-green-800' :
                            'bg-red-100 border border-red-200 text-red-800'}`}
                >
                    <div className="flex items-center">
                        {notification.type === 'success' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        )}
                        <span className="text-sm font-medium">{notification.message}</span>
                    </div>
                </div>
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