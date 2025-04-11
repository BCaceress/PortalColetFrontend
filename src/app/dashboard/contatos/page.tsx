'use client';

import api from '@/services/api';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronDown, Edit, Eye, ListFilter, Search, Trash2, UserPlus, X } from 'lucide-react';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

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
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [animateItems, setAnimateItems] = useState(false);
    const filterMenuRef = useRef<HTMLDivElement>(null);
    const filterButtonRef = useRef<HTMLButtonElement>(null);

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

                // Trigamos a animação depois dos dados carregarem
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

    // Fechar menu de filtros ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterMenuRef.current &&
                filterButtonRef.current &&
                !filterMenuRef.current.contains(event.target as Node) &&
                !filterButtonRef.current.contains(event.target as Node)) {
                setShowFilterMenu(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;

        if (type === 'checkbox') {
            const checkbox = e.target as HTMLInputElement;
            setFormData({
                ...formData,
                [name]: checkbox.checked
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }

        // Clear validation error when field is edited
        if (formErrors[name as keyof ContactPayload]) {
            setFormErrors({
                ...formErrors,
                [name]: undefined
            });
        }
    };

    const handleClientSelection = (id: number) => {
        // Toggle client selection
        const updatedClients = formData.id_clientes.includes(id)
            ? formData.id_clientes.filter(clientId => clientId !== id)
            : [...formData.id_clientes, id];

        setFormData({
            ...formData,
            id_clientes: updatedClients
        });
    };

    const validateForm = () => {
        const errors: Partial<Record<keyof ContactPayload, string>> = {};

        if (!formData.ds_nome.trim()) {
            errors.ds_nome = 'Nome é obrigatório';
        }

        if (!formData.ds_email.trim()) {
            errors.ds_email = 'Email é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ds_email)) {
            errors.ds_email = 'Email inválido';
        }

        if (!formData.ds_telefone.trim()) {
            errors.ds_telefone = 'Telefone é obrigatório';
        } else if (!/^\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}$/.test(formData.ds_telefone)) {
            errors.ds_telefone = 'Telefone inválido. Formato: (00) 00000-0000';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async () => {
        if (modalMode === 'view') {
            handleCloseModal();
            return;
        }

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            if (modalMode === 'create') {
                // Create new contact
                const response = await api.post('/contatos', formData);
                const newContact = response.data;

                // Update contact list
                const updatedContacts = [...contacts, newContact];
                setContacts(updatedContacts);

                // Apply current filters
                filterContacts(searchTerm, statusFilter, whatsappFilter, clienteFilter);

            } else if (modalMode === 'edit' && currentContact) {
                // Update existing contact
                await api.put(`/contatos/${currentContact.id_contato}`, formData);

                // Get updated contact
                const response = await api.get(`/contatos/${currentContact.id_contato}`);
                const updatedContact = response.data;

                // Update contact list
                const updatedContacts = contacts.map(contact =>
                    contact.id_contato === currentContact.id_contato ? updatedContact : contact
                );
                setContacts(updatedContacts);

                // Apply current filters
                filterContacts(searchTerm, statusFilter, whatsappFilter, clienteFilter);
            }

            // Close modal
            handleCloseModal();

        } catch (err) {
            console.error('Erro ao salvar contato:', err);
            alert('Não foi possível salvar o contato. Tente novamente mais tarde.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenCreateModal = () => {
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
        setFormErrors({});
        setCurrentContact(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleView = async (id: number) => {
        try {
            const response = await api.get(`/contatos/${id}`);
            setCurrentContact(response.data);
            setFormData({
                ds_nome: response.data.ds_nome,
                ds_cargo: response.data.ds_cargo,
                fl_ativo: response.data.fl_ativo,
                tx_observacoes: response.data.tx_observacoes || '',
                ds_email: response.data.ds_email,
                ds_telefone: response.data.ds_telefone,
                fl_whatsapp: response.data.fl_whatsapp,
                id_clientes: response.data.clientes?.map((cliente: any) => cliente.id_cliente) || []
            });
            setModalMode('view');
            setIsModalOpen(true);
        } catch (err) {
            console.error('Erro ao buscar detalhes do contato:', err);
            alert('Não foi possível carregar os detalhes do contato. Tente novamente mais tarde.');
        }
    };

    const handleEdit = async (id: number) => {
        try {
            const response = await api.get(`/contatos/${id}`);
            setCurrentContact(response.data);
            setFormData({
                ds_nome: response.data.ds_nome,
                ds_cargo: response.data.ds_cargo,
                fl_ativo: response.data.fl_ativo,
                tx_observacoes: response.data.tx_observacoes || '',
                ds_email: response.data.ds_email,
                ds_telefone: response.data.ds_telefone,
                fl_whatsapp: response.data.fl_whatsapp,
                id_clientes: response.data.clientes?.map((cliente: any) => cliente.id_cliente) || []
            });
            setFormErrors({});
            setModalMode('edit');
            setIsModalOpen(true);
        } catch (err) {
            console.error('Erro ao buscar detalhes do contato:', err);
            alert('Não foi possível carregar os detalhes do contato. Tente novamente mais tarde.');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este contato?')) {
            try {
                await api.delete(`/contatos/${id}`);

                // Animação de fade-out antes de remover do estado
                const updatedContacts = contacts.filter(contact => contact.id_contato !== id);
                const updatedFilteredContacts = filteredContacts.filter(contact => contact.id_contato !== id);

                setContacts(updatedContacts);
                setFilteredContacts(updatedFilteredContacts);
            } catch (err) {
                console.error('Erro ao excluir contato:', err);
                alert('Não foi possível excluir o contato. Tente novamente mais tarde.');
            }
        }
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        filterContacts(term, statusFilter, whatsappFilter, clienteFilter);
    };

    const handleStatusFilter = (status: 'todos' | 'ativos' | 'inativos') => {
        setStatusFilter(status);
        filterContacts(searchTerm, status, whatsappFilter, clienteFilter);
        setShowFilterMenu(false);
    };

    const handleWhatsappFilter = (whatsapp: boolean | null) => {
        setWhatsappFilter(whatsapp);
        filterContacts(searchTerm, statusFilter, whatsapp, clienteFilter);
        setShowFilterMenu(false);
    };

    const handleClienteFilter = (clienteId: number | null) => {
        setClienteFilter(clienteId);
        filterContacts(searchTerm, statusFilter, whatsappFilter, clienteId);
        setShowFilterMenu(false);
    };

    const clearFilters = () => {
        setStatusFilter('todos');
        setWhatsappFilter(null);
        setClienteFilter(null);
        filterContacts(searchTerm, 'todos', null, null);
        setShowFilterMenu(false);
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

    // Contagem total de filtros ativos
    const activeFiltersCount = (statusFilter !== 'todos' ? 1 : 0) +
        (whatsappFilter !== null ? 1 : 0) +
        (clienteFilter !== null ? 1 : 0);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Cabeçalho com título e botão de adicionar */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Contatos</h1>
                    <p className="text-gray-500 mt-1">Gerencie sua lista de contatos</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-[#09A08D] to-teal-500 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:shadow-lg transition-shadow w-full md:w-auto justify-center font-medium"
                    onClick={handleOpenCreateModal}
                >
                    <UserPlus size={18} />
                    <span>Cadastrar Contato</span>
                </motion.button>
            </motion.div>

            {/* Card de pesquisa e filtros */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white rounded-xl shadow-md p-5 mb-6"
            >
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center flex-wrap">
                    <div className="relative flex-grow max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar contato por nome, email ou telefone..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#09A08D]/30 focus:border-transparent transition-all outline-none text-gray-800 bg-gray-50 focus:bg-white"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => handleSearch('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                <X size={16} className="text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>

                    {/* Botão de filtro */}
                    <div className="relative">
                        <button
                            ref={filterButtonRef}
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg border transition-all duration-200 
                                      ${activeFiltersCount > 0
                                    ? 'bg-[#09A08D]/10 border-[#09A08D]/30 text-[#09A08D]'
                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                        >
                            <ListFilter size={16} />
                            <span className="font-medium hidden sm:inline">Filtros</span>
                            {activeFiltersCount > 0 && (
                                <span className="bg-[#09A08D] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {activeFiltersCount}
                                </span>
                            )}
                            <ChevronDown size={16} className={`transition-transform duration-200 ${showFilterMenu ? 'transform rotate-180' : ''}`} />
                        </button>

                        {/* Menu de filtros */}
                        {showFilterMenu && (
                            <div
                                ref={filterMenuRef}
                                className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg py-3 z-20 border border-gray-100 animate-in slide-in-from-top-5 fade-in duration-200"
                            >
                                <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-medium text-gray-800">Filtros</h3>
                                    {activeFiltersCount > 0 && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-xs text-[#09A08D] hover:underline font-medium"
                                        >
                                            Limpar todos
                                        </button>
                                    )}
                                </div>

                                <div className="p-3 space-y-4">
                                    {/* Filtro de Status */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleStatusFilter('todos')}
                                                className={`px-3 py-1.5 rounded-md text-sm font-medium flex-1 transition-colors ${statusFilter === 'todos'
                                                    ? 'bg-gray-200 text-gray-800'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                Todos
                                            </button>
                                            <button
                                                onClick={() => handleStatusFilter('ativos')}
                                                className={`px-3 py-1.5 rounded-md text-sm font-medium flex-1 transition-colors ${statusFilter === 'ativos'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                Ativos
                                            </button>
                                            <button
                                                onClick={() => handleStatusFilter('inativos')}
                                                className={`px-3 py-1.5 rounded-md text-sm font-medium flex-1 transition-colors ${statusFilter === 'inativos'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                Inativos
                                            </button>
                                        </div>
                                    </div>

                                    {/* Filtro de WhatsApp */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleWhatsappFilter(null)}
                                                className={`px-3 py-1.5 rounded-md text-sm font-medium flex-1 transition-colors ${whatsappFilter === null
                                                    ? 'bg-gray-200 text-gray-800'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                Todos
                                            </button>
                                            <button
                                                onClick={() => handleWhatsappFilter(true)}
                                                className={`px-3 py-1.5 rounded-md text-sm font-medium flex-1 transition-colors ${whatsappFilter === true
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                Sim
                                            </button>
                                            <button
                                                onClick={() => handleWhatsappFilter(false)}
                                                className={`px-3 py-1.5 rounded-md text-sm font-medium flex-1 transition-colors ${whatsappFilter === false
                                                    ? 'bg-orange-100 text-orange-800'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                Não
                                            </button>
                                        </div>
                                    </div>

                                    {/* Filtro de Cliente */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                        <select
                                            value={clienteFilter === null ? 'todos' : clienteFilter}
                                            onChange={(e) =>
                                                handleClienteFilter(e.target.value === 'todos' ? null : Number(e.target.value))
                                            }
                                            className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#09A08D]/30 focus:border-transparent transition-all outline-none text-gray-700"
                                        >
                                            <option value="todos">Todos os clientes</option>
                                            {clientes.map((cliente) => (
                                                <option key={cliente.id_cliente} value={cliente.id_cliente}>
                                                    {cliente.ds_nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filtros aplicados exibidos como pílulas */}
                {activeFiltersCount > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mr-1 flex items-center">
                            Filtros aplicados:
                        </div>
                        {statusFilter !== 'todos' && (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusFilter === 'ativos' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                Status: {statusFilter === 'ativos' ? 'Ativo' : 'Inativo'}
                                <button
                                    onClick={() => handleStatusFilter('todos')}
                                    className="ml-1.5 hover:bg-white/20 rounded-full p-0.5"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        )}

                        {whatsappFilter !== null && (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${whatsappFilter ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                WhatsApp: {whatsappFilter ? 'Sim' : 'Não'}
                                <button
                                    onClick={() => handleWhatsappFilter(null)}
                                    className="ml-1.5 hover:bg-white/20 rounded-full p-0.5"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        )}

                        {clienteFilter !== null && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Cliente: {clientes.find(c => c.id_cliente === clienteFilter)?.ds_nome}
                                <button
                                    onClick={() => handleClienteFilter(null)}
                                    className="ml-1.5 hover:bg-white/20 rounded-full p-0.5"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        )}

                        <button
                            onClick={clearFilters}
                            className="text-xs text-[#09A08D] hover:underline font-medium ml-auto flex items-center"
                        >
                            <X size={14} className="mr-1" />
                            Limpar todos
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Tabela de contatos */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white rounded-xl shadow-md overflow-hidden"
            >
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#09A08D] mx-auto"></div>
                        <p className="mt-6 text-gray-600 font-medium">Carregando contatos...</p>
                    </div>
                ) : error ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-12 text-center flex flex-col items-center"
                    >
                        <AlertCircle size={48} className="text-red-500 mb-4" />
                        <p className="text-red-500 font-medium">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium"
                        >
                            Tentar novamente
                        </button>
                    </motion.div>
                ) : filteredContacts.length === 0 ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-12 text-center flex flex-col items-center"
                    >
                        <UserPlus size={48} className="text-gray-400 mb-4" />
                        <p className="text-gray-600 font-medium">Nenhum contato encontrado.</p>
                        <p className="text-gray-500 mt-2">Adicione um novo contato ou ajuste os filtros.</p>
                        <button
                            onClick={() => clearFilters()}
                            className="mt-4 px-4 py-2 bg-[#09A08D]/10 hover:bg-[#09A08D]/20 text-[#09A08D] rounded-lg transition-colors text-sm font-medium"
                        >
                            Limpar filtros
                        </button>
                    </motion.div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Telefone</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cargo</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Clientes</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredContacts.map((contact, index) => (
                                    <motion.tr
                                        key={contact.id_contato}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={animateItems ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                        className="hover:bg-gray-50/80 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900">{contact.ds_nome}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a href={`mailto:${contact.ds_email}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                                                {contact.ds_email}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <span className="text-gray-800">
                                                    <a href={`tel:${contact.ds_telefone.replace(/\D/g, '')}`} className="hover:text-blue-600 transition-colors">
                                                        {contact.ds_telefone}
                                                    </a>
                                                </span>
                                                {contact.fl_whatsapp && (
                                                    <span
                                                        className="ml-2 w-5 h-5 text-green-500 flex items-center justify-center"
                                                        title="WhatsApp disponível"
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M17.6 6.32A7.85 7.85 0 0 0 12.02 4c-4.42 0-8 3.58-8 8a8.03 8.03 0 0 0 1.08 4l-1.08 4 4.13-1.08A7.95 7.95 0 0 0 12.02 20c4.42 0 8-3.58 8-8 0-2.14-.83-4.14-2.28-5.64l-.14-.04zm-5.58 12.26c-1.2 0-2.38-.32-3.4-.92l-.24-.15-2.56.67.67-2.5-.16-.25a6.62 6.62 0 0 1-1.01-3.49c0-3.67 2.98-6.65 6.65-6.65 1.77 0 3.44.7 4.7 1.96a6.61 6.61 0 0 1 1.96 4.7c0 3.66-2.98 6.63-6.65 6.63h.04zm3.64-4.97c-.2-.1-1.18-.58-1.37-.65-.18-.07-.31-.1-.44.1-.13.2-.51.65-.63.78-.11.13-.23.15-.43.05-.6-.3-1.22-.55-1.75-1.2-.48-.45-.81-1.1-.9-1.28-.1-.18-.01-.28.07-.36.1-.12.19-.18.29-.29.1-.11.13-.19.2-.31.07-.13.03-.24-.01-.33-.4-.1-.18-.44-.24-.6-.07-.17-.13-.15-.19-.15h-.34a.63.63 0 0 0-.46.22c-.15.17-.59.57-.59 1.39 0 .82.6 1.62.68 1.73.08.1 1.22 1.96 3.02 2.66 1.8.71 1.8.47 2.13.44.32-.03 1.05-.43 1.2-.84.14-.42.14-.77.1-.84-.04-.08-.17-.12-.37-.21z"></path>
                                                        </svg>
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-800">{contact.ds_cargo}</td>
                                        <td className="px-6 py-4 text-gray-800">
                                            {contact.clientes && contact.clientes.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {contact.clientes.map((cliente) => (
                                                        <span
                                                            key={cliente.id_cliente}
                                                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                                                        >
                                                            {cliente.ds_nome}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm italic">Nenhum cliente</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {contact.fl_ativo ?
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                                                    Ativo
                                                </span> :
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                                                    Inativo
                                                </span>
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleView(contact.id_contato)}
                                                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Visualizar"
                                                >
                                                    <Eye size={18} />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleEdit(contact.id_contato)}
                                                    className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleDelete(contact.id_contato)}
                                                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </motion.button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Contact Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden flex flex-col"
                    >
                        {/* Modal header */}
                        <div className="flex justify-between items-center px-5 py-4 bg-gradient-to-r from-[#09A08D]/95 to-teal-500 text-white">
                            <h2 className="text-lg font-semibold">
                                {modalMode === 'create' ? 'Novo Contato' :
                                    modalMode === 'edit' ? 'Editar Contato' : 'Detalhes do Contato'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-white/80 hover:text-white rounded-full p-1 hover:bg-white/10 transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal content */}
                        <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-5">
                            <div className="space-y-5">
                                {/* Informações Principais - Layout compacto */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-gray-500">Informações Principais</h3>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="fl_ativo"
                                                name="fl_ativo"
                                                checked={formData.fl_ativo}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                className="w-4 h-4 text-[#09A08D] border-gray-300 rounded focus:ring-[#09A08D]/30"
                                            />
                                            <label htmlFor="fl_ativo" className="ml-2 text-xs font-medium text-gray-700">
                                                Contato ativo
                                            </label>
                                        </div>
                                    </div>

                                    {/* Nome e Cargo na mesma linha */}
                                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                                        <div className="sm:col-span-3">
                                            <label htmlFor="ds_nome" className="block text-sm font-medium text-gray-700 mb-1">
                                                Nome <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="ds_nome"
                                                name="ds_nome"
                                                value={formData.ds_nome}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                placeholder="Nome completo"
                                                className={`w-full px-3 py-2 border rounded-lg outline-none transition-all text-gray-900
                                                ${modalMode === 'view' ? 'bg-gray-50/80 text-gray-700' : 'focus:ring-2 focus:ring-[#09A08D]/20 focus:border-[#09A08D]'} 
                                                ${formErrors.ds_nome ? 'border-red-300 bg-red-50/50' : 'border-gray-300'}
                                                placeholder:text-gray-400`}
                                            />
                                            {formErrors.ds_nome && (
                                                <p className="mt-1 text-sm text-red-500">{formErrors.ds_nome}</p>
                                            )}
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label htmlFor="ds_cargo" className="block text-sm font-medium text-gray-700 mb-1">
                                                Cargo
                                            </label>
                                            <input
                                                type="text"
                                                id="ds_cargo"
                                                name="ds_cargo"
                                                value={formData.ds_cargo}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                placeholder="Cargo ou função"
                                                className={`w-full px-3 py-2 border rounded-lg outline-none transition-all text-gray-900
                                                ${modalMode === 'view' ? 'bg-gray-50/80 text-gray-700' : 'focus:ring-2 focus:ring-[#09A08D]/20 focus:border-[#09A08D]'} 
                                                border-gray-300 placeholder:text-gray-400`}
                                            />
                                        </div>
                                    </div>

                                    {/* Email e Telefone na mesma linha */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="ds_email" className="block text-sm font-medium text-gray-700 mb-1">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                id="ds_email"
                                                name="ds_email"
                                                value={formData.ds_email}
                                                onChange={handleInputChange}
                                                disabled={modalMode === 'view'}
                                                placeholder="email@exemplo.com"
                                                className={`w-full px-3 py-2 border rounded-lg outline-none transition-all text-gray-900
                                                ${modalMode === 'view' ? 'bg-gray-50/80 text-gray-700' : 'focus:ring-2 focus:ring-[#09A08D]/20 focus:border-[#09A08D]'} 
                                                ${formErrors.ds_email ? 'border-red-300 bg-red-50/50' : 'border-gray-300'}
                                                placeholder:text-gray-400`}
                                            />
                                            {formErrors.ds_email && (
                                                <p className="mt-1 text-sm text-red-500">{formErrors.ds_email}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="ds_telefone" className="block text-sm font-medium text-gray-700 mb-1">
                                                Telefone <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    id="ds_telefone"
                                                    name="ds_telefone"
                                                    value={formData.ds_telefone}
                                                    placeholder="(00) 00000-0000"
                                                    onChange={handleInputChange}
                                                    disabled={modalMode === 'view'}
                                                    className={`w-full px-3 py-2 border rounded-lg outline-none transition-all text-gray-900 pr-[105px]
                                                    ${modalMode === 'view' ? 'bg-gray-50/80 text-gray-700' : 'focus:ring-2 focus:ring-[#09A08D]/20 focus:border-[#09A08D]'} 
                                                    ${formErrors.ds_telefone ? 'border-red-300 bg-red-50/50' : 'border-gray-300'}
                                                    placeholder:text-gray-400`}
                                                />
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                                                    <div className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${formData.fl_whatsapp
                                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                                        : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M17.6 6.32A7.85 7.85 0 0 0 12.02 4c-4.42 0-8 3.58-8 8a8.03 8.03 0 0 0 1.08 4l-1.08 4 4.13-1.08A7.95 7.95 0 0 0 12.02 20c4.42 0 8-3.58 8-8 0-2.14-.83-4.14-2.28-5.64l-.14-.04z"></path>
                                                        </svg>
                                                        <input
                                                            type="checkbox"
                                                            id="fl_whatsapp"
                                                            name="fl_whatsapp"
                                                            checked={formData.fl_whatsapp}
                                                            onChange={handleInputChange}
                                                            disabled={modalMode === 'view'}
                                                            className="w-3 h-3 text-green-600 border-gray-300 rounded focus:ring-0"
                                                        />
                                                        <label htmlFor="fl_whatsapp" className="text-xs select-none cursor-pointer">
                                                            WhatsApp
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                            {formErrors.ds_telefone && (
                                                <p className="mt-1 text-sm text-red-500">{formErrors.ds_telefone}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Observações - Campo opcional */}
                                    <div>
                                        <div className="flex justify-between">
                                            <label htmlFor="tx_observacoes" className="block text-sm font-medium text-gray-700 mb-1">
                                                Observações
                                            </label>
                                            <span className="text-xs text-gray-400">Opcional</span>
                                        </div>
                                        <textarea
                                            id="tx_observacoes"
                                            name="tx_observacoes"
                                            rows={2}
                                            value={formData.tx_observacoes}
                                            onChange={handleInputChange}
                                            disabled={modalMode === 'view'}
                                            placeholder="Informações adicionais sobre o contato..."
                                            className={`w-full px-3 py-2 border rounded-lg outline-none transition-all text-gray-900 resize-none
                                            ${modalMode === 'view' ? 'bg-gray-50/80 text-gray-700' : 'focus:ring-2 focus:ring-[#09A08D]/20 focus:border-[#09A08D]'} 
                                            border-gray-300 placeholder:text-gray-400`}
                                        />
                                    </div>
                                </div>

                                {/* Associação de Clientes - Seção simplificada */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-gray-500">Clientes Associados</h3>
                                        {modalMode !== 'view' && formData.id_clientes.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, id_clientes: [] })}
                                                className="text-xs text-[#09A08D] hover:text-[#078275] font-medium"
                                            >
                                                Limpar seleção
                                            </button>
                                        )}
                                    </div>

                                    {clientes.length > 0 ? (
                                        <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                                            {/* Campo de busca de clientes */}
                                            {modalMode !== 'view' && (
                                                <div className="p-2 bg-gray-50 border-b border-gray-200 relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar cliente..."
                                                        value={clienteSearchTerm}
                                                        onChange={(e) => {
                                                            setClienteSearchTerm(e.target.value);
                                                            setFilteredClientes(
                                                                clientes.filter(cliente =>
                                                                    cliente.ds_nome.toLowerCase().includes(e.target.value.toLowerCase())
                                                                )
                                                            );
                                                        }}
                                                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-[#09A08D]/30 focus:border-[#09A08D] text-sm"
                                                    />
                                                    <div className="absolute right-[12px] top-1/2 -translate-y-1/2 text-gray-400">
                                                        <Search size={14} />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Lista de clientes - altura fixa para não crescer demais */}
                                            <div className="max-h-[180px] overflow-y-auto">
                                                {filteredClientes.length > 0 ? (
                                                    <div className="divide-y divide-gray-100">
                                                        {filteredClientes.map((cliente) => (
                                                            <div
                                                                key={cliente.id_cliente}
                                                                className={`flex items-center p-2.5 hover:bg-gray-50 transition-colors cursor-pointer
                                                                    ${formData.id_clientes.includes(cliente.id_cliente) ? 'bg-[#09A08D]/5' : ''}
                                                                `}
                                                                onClick={() => modalMode !== 'view' && handleClientSelection(cliente.id_cliente)}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    id={`cliente-${cliente.id_cliente}`}
                                                                    checked={formData.id_clientes.includes(cliente.id_cliente)}
                                                                    onChange={() => handleClientSelection(cliente.id_cliente)}
                                                                    disabled={modalMode === 'view'}
                                                                    className="w-4 h-4 text-[#09A08D] border-gray-300 rounded focus:ring-[#09A08D]/30"
                                                                    onClick={e => e.stopPropagation()}
                                                                />
                                                                <label
                                                                    htmlFor={`cliente-${cliente.id_cliente}`}
                                                                    className={`ml-2 text-sm cursor-pointer flex-grow truncate
                                                                        ${formData.id_clientes.includes(cliente.id_cliente) ? 'text-gray-900 font-medium' : 'text-gray-700'}
                                                                    `}
                                                                >
                                                                    {cliente.ds_nome}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-4 text-center text-sm text-gray-500 italic">
                                                        Nenhum cliente encontrado.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-2 p-3 text-sm text-gray-500 italic bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center">
                                            Nenhum cliente ativo disponível.
                                        </div>
                                    )}

                                    {/* Mostrar tags dos clientes selecionados */}
                                    {formData.id_clientes.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {formData.id_clientes.map(id => {
                                                const cliente = clientes.find(c => c.id_cliente === id);
                                                if (!cliente) return null;
                                                return (
                                                    <span
                                                        key={cliente.id_cliente}
                                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#09A08D]/10 text-[#09A08D] border border-[#09A08D]/20"
                                                    >
                                                        {cliente.ds_nome}
                                                        {modalMode !== 'view' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleClientSelection(cliente.id_cliente)}
                                                                className="ml-1.5 hover:bg-[#09A08D]/20 rounded-full p-0.5"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="flex justify-end items-center gap-2 p-4 border-t border-gray-200 bg-gray-50 mt-auto">
                            <button
                                onClick={handleCloseModal}
                                className="px-3.5 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                {modalMode === 'view' ? 'Fechar' : 'Cancelar'}
                            </button>

                            {modalMode !== 'view' && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-[#09A08D] to-teal-500 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-70"
                                >
                                    {isSubmitting && (
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                    {modalMode === 'create' ? 'Salvar Contato' : 'Atualizar Contato'}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}