'use client';

import api from '@/services/api';
import { motion } from 'framer-motion';
import { Edit, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

// Import our components
import { ContactFormModal } from '@/components/modals/ContactFormModal';
import { ActiveFilters } from '@/components/ui/ActiveFilters';
import { Column, DataTable } from '@/components/ui/DataTable';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';

// Define the contact type
interface Contact {
    id_contato: number;
    ds_nome: string;
    ds_cargo: string;
    fl_ativo: boolean;
    tx_observacoes: string;
    ds_email: string;
    ds_telefone: string;
    fl_whatsapp: boolean;
    clientes: {
        id_cliente: number;
        ds_nome: string;
    }[];
}

// Interface for new contact request payload
interface ContactPayload {
    ds_nome: string;
    ds_cargo: string;
    fl_ativo: boolean;
    tx_observacoes: string;
    ds_email: string;
    ds_telefone: string;
    fl_whatsapp: boolean;
    id_clientes: number[];
}

// Modal mode type
type ModalMode = 'create' | 'edit' | 'view';

export default function Contatos() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');
    const [whatsappFilter, setWhatsappFilter] = useState<boolean | null>(null);
    const [clienteFilter, setClienteFilter] = useState<number | null>(null);
    const [clientes, setClientes] = useState<{ id_cliente: number, ds_nome: string }[]>([]);
    const [animateItems, setAnimateItems] = useState(false);

    // Estado para busca de clientes no modal
    const [clienteSearchTerm, setClienteSearchTerm] = useState('');
    const [filteredClientes, setFilteredClientes] = useState<{ id_cliente: number, ds_nome: string }[]>([]);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('create');
    const [currentContact, setCurrentContact] = useState<Contact | null>(null);
    const [formData, setFormData] = useState<ContactPayload>({
        ds_nome: '',
        ds_cargo: '',
        fl_ativo: true,
        tx_observacoes: '',
        ds_email: '',
        ds_telefone: '',
        fl_whatsapp: false,
        id_clientes: []
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof ContactPayload, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                setLoading(true);
                const response = await api.get('/contatos');
                setContacts(response.data);
                setFilteredContacts(response.data);
                setError(null);

                // Acionamos a animação depois dos dados carregarem
                setTimeout(() => setAnimateItems(true), 100);
            } catch (err) {
                console.error('Erro ao buscar contatos:', err);
                setError('Não foi possível carregar os contatos. Tente novamente mais tarde.');
            } finally {
                setLoading(false);
            }
        };

        const fetchClientes = async () => {
            try {
                // Alterado para buscar apenas os clientes ativos
                const response = await api.get('/clientes/lista/ativos');
                setClientes(response.data);
                setFilteredClientes(response.data);
            } catch (err) {
                console.error('Erro ao buscar clientes ativos:', err);
            }
        };

        fetchContacts();
        fetchClientes();
    }, []);

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        filterContacts(term, statusFilter, whatsappFilter, clienteFilter);
    };

    const handleStatusFilter = (status: 'todos' | 'ativos' | 'inativos') => {
        setStatusFilter(status);
        filterContacts(searchTerm, status, whatsappFilter, clienteFilter);
    };

    const handleWhatsappFilter = (whatsapp: boolean | null) => {
        setWhatsappFilter(whatsapp);
        filterContacts(searchTerm, statusFilter, whatsapp, clienteFilter);
    };

    const handleClienteFilter = (clienteId: number | null) => {
        setClienteFilter(clienteId);
        filterContacts(searchTerm, statusFilter, whatsappFilter, clienteId);
    };

    const clearFilters = () => {
        setStatusFilter('todos');
        setWhatsappFilter(null);
        setClienteFilter(null);
        filterContacts(searchTerm, 'todos', null, null);
    };

    const filterContacts = (term: string, status: 'todos' | 'ativos' | 'inativos', whatsapp: boolean | null, clienteId: number | null) => {
        // Disparamos a animação de fade-out
        setAnimateItems(false);

        setTimeout(() => {
            let filtered = contacts;

            if (term) {
                filtered = filtered.filter(contact =>
                    contact.ds_nome.toLowerCase().includes(term.toLowerCase()) ||
                    contact.ds_email.toLowerCase().includes(term.toLowerCase()) ||
                    contact.ds_telefone.includes(term)
                );
            }

            if (status !== 'todos') {
                filtered = filtered.filter(contact => (status === 'ativos' ? contact.fl_ativo : !contact.fl_ativo));
            }

            if (whatsapp !== null) {
                filtered = filtered.filter(contact => contact.fl_whatsapp === whatsapp);
            }

            if (clienteId !== null) {
                filtered = filtered.filter(contact =>
                    contact.clientes &&
                    contact.clientes.some(cliente => cliente.id_cliente === clienteId)
                );
            }

            setFilteredContacts(filtered);
            // Disparamos a animação de fade-in após os filtros serem aplicados
            setTimeout(() => setAnimateItems(true), 100);
        }, 200);
    };

    // Create active filters array for the ActiveFilters component
    const activeFilters = [
        ...(statusFilter !== 'todos' ? [{
            id: 'status',
            label: statusFilter === 'ativos' ? 'Ativo' : 'Inativo',
            type: 'status' as const,
            onRemove: () => handleStatusFilter('todos')
        }] : []),
        ...(whatsappFilter !== null ? [{
            id: 'whatsapp',
            label: whatsappFilter ? 'WhatsApp' : 'Sem WhatsApp',
            type: 'feature' as const,
            onRemove: () => handleWhatsappFilter(null)
        }] : []),
        ...(clienteFilter !== null ? [{
            id: 'cliente',
            label: clientes.find(c => c.id_cliente === clienteFilter)?.ds_nome || 'Cliente',
            type: 'relation' as const,
            onRemove: () => handleClienteFilter(null)
        }] : [])
    ];

    // Create filter configurations for the FilterPanel component
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
            name: 'WhatsApp',
            type: 'toggle' as const,
            options: [
                { id: 'todos', label: 'Todos', value: null },
                { id: 'sim', label: 'Sim', value: true },
                { id: 'nao', label: 'Não', value: false }
            ],
            currentValue: whatsappFilter,
            onChange: handleWhatsappFilter
        },
        {
            name: 'Cliente',
            type: 'select' as const,
            options: [
                { id: 'todos', label: 'Todos os clientes', value: null },
                ...clientes.map(cliente => ({
                    id: cliente.id_cliente.toString(),
                    label: cliente.ds_nome,
                    value: cliente.id_cliente
                }))
            ],
            currentValue: clienteFilter,
            onChange: handleClienteFilter
        }
    ];

    // Define columns for DataTable
    const columns: Column<Contact>[] = [
        {
            header: 'Nome',
            accessor: 'ds_nome',
            cellRenderer: (value) => (
                <div className="font-medium text-gray-900">{value}</div>
            )
        },
        {
            header: 'Email',
            accessor: 'ds_email',
            cellRenderer: (value) => (
                <a href={`mailto:${value}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                    {value}
                </a>
            )
        },
        {
            header: 'Telefone',
            accessor: (row) => (
                <div className="flex items-center">
                    <span className="text-gray-800">
                        <a href={`tel:${row.ds_telefone.replace(/\D/g, '')}`} className="hover:text-blue-600 transition-colors">
                            {row.ds_telefone}
                        </a>
                    </span>
                    {row.fl_whatsapp && (
                        <span
                            className="ml-2 w-5 h-5 text-green-500 flex items-center justify-center"
                            title="WhatsApp disponível"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.6 6.32A7.85 7.85 0 0 0 12.02 4c-4.42 0-8 3.58-8 8a8.03 8.03 0 0 0 1.08 4l-1.08 4 4.13-1.08A7.95 7.95 0 0 0 12.02 20c4.42 0 8-3.58 8-8 0-2.14-.83-4.14-2.28-5.64l-.14-.04z"></path>
                            </svg>
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Cargo',
            accessor: 'ds_cargo',
            cellRenderer: (value) => (
                value ? (
                    <span className="text-gray-800">{value}</span>
                ) : (
                    <span className="text-gray-400 italic">Não informado</span>
                )
            )
        },
        {
            header: 'Clientes',
            accessor: (row) => {
                if (!row.clientes || row.clientes.length === 0) {
                    return (
                        <span className="text-gray-400 text-sm italic">Nenhum cliente</span>
                    );
                }

                return (
                    <div className="flex flex-wrap gap-1">
                        {row.clientes.length > 1 ? (
                            <>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                    {row.clientes[0].ds_nome}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                    +{row.clientes.length - 1}
                                </span>
                            </>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                {row.clientes[0].ds_nome}
                            </span>
                        )}
                    </div>
                );
            }
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
    const contactActions = (contact: Contact) => (
        <>
            <motion.button
                onClick={() => {
                    setCurrentContact(contact);
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
                    setCurrentContact(contact);
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
    const renderMobileContactCard = (contact: Contact) => (
        <div className="p-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-medium text-gray-900">{contact.ds_nome}</h3>
                    <p className="text-sm text-gray-500 mt-1">{contact.ds_cargo || "Sem cargo"}</p>
                </div>
                <div className="ml-2">
                    {contact.fl_ativo ? (
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
                </div>
            </div>

            <div className="mt-3 space-y-1.5">
                <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href={`mailto:${contact.ds_email}`} className="text-blue-600 hover:underline">
                        {contact.ds_email}
                    </a>
                </div>
                <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div className="flex items-center">
                        <a href={`tel:${contact.ds_telefone.replace(/\D/g, '')}`} className="text-gray-700">
                            {contact.ds_telefone}
                        </a>
                        {contact.fl_whatsapp && (
                            <span className="ml-2 text-green-500 flex items-center">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.6 6.32A7.85 7.85 0 0 0 12.02 4c-4.42 0-8 3.58-8 8a8.03 8.03 0 0 0 1.08 4l-1.08 4 4.13-1.08A7.95 7.95 0 0 0 12.02 20c4.42 0 8-3.58 8-8 0-2.14-.83-4.14-2.28-5.64l-.14-.04z"></path>
                                </svg>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {contact.clientes && contact.clientes.length > 0 && (
                <div className="mt-3">
                    <div className="flex flex-wrap gap-1 mt-1">
                        {contact.clientes.map((cliente) => (
                            <span
                                key={cliente.id_cliente}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                            >
                                {cliente.ds_nome}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end space-x-2">
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        setCurrentContact(contact);
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
                        setCurrentContact(contact);
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

    // Create new contact handler
    const handleCreateNewContact = () => {
        setCurrentContact(null);
        setModalMode('create');
        setFormData({
            ds_nome: '',
            ds_cargo: '',
            fl_ativo: true,
            tx_observacoes: '',
            ds_email: '',
            ds_telefone: '',
            fl_whatsapp: false,
            id_clientes: []
        });
        setIsModalOpen(true);
    };

    // Display full-screen loading spinner while data is being loaded initially
    if (loading && contacts.length === 0) {
        return <LoadingSpinner fullScreen text="Carregando contatos..." />;
    }

    return (
        <div className="p-1 sm:p-4 max-w-7xl mx-auto">
            {/* Page header with title and action button */}
            <PageHeader
                title="Contatos"
                description="Gerenciamento de contatos"
                actionButton={
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="bg-gradient-to-r from-[#09A08D] to-teal-500 text-white px-4 sm:px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-all w-full sm:w-auto justify-center font-medium"
                        onClick={handleCreateNewContact}
                    >
                        <UserPlus size={18} />
                        <span>Novo Contato</span>
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
                            placeholder="Buscar por nome, email ou telefone"
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
                <DataTable<Contact>
                    data={filteredContacts}
                    columns={columns}
                    keyField="id_contato"
                    isLoading={loading}
                    error={error}
                    loadingComponent={<LoadingSpinner size="medium" color="primary" text="Carregando..." />}
                    rowActions={contactActions}
                    mobileCardRenderer={renderMobileContactCard}
                    animationEnabled={animateItems}
                    emptyState={{
                        title: "Nenhum contato encontrado",
                        description: "Adicione um novo contato ou ajuste os filtros de busca",
                        primaryAction: {
                            label: "Novo Contato",
                            icon: <UserPlus size={16} />,
                            onClick: handleCreateNewContact
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
                icon={<UserPlus size={24} />}
                onClick={handleCreateNewContact}
            />

            {/* Contact modal */}
            <ContactFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                modalMode={modalMode}
                currentContact={currentContact ? {
                    id_contato: currentContact.id_contato,
                    nome: currentContact.ds_nome,
                    email: currentContact.ds_email,
                    telefone: currentContact.ds_telefone,
                    empresa: currentContact.clientes?.[0]?.ds_nome || '',
                    cargo: currentContact.ds_cargo,
                    fl_ativo: currentContact.fl_ativo
                } : null}
                onSuccess={(message) => {
                    // Mostrar notificação de sucesso (pode ser implementado depois)
                    console.log(message);

                    // Recarregar os dados
                    const fetchContacts = async () => {
                        try {
                            setLoading(true);
                            const response = await api.get('/contatos');
                            setContacts(response.data);
                            setFilteredContacts(response.data);
                            setError(null);
                        } catch (err) {
                            console.error('Erro ao buscar contatos:', err);
                            setError('Não foi possível carregar os contatos. Tente novamente mais tarde.');
                        } finally {
                            setLoading(false);
                        }
                    };

                    fetchContacts();
                }}
                onError={(message) => {
                    // Mostrar notificação de erro (pode ser implementado depois)
                    console.error(message);
                }}
            />
        </div>
    );
}