'use client';

import api from '@/services/api';
import { motion } from 'framer-motion';
import { Building2, Edit, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

// Import our reusable components
import { ActiveFilters } from '@/components/ui/ActiveFilters';
import { Column, DataTable } from '@/components/ui/DataTable';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';

// Define the client type to match the API response
interface Cliente {
    id_cliente: number;
    fl_ativo: boolean;
    ds_nome: string;
    ds_razao_social: string;
    nr_cnpj: string;
    nr_inscricao_estadual: string;
    ds_site?: string;
    ds_endereco: string;
    ds_cep: string;
    ds_uf: string;
    ds_cidade: string;
    ds_bairro: string;
    nr_numero: string;
    ds_complemento?: string;
    nr_codigo_ibge?: string;
    nr_latitude?: number;
    nr_longitude?: number;
    nr_distancia_km?: number;
    tx_observacao_ident?: string;
    fl_matriz: boolean;
    ds_situacao: string;
    ds_sistema?: string;
    ds_contrato?: string;
    nr_nomeados?: number;
    nr_simultaneos?: number;
    nr_tecnica_remoto?: number;
    nr_tecnica_presencial?: number;
    tm_minimo_horas?: string;
    ds_diario_viagem?: string;
    ds_regiao?: string;
    tx_observacao_contrato?: string;
    nr_codigo_zz?: number;
    nr_franquia_nf?: number;
    nr_qtde_documentos?: number;
    nr_valor_franqia?: number;
    nr_valor_excendente?: number;
    dt_data_contrato?: string;
    contatos?: {
        id_contato: number;
        ds_nome: string;
        ds_cargo: string;
    }[];
}

// Interface for new client request payload
interface ClientePayload {
    ds_nome: string;
    ds_razao_social: string;
    nr_cnpj: string;
    fl_ativo: boolean;
    ds_endereco: string;
    ds_cep: string;
    ds_uf: string;
    ds_cidade: string;
    ds_bairro: string;
    nr_numero: string;
    fl_matriz: boolean;
    ds_situacao: string;
    // Optional fields
    ds_site?: string;
    ds_complemento?: string;
    nr_inscricao_estadual?: string;
    tx_observacao_ident?: string;
    ds_sistema?: string;
    ds_contrato?: string;
    nr_nomeados?: number;
    nr_simultaneos?: number;
    ds_regiao?: string;
}

// Modal mode type
type ModalMode = 'create' | 'edit' | 'view';

export default function Clientes() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');
    const [contatosFilter, setContatosFilter] = useState<'todos' | 'com' | 'sem'>('todos');
    const [matrizFilter, setMatrizFilter] = useState<'todos' | 'matriz' | 'filial'>('todos');
    const [animateItems, setAnimateItems] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('create');
    const [currentCliente, setCurrentCliente] = useState<Cliente | null>(null);
    const [formData, setFormData] = useState<ClientePayload>({
        ds_nome: '',
        ds_razao_social: '',
        nr_cnpj: '',
        fl_ativo: true,
        ds_endereco: '',
        ds_cep: '',
        ds_uf: '',
        ds_cidade: '',
        ds_bairro: '',
        nr_numero: '',
        fl_matriz: false,
        ds_situacao: 'Ativo'
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof ClientePayload, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchClientes = async () => {
            try {
                setLoading(true);
                const response = await api.get('/clientes');
                setClientes(response.data);
                setFilteredClientes(response.data);
                setError(null);

                // Trigger animation after data loads
                setTimeout(() => setAnimateItems(true), 100);
            } catch (err) {
                console.error('Erro ao buscar clientes:', err);
                setError('Não foi possível carregar os clientes. Tente novamente mais tarde.');
            } finally {
                setLoading(false);
            }
        };

        fetchClientes();
    }, []);

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        filterClientes(term, statusFilter, contatosFilter, matrizFilter);
    };

    const handleStatusFilter = (status: 'todos' | 'ativos' | 'inativos') => {
        setStatusFilter(status);
        filterClientes(searchTerm, status, contatosFilter, matrizFilter);
    };

    const handleContatosFilter = (contatos: 'todos' | 'com' | 'sem') => {
        setContatosFilter(contatos);
        filterClientes(searchTerm, statusFilter, contatos, matrizFilter);
    };

    const handleMatrizFilter = (matriz: 'todos' | 'matriz' | 'filial') => {
        setMatrizFilter(matriz);
        filterClientes(searchTerm, statusFilter, contatosFilter, matriz);
    };

    const clearFilters = () => {
        setStatusFilter('todos');
        setContatosFilter('todos');
        setMatrizFilter('todos');
        filterClientes(searchTerm, 'todos', 'todos', 'todos');
    };

    const filterClientes = (
        term: string,
        status: 'todos' | 'ativos' | 'inativos',
        contatos: 'todos' | 'com' | 'sem',
        matriz: 'todos' | 'matriz' | 'filial'
    ) => {
        // Trigger fade-out animation
        setAnimateItems(false);

        setTimeout(() => {
            let filtered = clientes;

            if (term) {
                filtered = filtered.filter(cliente =>
                    cliente.ds_nome.toLowerCase().includes(term.toLowerCase()) ||
                    cliente.ds_razao_social.toLowerCase().includes(term.toLowerCase()) ||
                    cliente.nr_cnpj.includes(term) ||
                    (cliente.ds_site && cliente.ds_site.toLowerCase().includes(term.toLowerCase()))
                );
            }

            if (status !== 'todos') {
                filtered = filtered.filter(cliente => (status === 'ativos' ? cliente.fl_ativo : !cliente.fl_ativo));
            }

            if (contatos !== 'todos') {
                filtered = filtered.filter(cliente => {
                    const hasContacts = cliente.contatos && cliente.contatos.length > 0;
                    return contatos === 'com' ? hasContacts : !hasContacts;
                });
            }

            if (matriz !== 'todos') {
                filtered = filtered.filter(cliente => (matriz === 'matriz' ? cliente.fl_matriz : !cliente.fl_matriz));
            }

            setFilteredClientes(filtered);
            // Trigger fade-in animation
            setTimeout(() => setAnimateItems(true), 100);
        }, 200);
    };

    // Create active filters array
    const activeFilters = [
        ...(statusFilter !== 'todos' ? [{
            id: 'status',
            label: statusFilter === 'ativos' ? 'Ativo' : 'Inativo',
            type: 'status' as const,
            onRemove: () => handleStatusFilter('todos')
        }] : []),
        ...(contatosFilter !== 'todos' ? [{
            id: 'contatos',
            label: contatosFilter === 'com' ? 'Com contatos' : 'Sem contatos',
            type: 'relation' as const,
            onRemove: () => handleContatosFilter('todos')
        }] : []),
        ...(matrizFilter !== 'todos' ? [{
            id: 'matriz',
            label: matrizFilter === 'matriz' ? 'Matriz' : 'Filial',
            type: 'feature' as const,
            onRemove: () => handleMatrizFilter('todos')
        }] : [])
    ];

    // Create filter configurations for the FilterPanel
    const filterConfig = [
        {
            name: 'Status',
            type: 'multi-toggle' as const,
            options: [
                { id: 'todos', label: 'Todos', value: 'todos' },
                { id: 'ativos', label: 'Ativos', value: 'ativos' },
                { id: 'inativos', label: 'Inativos', value: 'inativos' }
            ],
            currentValue: statusFilter,
            onChange: handleStatusFilter
        },
        {
            name: 'Tipo',
            type: 'toggle' as const,
            options: [
                { id: 'todos', label: 'Todos', value: 'todos' },
                { id: 'matriz', label: 'Matriz', value: 'matriz' },
                { id: 'filial', label: 'Filial', value: 'filial' }
            ],
            currentValue: matrizFilter,
            onChange: handleMatrizFilter
        },
        {
            name: 'Contatos',
            type: 'toggle' as const,
            options: [
                { id: 'todos', label: 'Todos', value: 'todos' },
                { id: 'com', label: 'Com contatos', value: 'com' },
                { id: 'sem', label: 'Sem contatos', value: 'sem' }
            ],
            currentValue: contatosFilter,
            onChange: handleContatosFilter
        }
    ];

    // Format CNPJ helper function
    const formatCNPJ = (cnpj: string) => {
        if (!cnpj) return '';
        // Remove non-numeric characters
        const numericCNPJ = cnpj.replace(/\D/g, '');
        // Apply CNPJ mask: xx.xxx.xxx/xxxx-xx
        return numericCNPJ.replace(
            /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
            '$1.$2.$3/$4-$5'
        );
    };

    // Define columns for the DataTable
    const columns: Column<Cliente>[] = [
        {
            header: 'Nome',
            accessor: 'ds_nome',
            cellRenderer: (value) => (
                <div className="font-medium text-gray-900">{value}</div>
            )
        },
        {
            header: 'Razão Social',
            accessor: 'ds_razao_social',
            cellRenderer: (value) => (
                value ? (
                    <span className="text-gray-800">{value}</span>
                ) : (
                    <span className="text-gray-400 italic">Não informado</span>
                )
            )
        },
        {
            header: 'CNPJ',
            accessor: 'nr_cnpj',
            cellRenderer: (value) => (
                <span className="text-gray-700">{formatCNPJ(value)}</span>
            )
        },
        {
            header: 'Localização',
            accessor: (row) => (
                `${row.ds_cidade}/${row.ds_uf}`
            ),
            cellRenderer: (value) => (
                <span className="text-gray-700">{value}</span>
            )
        },
        {
            header: 'Contrato',
            accessor: 'ds_contrato',
            cellRenderer: (value) => (
                value ? (
                    <span className="text-gray-700">{value}</span>
                ) : (
                    <span className="text-gray-400 italic">Não informado</span>
                )
            )
        },
        {
            header: 'Tipo',
            accessor: (row) => (
                row.fl_matriz ? "Matriz" : "Filial"
            ),
            cellRenderer: (value) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value === "Matriz"
                    ? "bg-purple-100 text-purple-800 border border-purple-200"
                    : "bg-blue-100 text-blue-800 border border-blue-200"
                    }`}>
                    {value}
                </span>
            )
        },
        {
            header: 'Status',
            accessor: (row) => (
                row.fl_ativo ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                        Ativo
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                        Inativo
                    </span>
                )
            )
        }
    ];

    // Row actions
    const clienteActions = (cliente: Cliente) => (
        <>
            <motion.button
                onClick={() => {
                    setCurrentCliente(cliente);
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
                    setCurrentCliente(cliente);
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
    const renderMobileClienteCard = (cliente: Cliente) => (
        <div className="p-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-medium text-gray-900">{cliente.ds_nome}</h3>
                    <p className="text-sm text-gray-500 mt-1">{cliente.ds_razao_social}</p>
                </div>
                <div className="ml-2 flex flex-col gap-1">
                    {cliente.fl_ativo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <span className="w-1 h-1 bg-green-500 rounded-full mr-1"></span>
                            Ativo
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            <span className="w-1 h-1 bg-red-500 rounded-full mr-1"></span>
                            Inativo
                        </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cliente.fl_matriz
                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                        : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}>
                        {cliente.fl_matriz ? "Matriz" : "Filial"}
                    </span>
                </div>
            </div>

            <div className="mt-3 space-y-1.5">
                <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-gray-700">{formatCNPJ(cliente.nr_cnpj)}</span>
                </div>

                <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-700">{cliente.ds_cidade}/{cliente.ds_uf}</span>
                </div>

                {cliente.ds_contrato && (
                    <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-gray-700">{cliente.ds_contrato}</span>
                    </div>
                )}
            </div>

            {cliente.contatos && cliente.contatos.length > 0 && (
                <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-1">Contatos:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {cliente.contatos.map((contato) => (
                            <span
                                key={contato.id_contato}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100"
                            >
                                {contato.ds_nome}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end space-x-2">
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        setCurrentCliente(cliente);
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
                        setCurrentCliente(cliente);
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

    // Create new client handler
    const handleCreateNewClient = () => {
        setCurrentCliente(null);
        setModalMode('create');
        setFormData({
            ds_nome: '',
            ds_razao_social: '',
            nr_cnpj: '',
            fl_ativo: true,
            ds_endereco: '',
            ds_cep: '',
            ds_uf: '',
            ds_cidade: '',
            ds_bairro: '',
            nr_numero: '',
            fl_matriz: false,
            ds_situacao: 'Ativo'
        });
        setIsModalOpen(true);
    };

    return (
        <div className="p-1 sm:p-4 max-w-7xl mx-auto">
            {/* Page header with title and action button */}
            <PageHeader
                title="Clientes"
                description="Gerenciamento de clientes da Colet"
                actionButton={
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="bg-gradient-to-r from-[#09A08D] to-teal-500 text-white px-4 sm:px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-all w-full sm:w-auto justify-center font-medium"
                        onClick={handleCreateNewClient}
                    >
                        <Building2 size={18} />
                        <span>Novo Cliente</span>
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
                            placeholder="Buscar por nome, CNPJ ou site"
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
                <DataTable<Cliente>
                    data={filteredClientes}
                    columns={columns}
                    keyField="id_cliente"
                    isLoading={loading}
                    error={error}
                    rowActions={clienteActions}
                    mobileCardRenderer={renderMobileClienteCard}
                    animationEnabled={animateItems}
                    emptyState={{
                        title: "Nenhum cliente encontrado",
                        description: "Adicione um novo cliente ou ajuste os filtros de busca",
                        primaryAction: {
                            label: "Novo Cliente",
                            icon: <Building2 size={16} />,
                            onClick: handleCreateNewClient
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
                onClick={handleCreateNewClient}
            />

            {/* Modal components will be implemented later */}
        </div>
    );
}