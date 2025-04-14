'use client';

import api from '@/services/api';
import { motion } from 'framer-motion';
import { Edit, Plus, UserCog } from 'lucide-react';
import { useEffect, useState } from 'react';

// Import our reusable components
import { ActiveFilters } from '@/components/ui/ActiveFilters';
import { Column, DataTable } from '@/components/ui/DataTable';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';

// Define the user type to match the API response
interface Usuario {
    id_usuario: number;
    nome: string;
    email: string;
    funcao: string;
}

// Interface for new user request payload
interface UsuarioPayload {
    nome: string;
    email: string;
    funcao: string;
    senha?: string;
}

// Modal mode type
type ModalMode = 'create' | 'edit' | 'view';

export default function Usuarios() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [funcaoFilter, setFuncaoFilter] = useState<'todos' | 'admin' | 'operador' | 'consultor'>('todos');
    const [animateItems, setAnimateItems] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('create');
    const [currentUsuario, setCurrentUsuario] = useState<Usuario | null>(null);
    const [formData, setFormData] = useState<UsuarioPayload>({
        nome: '',
        email: '',
        funcao: 'operador'
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof UsuarioPayload, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
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

        fetchUsuarios();
    }, []);

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        filterUsuarios(term, funcaoFilter);
    };

    const handleFuncaoFilter = (funcao: 'todos' | 'admin' | 'operador' | 'consultor') => {
        setFuncaoFilter(funcao);
        filterUsuarios(searchTerm, funcao);
    };

    const clearFilters = () => {
        setFuncaoFilter('todos');
        filterUsuarios(searchTerm, 'todos');
    };

    const filterUsuarios = (
        term: string,
        funcao: 'todos' | 'admin' | 'operador' | 'consultor'
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

            setFilteredUsuarios(filtered);
            // Trigger fade-in animation
            setTimeout(() => setAnimateItems(true), 100);
        }, 200);
    };

    // Create active filters array
    const activeFilters = [
        ...(funcaoFilter !== 'todos' ? [{
            id: 'funcao',
            label: funcaoFilter === 'admin' ? 'Administrador' :
                funcaoFilter === 'operador' ? 'Operador' : 'Consultor',
            type: 'feature' as const,
            onRemove: () => handleFuncaoFilter('todos')
        }] : [])
    ];

    // Create filter configurations for the FilterPanel
    const filterConfig = [
        {
            name: 'Função',
            type: 'multi-toggle' as const,
            options: [
                { id: 'todos', label: 'Todos', value: 'todos' },
                { id: 'admin', label: 'Administrador', value: 'admin' },
                { id: 'operador', label: 'Operador', value: 'operador' },
                { id: 'consultor', label: 'Consultor', value: 'consultor' }
            ],
            currentValue: funcaoFilter,
            onChange: handleFuncaoFilter
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
                    case 'admin':
                        badgeClasses += "bg-purple-100 text-purple-800 border border-purple-200";
                        return <span className={badgeClasses}>Administrador</span>;
                    case 'operador':
                        badgeClasses += "bg-blue-100 text-blue-800 border border-blue-200";
                        return <span className={badgeClasses}>Operador</span>;
                    case 'consultor':
                        badgeClasses += "bg-teal-100 text-teal-800 border border-teal-200";
                        return <span className={badgeClasses}>Consultor</span>;
                    default:
                        badgeClasses += "bg-gray-100 text-gray-800 border border-gray-200";
                        return <span className={badgeClasses}>{value}</span>;
                }
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
            case 'admin':
                roleBadgeClasses += "bg-purple-100 text-purple-800 border border-purple-200";
                roleLabel = "Administrador";
                break;
            case 'operador':
                roleBadgeClasses += "bg-blue-100 text-blue-800 border border-blue-200";
                roleLabel = "Operador";
                break;
            case 'consultor':
                roleBadgeClasses += "bg-teal-100 text-teal-800 border border-teal-200";
                roleLabel = "Consultor";
                break;
            default:
                roleBadgeClasses += "bg-gray-100 text-gray-800 border border-gray-200";
        }

        return (
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-medium text-gray-900">{usuario.nome}</h3>
                        <p className="text-sm text-gray-500 mt-1">{usuario.email}</p>
                    </div>
                    <div className="ml-2">
                        <span className={roleBadgeClasses}>
                            {roleLabel}
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

    // Create new user handler
    const handleCreateNewUser = () => {
        setCurrentUsuario(null);
        setModalMode('create');
        setFormData({
            nome: '',
            email: '',
            funcao: 'operador',
        });
        setIsModalOpen(true);
    };

    return (
        <div className="p-3 sm:p-6 max-w-7xl mx-auto">
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

            {/* Modal components will be implemented later */}
        </div>
    );
}