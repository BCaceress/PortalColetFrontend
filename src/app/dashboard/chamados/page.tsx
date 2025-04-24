'use client';

import { motion } from 'framer-motion';
import { ClipboardList, Edit, Eye, MessageSquare, Plus, Tag, Timer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Import reusable components
import { ActiveFilters } from '@/components/ui/ActiveFilters';
import { Column, DataTable } from '@/components/ui/DataTable';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';

// Define the ticket types
interface Chamado {
    id_chamado: number;
    ds_titulo: string;
    ds_descricao?: string;
    ds_prioridade: 'baixa' | 'media' | 'alta' | 'critica';
    ds_status: 'aberto' | 'em_atendimento' | 'pendente' | 'resolvido' | 'fechado';
    ds_categoria: string;
    dt_criacao: string;
    dt_atualizacao: string;
    dt_fechamento?: string;
    cliente?: {
        id_cliente: number;
        ds_nome: string;
    };
    solicitante?: {
        id_usuario: number;
        ds_nome: string;
    };
    atendente?: {
        id_usuario: number;
        ds_nome: string;
    };
    comentarios?: number;
}

export default function Chamados() {
    const router = useRouter();
    // States
    const [chamados, setChamados] = useState<Chamado[]>([]);
    const [filteredChamados, setFilteredChamados] = useState<Chamado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentChamado, setCurrentChamado] = useState<Chamado | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});

    // Filter configuration
    const filterConfig = [
        {
            id: 'ds_status',
            label: 'Status',
            options: [
                { value: 'aberto', label: 'Aberto' },
                { value: 'em_atendimento', label: 'Em Atendimento' },
                { value: 'pendente', label: 'Pendente' },
                { value: 'resolvido', label: 'Resolvido' },
                { value: 'fechado', label: 'Fechado' }
            ]
        },
        {
            id: 'ds_prioridade',
            label: 'Prioridade',
            options: [
                { value: 'baixa', label: 'Baixa' },
                { value: 'media', label: 'Média' },
                { value: 'alta', label: 'Alta' },
                { value: 'critica', label: 'Crítica' }
            ]
        },
        {
            id: 'ds_categoria',
            label: 'Categoria',
            options: [
                { value: 'Erro de Sistema', label: 'Erro de Sistema' },
                { value: 'Integração', label: 'Integração' },
                { value: 'Solicitação', label: 'Solicitação' },
                { value: 'Dúvida', label: 'Dúvida' },
                { value: 'Acesso', label: 'Acesso' },
                { value: 'Outros', label: 'Outros' }
            ]
        }
    ];

    // Fetch data on component mount
    useEffect(() => {
        fetchChamados();
    }, []);

    // Apply filters when activeFilters or searchTerm change
    useEffect(() => {
        if (chamados.length > 0) {
            applyFilters();
        }
    }, [activeFilters, searchTerm, chamados]);

    const fetchChamados = async () => {
        try {
            setLoading(true);
            // Em produção, seria:
            // const response = await api.get('/chamados');
            // setChamados(response.data);

            // Dados mockados para desenvolvimento
            const mockChamados: Chamado[] = [
                {
                    id_chamado: 1001,
                    ds_titulo: 'Erro ao gerar relatório mensal',
                    ds_descricao: 'O sistema apresenta erro quando tento gerar o relatório mensal de produção.',
                    ds_prioridade: 'alta',
                    ds_status: 'aberto',
                    ds_categoria: 'Erro de Sistema',
                    dt_criacao: '2025-04-12T14:30:00Z',
                    dt_atualizacao: '2025-04-12T14:30:00Z',
                    cliente: {
                        id_cliente: 101,
                        ds_nome: 'Empresa ABC Ltda'
                    },
                    solicitante: {
                        id_usuario: 201,
                        ds_nome: 'João Silva'
                    },
                    comentarios: 2
                },
                {
                    id_chamado: 1002,
                    ds_titulo: 'Solicitação de novo usuário',
                    ds_descricao: 'Precisamos adicionar um novo usuário no sistema para o departamento financeiro.',
                    ds_prioridade: 'baixa',
                    ds_status: 'resolvido',
                    ds_categoria: 'Solicitação',
                    dt_criacao: '2025-04-10T09:15:00Z',
                    dt_atualizacao: '2025-04-11T16:20:00Z',
                    dt_fechamento: '2025-04-11T16:20:00Z',
                    cliente: {
                        id_cliente: 102,
                        ds_nome: 'Indústrias XYZ S/A'
                    },
                    solicitante: {
                        id_usuario: 202,
                        ds_nome: 'Maria Oliveira'
                    },
                    atendente: {
                        id_usuario: 301,
                        ds_nome: 'Carlos Técnico'
                    },
                    comentarios: 4
                },
                {
                    id_chamado: 1003,
                    ds_titulo: 'Integração com sistema de estoque',
                    ds_descricao: 'Estamos tendo problemas com a integração do sistema de estoque após a última atualização.',
                    ds_prioridade: 'media',
                    ds_status: 'em_atendimento',
                    ds_categoria: 'Integração',
                    dt_criacao: '2025-04-08T11:45:00Z',
                    dt_atualizacao: '2025-04-13T10:30:00Z',
                    cliente: {
                        id_cliente: 103,
                        ds_nome: 'Consultoria 123'
                    },
                    solicitante: {
                        id_usuario: 203,
                        ds_nome: 'Pedro Santos'
                    },
                    atendente: {
                        id_usuario: 302,
                        ds_nome: 'Ana Suporte'
                    },
                    comentarios: 6
                },
                {
                    id_chamado: 1004,
                    ds_titulo: 'Dúvida sobre módulo fiscal',
                    ds_descricao: 'Tenho dúvidas sobre como configurar o módulo fiscal para a nova legislação.',
                    ds_prioridade: 'media',
                    ds_status: 'pendente',
                    ds_categoria: 'Dúvida',
                    dt_criacao: '2025-04-14T08:20:00Z',
                    dt_atualizacao: '2025-04-14T13:10:00Z',
                    cliente: {
                        id_cliente: 104,
                        ds_nome: 'Comércio Rápido Ltda'
                    },
                    solicitante: {
                        id_usuario: 204,
                        ds_nome: 'Paula Mendes'
                    },
                    comentarios: 3
                },
                {
                    id_chamado: 1005,
                    ds_titulo: 'Sistema offline após queda de energia',
                    ds_descricao: 'O servidor não voltou a funcionar corretamente após uma queda de energia no data center.',
                    ds_prioridade: 'critica',
                    ds_status: 'aberto',
                    ds_categoria: 'Erro de Sistema',
                    dt_criacao: '2025-04-15T07:30:00Z',
                    dt_atualizacao: '2025-04-15T07:30:00Z',
                    cliente: {
                        id_cliente: 105,
                        ds_nome: 'Tech Solutions'
                    },
                    solicitante: {
                        id_usuario: 205,
                        ds_nome: 'Amanda Costa'
                    },
                    comentarios: 0
                }
            ];

            setChamados(mockChamados);
            setFilteredChamados(mockChamados);
            setLoading(false);
        } catch (err) {
            console.error('Erro ao buscar os chamados:', err);
            setError('Não foi possível carregar os chamados. Tente novamente mais tarde.');
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let results = [...chamados];

        // Apply search
        if (searchTerm) {
            const searchTermLower = searchTerm.toLowerCase();
            results = results.filter(
                chamado =>
                    chamado.ds_titulo.toLowerCase().includes(searchTermLower) ||
                    (chamado.ds_descricao && chamado.ds_descricao.toLowerCase().includes(searchTermLower)) ||
                    (chamado.cliente?.ds_nome.toLowerCase().includes(searchTermLower)) ||
                    (chamado.solicitante?.ds_nome.toLowerCase().includes(searchTermLower)) ||
                    (chamado.atendente?.ds_nome.toLowerCase().includes(searchTermLower))
            );
        }

        // Apply active filters
        Object.entries(activeFilters).forEach(([field, value]) => {
            if (value && value !== '') {
                if (Array.isArray(value)) {
                    if (value.length > 0) {
                        results = results.filter(chamado =>
                            value.includes(chamado[field as keyof Chamado] as string)
                        );
                    }
                } else {
                    results = results.filter(
                        chamado => chamado[field as keyof Chamado] === value
                    );
                }
            }
        });

        setFilteredChamados(results);
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
    };

    const handleFilterChange = (field: string, value: string | string[]) => {
        setActiveFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const clearFilters = () => {
        setActiveFilters({});
        setSearchTerm('');
    };

    const handleCreateNewTicket = () => {
        router.push('/dashboard/chamados/cadastro');
    };

    const handleViewTicketDetails = (chamado: Chamado) => {
        router.push(`/dashboard/chamados/visualizar/${chamado.id_chamado}`);
    };

    // Format date to readable format
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate time elapsed
    const getTimeElapsed = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) {
            return `${days}d ${hours}h`;
        } else {
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${minutes}m`;
        }
    };

    // Get color class for priority badge
    const getPriorityColorClass = (priority: string) => {
        switch (priority) {
            case 'baixa':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'media':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'alta':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'critica':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Get color class for status badge
    const getStatusColorClass = (status: string) => {
        switch (status) {
            case 'aberto':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'em_atendimento':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'pendente':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'resolvido':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'fechado':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Get formatted status label
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'aberto':
                return 'Aberto';
            case 'em_atendimento':
                return 'Em Atendimento';
            case 'pendente':
                return 'Pendente';
            case 'resolvido':
                return 'Resolvido';
            case 'fechado':
                return 'Fechado';
            default:
                return status;
        }
    };

    // Get formatted priority label
    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'baixa':
                return 'Baixa';
            case 'media':
                return 'Média';
            case 'alta':
                return 'Alta';
            case 'critica':
                return 'Crítica';
            default:
                return priority;
        }
    };

    // Define columns for the DataTable
    const columns: Column<Chamado>[] = [
        {
            header: 'ID',
            accessor: 'id_chamado',
            cellRenderer: (value) => (
                <span className="font-medium text-gray-700">#{value}</span>
            )
        },
        {
            header: 'Título',
            accessor: 'ds_titulo',
            cellRenderer: (value) => (
                <div className="font-medium text-gray-900 line-clamp-1">{value}</div>
            )
        },
        {
            header: 'Cliente',
            accessor: 'cliente',
            cellRenderer: (value) => (
                value ? (
                    <div className="font-medium text-gray-800">{value.ds_nome}</div>
                ) : (
                    <span className="text-gray-400 italic">Não informado</span>
                )
            )
        },
        {
            header: 'Status',
            accessor: 'ds_status',
            cellRenderer: (value) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(value)}`}>
                    {getStatusLabel(value)}
                </span>
            )
        },
        {
            header: 'Prioridade',
            accessor: 'ds_prioridade',
            cellRenderer: (value) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColorClass(value)}`}>
                    {getPriorityLabel(value)}
                </span>
            )
        },
        {
            header: 'Categoria',
            accessor: 'ds_categoria',
            cellRenderer: (value) => (
                <div className="flex items-center">
                    <Tag size={14} className="mr-1.5 text-gray-500" />
                    <span className="text-gray-700">{value}</span>
                </div>
            )
        },
        {
            header: 'Solicitante',
            accessor: 'solicitante',
            cellRenderer: (value) => (
                value ? (
                    <span className="text-gray-700">{value.ds_nome}</span>
                ) : (
                    <span className="text-gray-400 italic">Não informado</span>
                )
            )
        },
        {
            header: 'Atendente',
            accessor: 'atendente',
            cellRenderer: (value) => (
                value ? (
                    <span className="text-gray-700">{value.ds_nome}</span>
                ) : (
                    <span className="text-gray-400 italic">Não atribuído</span>
                )
            )
        },
        {
            header: 'Tempo',
            accessor: 'dt_criacao',
            cellRenderer: (value, row) => (
                <div className="flex items-center">
                    <Timer size={14} className="mr-1.5 text-gray-500" />
                    <span className="text-gray-700">{getTimeElapsed(value)}</span>
                </div>
            )
        },
        {
            header: 'Comentários',
            accessor: 'comentarios',
            cellRenderer: (value) => (
                <div className="flex items-center">
                    <MessageSquare size={14} className="mr-1.5 text-gray-500" />
                    <span className="text-gray-700">{value}</span>
                </div>
            )
        }
    ];

    // Row actions for tickets
    const chamadoActions = (chamado: Chamado) => (
        <>
            <motion.button
                onClick={() => handleViewTicketDetails(chamado)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.97 }}
                className="p-1 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                title="Ver detalhes"
            >
                <Eye size={18} />
            </motion.button>
            <motion.button
                onClick={() => {
                    setCurrentChamado(chamado);
                    // setModalMode('edit');
                    // setIsModalOpen(true);
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
    const renderMobileChamadoCard = (chamado: Chamado) => (
        <div className="p-4">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded mr-2">
                            #{chamado.id_chamado}
                        </span>
                        <h3 className="font-medium text-gray-900">{chamado.ds_titulo}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{chamado.cliente?.ds_nome}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(chamado.ds_status)}`}>
                        {getStatusLabel(chamado.ds_status)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColorClass(chamado.ds_prioridade)}`}>
                        {getPriorityLabel(chamado.ds_prioridade)}
                    </span>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                    <Tag size={14} className="mr-1.5 text-gray-500" />
                    <span className="text-gray-700">{chamado.ds_categoria}</span>
                </div>
                <div className="flex items-center">
                    <Timer size={14} className="mr-1.5 text-gray-500" />
                    <span className="text-gray-700">{getTimeElapsed(chamado.dt_criacao)}</span>
                </div>
                <div className="flex items-center">
                    <svg className="w-3.5 h-3.5 text-gray-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-700">{chamado.solicitante?.ds_nome || "Não informado"}</span>
                </div>
                <div className="flex items-center">
                    <MessageSquare size={14} className="mr-1.5 text-gray-500" />
                    <span className="text-gray-700">{chamado.comentarios} comentário(s)</span>
                </div>
            </div>

            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end space-x-2">
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleViewTicketDetails(chamado);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 flex items-center gap-1"
                >
                    <Eye size={14} />
                    Detalhes
                </motion.button>
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        setCurrentChamado(chamado);
                        // setModalMode('edit');
                        // setIsModalOpen(true);
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

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Page header */}
            <PageHeader
                title="Chamados"
                description="Gerencie os chamados e solicitações dos clientes"
                actionButton={
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="bg-gradient-to-r from-[#09A08D] to-teal-500 text-white px-4 sm:px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-all w-full sm:w-auto justify-center font-medium"
                        onClick={handleCreateNewTicket}
                    >
                        <ClipboardList size={18} />
                        <span>Novo Chamado</span>
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
                            placeholder="Buscar por título, cliente ou solicitante"
                            initialValue={searchTerm}
                        />

                        <FilterPanel
                            filters={filterConfig}
                            onFilterChange={handleFilterChange}
                            activeFilters={activeFilters}
                            onClearFilters={clearFilters}
                        />
                    </div>

                    {/* Active filters */}
                    <ActiveFilters
                        filters={Object.entries(activeFilters).map(([field, value]) => {
                            // Find the filter config for this field
                            const filterConf = filterConfig.find(f => f.id === field);

                            // If it's an array, handle multiple values
                            if (Array.isArray(value)) {
                                // For empty arrays, don't display anything
                                if (value.length === 0) return null;

                                // For arrays with one value, just display that value
                                const optionLabel = filterConf?.options.find(o => o.value === value[0])?.label || value[0];

                                return {
                                    id: field,
                                    label: `${filterConf?.label || field}: ${optionLabel}`,
                                    type: 'status',
                                    onRemove: () => {
                                        setActiveFilters(prev => {
                                            const newFilters = { ...prev };
                                            delete newFilters[field];
                                            return newFilters;
                                        });
                                    }
                                };
                            }

                            // For single values
                            const optionLabel = filterConf?.options.find(o => o.value === value)?.label || value;

                            return {
                                id: field,
                                label: `${filterConf?.label || field}: ${optionLabel}`,
                                type: 'status',
                                onRemove: () => {
                                    setActiveFilters(prev => {
                                        const newFilters = { ...prev };
                                        delete newFilters[field];
                                        return newFilters;
                                    });
                                }
                            };
                        }).filter(Boolean)}
                        onClearAll={clearFilters}
                    />
                </motion.div>
            </div>

            {/* Data table */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
            >
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <LoadingSpinner size="large" />
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</h3>
                        <p className="text-gray-500 mb-4">{error}</p>
                        <button
                            onClick={fetchChamados}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : (
                    <>
                        <DataTable
                            data={filteredChamados}
                            columns={columns}
                            actions={chamadoActions}
                            renderMobileCard={renderMobileChamadoCard}
                            onRowClick={(chamado) => handleViewTicketDetails(chamado)}
                            emptyMessage="Nenhum chamado encontrado"
                        />

                        {filteredChamados.length > 0 && (
                            <div className="mt-4 text-sm text-gray-500 text-center">
                                Mostrando {filteredChamados.length} de {chamados.length} chamados
                            </div>
                        )}
                    </>
                )}
            </motion.div>

            {/* Floating action button for mobile */}
            <FloatingActionButton
                label="Novo Chamado"
                icon={<Plus size={24} />}
                onClick={handleCreateNewTicket}
            />
        </div>
    );
}