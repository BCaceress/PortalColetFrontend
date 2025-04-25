'use client';

import api from '@/services/api';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Calendar, ClipboardList, Edit, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
// Import our reusable components
import { EmailRAT } from '@/components/Emails/EmailRAT';
import { ActiveFilters } from '@/components/ui/ActiveFilters';
import { Column, DataTable } from '@/components/ui/DataTable';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';

// Define the RAT type based on the API response
interface RAT {
    id_rat: number;
    ds_status: string;
    fl_deslocamento: string; // S ou N
    dt_data_hora_entrada: string;
    dt_data_hora_saida: string;
    tm_duracao: string;
    tx_comentario_interno?: string;
    ds_originada?: string;
    ds_observacao?: string;
    nr_km_ida?: number;
    nr_km_volta?: number;
    nr_valor_pedagio?: number;
    tx_atividades?: string;
    tx_tarefas?: string;
    tx_pendencias?: string;
    id_usuario: number;
    id_cliente: number;
    id_contato: number;
    // Extended properties that might come from relationships/joins
    usuario?: {
        id_usuario: number;
        nome: string; // Changed from ds_nome to nome to match API response
    };
    cliente?: {
        id_cliente: number;
        ds_nome: string;
    };
    contato?: {
        id_contato: number;
        ds_nome: string;
        ds_email?: string;
    };
}

// Interface for RAT request payload
interface RATPayload {
    ds_status: string;
    fl_deslocamento: string;
    dt_data_hora_entrada: string;
    dt_data_hora_saida: string;
    tx_comentario_interno?: string;
    ds_originada?: string;
    ds_observacao?: string;
    nr_km_ida?: number;
    nr_km_volta?: number;
    nr_valor_pedagio?: number;
    tx_atividades?: string;
    tx_tarefas?: string;
    tx_pendencias?: string;
    id_usuario: number;
    id_cliente: number;
    id_contato: number;
}

// Modal mode type
type ModalMode = 'create' | 'edit' | 'view';

export default function RATs() {
    const router = useRouter();
    const [rats, setRATs] = useState<RAT[]>([]);
    const [filteredRATs, setFilteredRATs] = useState<RAT[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('todos');
    // Removendo filtros de data e mantendo apenas cliente e usuário
    const [clienteFilter, setClienteFilter] = useState<string>('todos');
    const [usuarioFilter, setUsuarioFilter] = useState<string>('todos');
    const [animateItems, setAnimateItems] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('create');
    const [currentRAT, setCurrentRAT] = useState<RAT | null>(null);

    // Format date helper function - movido para antes do uso
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
        } catch (error) {
            return 'Data inválida';
        }
    };

    // Format date and time helper function
    const formatDateTime = (dateString: string) => {
        try {
            return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
        } catch (error) {
            return 'Data/hora inválida';
        }
    };

    // Format duration helper function (HH:MM:SS to HHh MMmin)
    const formatDuration = (duration: string) => {
        if (!duration) return '-';
        const [hours, minutes] = duration.split(':');
        return `${hours}h ${minutes}min`;
    };

    useEffect(() => {
        const fetchRATs = async () => {
            try {
                setLoading(true);
                const response = await api.get('/rats');

                // Reset all filters when data is loaded
                setSearchTerm('');
                setStatusFilter('todos');
                setClienteFilter('todos');
                setUsuarioFilter('todos');

                // Use actual data from API response
                const data = response.data;

                setRATs(data);
                setFilteredRATs(data);
                setError(null);

                // Trigger animation after data loads
                setTimeout(() => setAnimateItems(true), 100);
            } catch (err) {
                console.error('Erro ao buscar RATs:', err);
                setError('Não foi possível carregar os registros de atendimento. Tente novamente mais tarde.');
            } finally {
                setLoading(false);
            }
        };

        fetchRATs();
    }, []);

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        filterRATs(term, statusFilter, clienteFilter, usuarioFilter);
    };

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
        filterRATs(searchTerm, status, clienteFilter, usuarioFilter);
    };

    const handleClienteFilter = (cliente: string) => {
        setClienteFilter(cliente);
        filterRATs(searchTerm, statusFilter, cliente, usuarioFilter);
    };

    const handleUsuarioFilter = (usuario: string) => {
        setUsuarioFilter(usuario);
        filterRATs(searchTerm, statusFilter, clienteFilter, usuario);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('todos');
        setClienteFilter('todos');
        setUsuarioFilter('todos');
        setFilteredRATs(rats); // Resetando diretamente para todos os RATs
    };

    const filterRATs = (
        term: string,
        status: string,
        cliente: string,
        usuario: string
    ) => {
        // Trigger fade-out animation
        setAnimateItems(false);

        setTimeout(() => {
            let filtered = [...rats]; // Criando uma cópia para evitar problemas de referência

            // Filter by search term
            if (term) {
                filtered = filtered.filter(rat =>
                    (rat.cliente?.ds_nome && rat.cliente.ds_nome.toLowerCase().includes(term.toLowerCase())) ||
                    (rat.contato?.ds_nome && rat.contato.ds_nome.toLowerCase().includes(term.toLowerCase())) ||
                    (rat.usuario?.nome && rat.usuario.nome.toLowerCase().includes(term.toLowerCase())) ||
                    (rat.tx_atividades && rat.tx_atividades.toLowerCase().includes(term.toLowerCase())) ||
                    (rat.ds_observacao && rat.ds_observacao.toLowerCase().includes(term.toLowerCase()))
                );
            }

            // Filter by status
            if (status !== 'todos') {
                filtered = filtered.filter(rat => rat.ds_status === status);
            }

            // Corrigindo o filtro por cliente
            if (cliente !== 'todos') {
                filtered = filtered.filter(rat => rat.cliente?.ds_nome === cliente);
            }

            // Corrigindo o filtro por usuário
            if (usuario !== 'todos') {
                filtered = filtered.filter(rat => rat.usuario?.nome === usuario);
            }

            setFilteredRATs(filtered);
            // Trigger fade-in animation
            setTimeout(() => setAnimateItems(true), 100);
        }, 200);
    };

    // Get unique status values from RATs for the status filter
    const statusOptions = [
        { id: 'todos', label: 'Todos', value: 'todos' },
        ...Array.from(new Set(rats.map(rat => rat.ds_status)))
            .map(status => ({
                id: status,
                label: status,
                value: status
            }))
    ];

    // If no RATs are loaded yet, provide default options
    if (statusOptions.length <= 1) {
        statusOptions.push(
            { id: 'Em Andamento', label: 'Em Andamento', value: 'Em Andamento' },
            { id: 'Concluído', label: 'Concluído', value: 'Concluído' },
            { id: 'Pendente', label: 'Pendente', value: 'Pendente' },
            { id: 'Cancelado', label: 'Cancelado', value: 'Cancelado' }
        );
    }

    // Create active filters array
    const activeFilters = [
        ...(statusFilter !== 'todos' ? [{
            id: 'status',
            label: statusFilter,
            type: 'status' as const,
            onRemove: () => handleStatusFilter('todos')
        }] : []),
        ...(clienteFilter !== 'todos' ? [{
            id: 'cliente',
            label: clienteFilter,
            type: 'feature' as const,
            onRemove: () => handleClienteFilter('todos')
        }] : []),
        ...(usuarioFilter !== 'todos' ? [{
            id: 'usuario',
            label: usuarioFilter,
            type: 'feature' as const,
            onRemove: () => handleUsuarioFilter('todos')
        }] : [])
    ];

    // Create filter configurations for the FilterPanel
    const filterConfig = [
        {
            name: 'Status',
            type: 'select' as const,
            options: statusOptions,
            currentValue: statusFilter,
            onChange: handleStatusFilter
        },
        {
            name: 'Cliente',
            type: 'select' as const,
            options: [
                { id: 'todos', label: 'Todos', value: 'todos' },
                ...Array.from(new Set(rats.map(rat => rat.cliente?.ds_nome)))
                    .filter(cliente => cliente)
                    .map(cliente => ({
                        id: cliente!,
                        label: cliente!,
                        value: cliente!
                    }))
            ],
            currentValue: clienteFilter,
            onChange: handleClienteFilter
        },
        {
            name: 'Usuário',
            type: 'select' as const,
            options: [
                { id: 'todos', label: 'Todos', value: 'todos' },
                ...Array.from(new Set(rats.map(rat => rat.usuario?.nome)))
                    .filter(usuario => usuario)
                    .map(usuario => ({
                        id: usuario!,
                        label: usuario!,
                        value: usuario!
                    }))
            ],
            currentValue: usuarioFilter,
            onChange: handleUsuarioFilter
        }
    ];

    // Create status badge component
    const StatusBadge = ({ status }: { status: string }) => {
        let colorClass = '';

        switch (status.toLowerCase()) {
            case 'em andamento':
                colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
                break;
            case 'concluído':
                colorClass = 'bg-green-100 text-green-800 border-green-200';
                break;
            case 'pendente':
                colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                break;
            case 'cancelado':
                colorClass = 'bg-red-100 text-red-800 border-red-200';
                break;
            default:
                colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
        }

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                {status}
            </span>
        );
    };

    // Define columns for the DataTable
    const columns: Column<RAT>[] = [
        {
            header: 'ID',
            accessor: 'id_rat',
            cellRenderer: (value) => (
                <span className="text-gray-700 font-medium">#{value}</span>
            )
        },
        {
            header: 'Cliente',
            accessor: 'cliente',
            cellRenderer: (value) => (
                <div className="font-medium text-gray-900">
                    {value?.ds_nome || 'Cliente não informado'}
                </div>
            )
        },
        {
            header: 'Contato',
            accessor: 'contato',
            cellRenderer: (value) => (
                <span className="text-gray-700">
                    {value?.ds_nome || 'Não informado'}
                </span>
            )
        },
        {
            header: 'Data',
            accessor: 'dt_data_hora_entrada',
            cellRenderer: (value) => (
                <span className="text-gray-700">{formatDate(value)}</span>
            )
        },
        {
            header: 'Horário',
            accessor: (row) => (
                `${format(parseISO(row.dt_data_hora_entrada), 'HH:mm')} às ${format(parseISO(row.dt_data_hora_saida), 'HH:mm')}`
            ),
            cellRenderer: (value) => (
                <span className="text-gray-700">{value}</span>
            )
        },
        {
            header: 'Duração',
            accessor: 'tm_duracao',
            cellRenderer: (value) => (
                <span className="text-gray-700">{formatDuration(value)}</span>
            )
        },
        {
            header: 'Implantador',
            accessor: 'usuario',
            cellRenderer: (value) => (
                <span className="text-gray-700">
                    {value?.nome || 'Não informado'}
                </span>
            )
        },
        {
            header: 'Status',
            accessor: 'ds_status',
            cellRenderer: (value) => <StatusBadge status={value} />
        }
    ];

    // Row actions
    const ratActions = (rat: RAT) => (
        <>
            <motion.button
                onClick={() => {
                    router.push(`/dashboard/rats/visualizar/${rat.id_rat}`);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.97 }}
                className="p-1 text-blue-500 rounded hover:bg-blue-50 transition-colors"
                title="Ver detalhes"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c-4.64 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </motion.button>
            <motion.button
                onClick={() => {
                    setCurrentRAT(rat);
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
            {/* Replace the email button with our new component */}
            <EmailRAT rat={rat} variant="icon" />
        </>
    );

    // Custom mobile card renderer
    const renderMobileRATCard = (rat: RAT) => (
        <div className="p-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-medium text-gray-900">{rat.cliente?.ds_nome || "Cliente não informado"}</h3>
                    <p className="text-sm text-gray-500 mt-1">{rat.contato?.ds_nome || "Contato não informado"}</p>
                </div>
                <div>
                    <StatusBadge status={rat.ds_status} />
                </div>
            </div>

            <div className="mt-3 space-y-1.5">
                <div className="flex items-center text-sm">
                    <Calendar size={16} className="text-gray-400 mr-2" />
                    <span className="text-gray-700">{formatDate(rat.dt_data_hora_entrada)}</span>
                </div>
                <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">
                        {format(parseISO(rat.dt_data_hora_entrada), 'HH:mm')} às {format(parseISO(rat.dt_data_hora_saida), 'HH:mm')}
                        <span className="text-gray-500 ml-2">({formatDuration(rat.tm_duracao)})</span>
                    </span>
                </div>
                <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-700">{rat.usuario?.nome || "Técnico não informado"}</span>
                </div>
            </div>

            {rat.tx_atividades && (
                <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500">Atividades:</p>
                    <p className="text-sm text-gray-700 mt-0.5 line-clamp-2">{rat.tx_atividades}</p>
                </div>
            )}

            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end space-x-2">
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/rats/visualizar/${rat.id_rat}`);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center gap-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c-4.64 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ver
                </motion.button>
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        setCurrentRAT(rat);
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
                {/* Replace the email button with our new component */}
                <EmailRAT rat={rat} variant="button" size="sm" />
            </div>
        </div>
    );

    // Handle create new RAT
    const handleCreateNewRAT = () => {
        router.push('/dashboard/rats/cadastro');
    };

    // Display full-screen loading spinner while data is being loaded initially
    if (loading && rats.length === 0) {
        return <LoadingSpinner fullScreen text="Carregando registros de atendimento..." />;
    }

    return (
        <div className="p-1 sm:p-5 max-w-7xl mx-auto">
            {/* Page header with title and action button */}
            <PageHeader
                title="Registros de Atendimento"
                description="Gerenciamento de RATs (Registros de Atendimento Técnico)"
                actionButton={
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="bg-gradient-to-r from-[#09A08D] to-teal-500 text-white px-4 sm:px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-all w-full sm:w-auto justify-center font-medium"
                        onClick={handleCreateNewRAT}
                    >
                        <ClipboardList size={18} />
                        <span>Novo RAT</span>
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
                            placeholder="Buscar por cliente, técnico ou atividades"
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
                <DataTable<RAT>
                    data={filteredRATs}
                    columns={columns}
                    keyField="id_rat"
                    isLoading={loading}
                    error={error}
                    loadingComponent={<LoadingSpinner size="medium" color="primary" text="Carregando..." />}
                    rowActions={ratActions}
                    mobileCardRenderer={renderMobileRATCard}
                    animationEnabled={animateItems}
                    emptyState={{
                        title: "Nenhum registro de atendimento encontrado",
                        description: "Adicione um novo RAT ou ajuste os filtros de busca",
                        primaryAction: {
                            label: "Novo RAT",
                            icon: <ClipboardList size={16} />,
                            onClick: handleCreateNewRAT
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
                onClick={handleCreateNewRAT}
            />

            {/* Modal components will be implemented later */}
        </div>
    );
}