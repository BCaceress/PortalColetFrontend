'use client';

import { EmailFormModal } from '@/components/modals/EmailFormModal';
import api from '@/services/api';
import { ClientePayload } from '@/types/cliente';
import { formatCEP, formatCNPJ } from '@/utils/formatters';
import {
    AlertCircle,
    ArrowLeft,
    AtSign,
    Building2,
    Download,
    Edit3,
    ExternalLink,
    Globe,
    Mail,
    MapPin,
    MoreHorizontal,
    Phone,
    Plus,
    RefreshCw,
    Smartphone,
    Users
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Interface for client emails
interface ClienteEmail {
    id_email?: number;
    id_cliente: number;
    ds_email: string;
    ds_tipo: string;
    fl_ativo: boolean;
    ds_descricao?: string;
}

// Modal mode type
type ModalMode = 'create' | 'edit';

export default function VisualizarCliente() {
    const router = useRouter();
    const params = useParams();
    const clienteId = params.id;

    // States
    const [cliente, setCliente] = useState<ClientePayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('identificacao');
    const [clienteEmails, setClienteEmails] = useState<ClienteEmail[]>([]);
    const [loadingEmails, setLoadingEmails] = useState(false);

    // Email modal state
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailModalMode, setEmailModalMode] = useState<ModalMode>('create');
    const [currentEmail, setCurrentEmail] = useState<ClienteEmail | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        const fetchClienteData = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/clientes/${clienteId}`);
                setCliente(response.data);
                setError(null);
            } catch (err) {
                console.error('Erro ao carregar dados do cliente:', err);
                setError('Não foi possível carregar os dados do cliente. Tente novamente mais tarde.');
            } finally {
                setLoading(false);
            }
        };

        if (clienteId) {
            fetchClienteData();
        }
    }, [clienteId]);

    // Fetch client emails when the emails tab is selected
    useEffect(() => {
        if (activeTab === 'emails' && clienteId) {
            fetchClienteEmails();
        }
    }, [activeTab, clienteId]);

    // Function to fetch client emails
    const fetchClienteEmails = async () => {
        if (!clienteId) return;

        try {
            setLoadingEmails(true);
            const response = await api.get(`/clientes/${clienteId}/emails`);
            setClienteEmails(response.data);
        } catch (err) {
            console.error('Erro ao carregar emails do cliente:', err);
            setNotification({
                type: 'error',
                message: 'Não foi possível carregar os emails do cliente.'
            });
        } finally {
            setLoadingEmails(false);
        }
    };

    // Handle adding a new email
    const handleAddEmail = () => {
        setCurrentEmail(null);
        setEmailModalMode('create');
        setIsEmailModalOpen(true);
    };

    // Handle editing an existing email
    const handleEditEmail = (email: ClienteEmail) => {
        setCurrentEmail(email);
        setEmailModalMode('edit');
        setIsEmailModalOpen(true);
    };

    // Handle deleting an email
    const handleDeleteEmail = async (emailId: number) => {
        if (!window.confirm('Tem certeza que deseja excluir este email?')) {
            return;
        }

        try {
            await api.delete(`/clientes/emails/${emailId}`);
            setNotification({
                type: 'success',
                message: 'Email excluído com sucesso!'
            });
            fetchClienteEmails();
        } catch (err) {
            console.error('Erro ao excluir email:', err);
            setNotification({
                type: 'error',
                message: 'Erro ao excluir o email. Tente novamente.'
            });
        }
    };

    // Modal success handler
    const handleModalSuccess = (message: string) => {
        setNotification({
            type: 'success',
            message
        });

        // Refresh emails list
        fetchClienteEmails();

        // Auto-hide notification after 3 seconds
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    // Modal error handler
    const handleModalError = (message: string) => {
        setNotification({
            type: 'error',
            message
        });

        // Auto-hide notification after 3 seconds
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    const handleEdit = () => {
        router.push(`/dashboard/clientes/editar/${clienteId}`);
    };

    const handleBack = () => {
        router.push('/dashboard/clientes');
    };

    // Format currency display
    const formatCurrency = (value: number | undefined): string => {
        if (value === undefined) return '-';
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    // Handle loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full bg-blue-50 opacity-50 animate-ping"></div>
                        <RefreshCw size={36} className="absolute inset-0 m-auto text-blue-600 animate-spin" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium">Carregando dados do cliente...</p>
                </div>
            </div>
        );
    }

    // Handle error state
    if (error) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="flex flex-col items-center space-y-5 text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                        <AlertCircle size={40} className="text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar cliente</h2>
                        <p className="text-gray-600">{error}</p>
                    </div>
                    <button
                        onClick={handleBack}
                        className="mt-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
                    >
                        <ArrowLeft size={18} />
                        <span>Voltar para lista de clientes</span>
                    </button>
                </div>
            </div>
        );
    }

    // Handle no data state
    if (!cliente) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="flex flex-col items-center space-y-5 text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
                        <AlertCircle size={40} className="text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Cliente não encontrado</h2>
                        <p className="text-gray-600">Não foi possível encontrar os dados do cliente solicitado.</p>
                    </div>
                    <button
                        onClick={handleBack}
                        className="mt-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
                    >
                        <ArrowLeft size={18} />
                        <span>Voltar para lista de clientes</span>
                    </button>
                </div>
            </div>
        );
    }

    // Status badge color helper
    const getStatusColor = (status: string | undefined) => {
        if (!status) return 'bg-gray-100 text-gray-800';

        if (status === 'Ativo' || status === 'Produção')
            return 'bg-emerald-100 text-emerald-800';
        if (status === 'Implantação')
            return 'bg-blue-100 text-blue-800';
        if (status === 'Restrição')
            return 'bg-amber-100 text-amber-800';
        if (status === 'Inativo')
            return 'bg-red-100 text-red-800';

        return 'bg-gray-100 text-gray-800';
    };

    const getTabIcon = (tab: string) => {
        switch (tab) {
            case 'identificacao':
                return <Building2 size={18} />;
            case 'endereco':
                return <MapPin size={18} />;
            case 'contrato':
                return <FileIcon size={18} />;
            case 'alfasig':
                return <DatabaseIcon size={18} />;
            case 'emails':
                return <Mail size={18} />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            {/* Page header with breadcrumbs */}
            <div className="sticky top-0 z-20 backdrop-blur-sm">
                <header className="bg-white/90 border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center">
                                <button
                                    onClick={handleBack}
                                    className="mr-4 text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition-all"
                                    title="Voltar"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <nav className="text-sm text-gray-500 flex items-center space-x-2 mb-1">
                                        <button onClick={handleBack} className="hover:text-blue-600 transition-colors">Clientes</button>
                                        <span>/</span>
                                        <span className="text-gray-700 font-medium">{cliente.ds_nome || 'Detalhes'}</span>
                                    </nav>
                                    <h1 className="text-xl font-bold text-gray-900 leading-tight">Detalhes do Cliente</h1>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="relative group">
                                    <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                                        <MoreHorizontal size={20} />
                                    </button>
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform scale-95 group-hover:scale-100 origin-top-right z-50">
                                        <div className="py-1">
                                            <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left" onClick={handleEdit}>
                                                <Edit3 size={16} className="mr-3 text-gray-500" />
                                                Editar Cliente
                                            </button>
                                            <button className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                                                <Download size={16} className="mr-3 text-gray-500" />
                                                Exportar Dados
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleEdit}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    <Edit3 size={16} className="mr-2" /> Editar
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
            </div>

            {/* Client profile header */}
            <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex-shrink-0">
                            <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-white/20">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Building2 size={50} className="text-white/70" />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold truncate">{cliente.ds_nome}</h2>
                                    <p className="text-blue-100 truncate">{cliente.ds_razao_social}</p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <span className={`rounded-full px-4 py-1 text-sm font-medium shadow ${getStatusColor(cliente.ds_situacao)}`}>
                                        {cliente.ds_situacao}
                                    </span>
                                    <span className={`rounded-full px-4 py-1 text-sm font-medium shadow bg-white/90 text-blue-800`}>
                                        {cliente.fl_matriz ? 'Matriz' : 'Filial'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-blue-50">
                                <div className="flex items-center">
                                    <div className="mr-2 bg-white/10 rounded-full w-7 h-7 flex items-center justify-center backdrop-blur-sm">
                                        <MapPin size={14} className="text-blue-100" />
                                    </div>
                                    <span>{cliente.ds_cidade}/{cliente.ds_uf}</span>
                                </div>

                                <div className="flex items-center">
                                    <div className="mr-2 bg-white/10 rounded-full w-7 h-7 flex items-center justify-center backdrop-blur-sm">
                                        <Phone size={14} className="text-blue-100" />
                                    </div>
                                    <span>CNPJ: {formatCNPJ(cliente.nr_cnpj)}</span>
                                </div>

                                {cliente.ds_sistema && (
                                    <div className="flex items-center">
                                        <div className="mr-2 bg-white/10 rounded-full w-7 h-7 flex items-center justify-center backdrop-blur-sm">
                                            <Smartphone size={14} className="text-blue-100" />
                                        </div>
                                        <span>Sistema: {cliente.ds_sistema}</span>
                                    </div>
                                )}

                                {cliente.ds_site && (
                                    <a
                                        href={cliente.ds_site.startsWith('http') ? cliente.ds_site : `http://${cliente.ds_site}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center hover:text-white transition-colors"
                                    >
                                        <div className="mr-2 bg-white/10 rounded-full w-7 h-7 flex items-center justify-center backdrop-blur-sm">
                                            <Globe size={14} className="text-blue-100" />
                                        </div>
                                        <span className="underline underline-offset-2">{cliente.ds_site}</span>
                                        <ExternalLink size={12} className="ml-1" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Navigation tabs */}
            <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
                <div className="max-w-7xl mx-auto">
                    <nav className="flex overflow-x-auto">
                        {['identificacao', 'endereco', 'contrato', 'alfasig', 'emails'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-6 text-sm font-semibold border-b-2 transition-all duration-200 focus:outline-none flex items-center space-x-2 ${activeTab === tab
                                    ? 'border-blue-600 text-blue-700 bg-blue-50'
                                    : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-gray-50'} `}
                            >
                                {getTabIcon(tab)}
                                <span>
                                    {tab === 'identificacao' && 'Identificação'}
                                    {tab === 'endereco' && 'Endereço'}
                                    {tab === 'contrato' && 'Contrato'}
                                    {tab === 'alfasig' && 'Alfasig'}
                                    {tab === 'emails' && 'E-mails'}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    <div className={`p-4 rounded-lg border flex items-center ${notification.type === 'success'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
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

            {/* Content */}
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Identification Tab */}
                {activeTab === 'identificacao' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* General Information Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-5 border-b border-gray-100 pb-3">
                                <Building2 size={18} className="mr-2 text-blue-600" />
                                Informações Gerais
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <DataItem label="Nome Fantasia" value={cliente.ds_nome} />
                                <DataItem label="Razão Social" value={cliente.ds_razao_social} />
                                <DataItem label="CNPJ" value={formatCNPJ(cliente.nr_cnpj)} />
                                <DataItem label="Inscrição Estadual" value={cliente.nr_inscricao_estadual} />
                                <DataItem label="Status" value={cliente.ds_situacao} className={`font-medium ${cliente.ds_situacao === 'Ativo' ? 'text-emerald-600' : cliente.ds_situacao === 'Inativo' ? 'text-red-600' : 'text-amber-600'}`} />
                                <DataItem label="Tipo" value={cliente.fl_matriz ? 'Matriz' : 'Filial'} />
                                <DataItem label="Site" value={cliente.ds_site ? (
                                    <a href={cliente.ds_site.startsWith('http') ? cliente.ds_site : `http://${cliente.ds_site}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline underline-offset-2 flex items-center">
                                        {cliente.ds_site} <ExternalLink size={14} className="ml-1" />
                                    </a>
                                ) : null} />
                                <DataItem label="Código IBGE" value={cliente.nr_codigo_ibge} />
                            </div>
                        </div>

                        {/* Contacts Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all">
                            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                    <Users size={18} className="mr-2 text-blue-600" />
                                    Contatos
                                </h3>
                                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                                    <Plus size={16} className="mr-1" />
                                    Adicionar Contato
                                </button>
                            </div>

                            {cliente.contatos && cliente.contatos.length > 0 ? (
                                <div className="space-y-4">
                                    {cliente.contatos.map(contato => (
                                        <div key={contato.id_contato} className="border border-gray-200 p-3 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                                            <div className="flex justify-between">
                                                <h4 className="font-medium text-gray-900">{contato.ds_nome}</h4>
                                                <div className="space-x-1">
                                                    <button className="text-blue-600 hover:text-blue-800 p-1">
                                                        <Edit3 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            {contato.ds_cargo && (
                                                <p className="text-sm text-gray-600">{contato.ds_cargo}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-300 rounded-lg">
                                    <Users size={32} className="text-gray-400 mb-3" />
                                    <p className="text-gray-500 mb-2">Nenhum contato cadastrado</p>
                                    <p className="text-gray-400 text-sm mb-4">Adicione contatos para este cliente para facilitar a comunicação.</p>
                                    <button className="flex items-center px-4 py-2 text-sm font-medium rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50">
                                        <Plus size={16} className="mr-1.5" />
                                        Adicionar Primeiro Contato
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Observations Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-5 border-b border-gray-100 pb-3">
                                <DocumentIcon size={18} className="mr-2 text-blue-600" />
                                Observações
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                {cliente.tx_observacao_ident ? (
                                    <p className="text-gray-700 whitespace-pre-wrap">{cliente.tx_observacao_ident}</p>
                                ) : (
                                    <p className="text-gray-500 italic">Nenhuma observação registrada</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Address Tab */}
                {activeTab === 'endereco' && (
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-5 border-b border-gray-100 pb-3">
                                <MapPin size={18} className="mr-2 text-blue-600" />
                                Endereço
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <DataItem label="Endereço" value={`${cliente.ds_endereco}, ${cliente.nr_numero}${cliente.ds_complemento ? `, ${cliente.ds_complemento}` : ''}`} />
                                </div>
                                <DataItem label="Bairro" value={cliente.ds_bairro} />
                                <DataItem label="CEP" value={formatCEP(cliente.ds_cep)} />
                                <DataItem label="Cidade" value={cliente.ds_cidade} />
                                <DataItem label="Estado" value={cliente.ds_uf} />
                                <DataItem label="Região" value={cliente.ds_regiao || '-'} />

                                {(cliente.nr_latitude && cliente.nr_longitude) && (
                                    <div className="col-span-2 mt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-medium text-gray-900">Localização no Mapa</h4>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${cliente.nr_latitude},${cliente.nr_longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                            >
                                                Ver no Google Maps
                                                <ExternalLink size={14} className="ml-1" />
                                            </a>
                                        </div>
                                        <div className="h-48 sm:h-64 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden relative">
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                                <MapPin size={24} className="mb-2" />
                                                <p className="text-sm">Mapa disponível no Google Maps</p>
                                                <div className="mt-2 text-xs">
                                                    <span className="block">Latitude: {cliente.nr_latitude}</span>
                                                    <span>Longitude: {cliente.nr_longitude}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Contract Tab */}
                {activeTab === 'contrato' && (
                    <div className="grid grid-cols-1 gap-6">
                        {/* Contract Information Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-5 border-b border-gray-100 pb-3">
                                <FileIcon size={18} className="mr-2 text-blue-600" />
                                Informações de Contrato
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <DataItem label="Sistema" value={cliente.ds_sistema} />
                                <DataItem label="Contrato" value={cliente.ds_contrato} />
                                <DataItem
                                    label="Data do Contrato"
                                    value={cliente.dt_data_contrato ? new Date(cliente.dt_data_contrato).toLocaleDateString('pt-BR') : '-'}
                                />

                                <DataItem label="Técnica Remota" value={cliente.nr_tecnica_remoto !== undefined ? `${cliente.nr_tecnica_remoto} horas` : '-'} />
                                <DataItem label="Técnica Presencial" value={cliente.nr_tecnica_presencial !== undefined ? `${cliente.nr_tecnica_presencial} horas` : '-'} />
                                <DataItem label="Tempo Mínimo" value={cliente.tm_minimo_horas} />

                                <DataItem label="Nomeados" value={cliente.nr_nomeados} />
                                <DataItem label="Simultâneos" value={cliente.nr_simultaneos} />
                                <DataItem label="Diário de Viagem" value={cliente.ds_diario_viagem || '-'} />

                                <div className="col-span-3 mt-4">
                                    <h4 className="font-medium text-gray-900 mb-2">Observações do Contrato</h4>
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        {cliente.tx_observacao_contrato ? (
                                            <p className="text-gray-700 whitespace-pre-wrap">{cliente.tx_observacao_contrato}</p>
                                        ) : (
                                            <p className="text-gray-500 italic">Nenhuma observação contratual registrada</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Alfasig Tab */}
                {activeTab === 'alfasig' && (
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center mb-5 border-b border-gray-100 pb-3">
                                <DatabaseIcon size={18} className="mr-2 text-blue-600" />
                                Informações Alfasig
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <DataItem label="Código ZZ" value={cliente.nr_codigo_zz} />
                                <DataItem label="Franquia NF" value={cliente.nr_franquia_nf} />
                                <DataItem label="Quantidade de Documentos" value={cliente.nr_qtde_documentos} />

                                <DataItem
                                    label="Valor da Franquia"
                                    value={cliente.nr_valor_franqia !== undefined ? formatCurrency(cliente.nr_valor_franqia) : '-'}
                                />
                                <DataItem
                                    label="Valor Excedente"
                                    value={cliente.nr_valor_excendente !== undefined ? formatCurrency(cliente.nr_valor_excendente) : '-'}
                                />
                                <DataItem
                                    label="Distância (km)"
                                    value={cliente.nr_distancia_km !== undefined ? `${cliente.nr_distancia_km} km` : '-'}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Emails Tab */}
                {activeTab === 'emails' && (
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-5">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                    <Mail size={20} className="mr-2 text-blue-600" />
                                    E-mails do Cliente
                                </h3>
                                <button
                                    onClick={handleAddEmail}
                                    className="flex items-center px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
                                >
                                    <Plus size={16} className="mr-1.5" />
                                    Gerenciar E-mails
                                </button>
                            </div>

                            {loadingEmails ? (
                                <div className="h-48 flex items-center justify-center">
                                    <RefreshCw size={24} className="text-blue-500 animate-spin mr-2" />
                                    <p className="text-gray-500">Carregando e-mails...</p>
                                </div>
                            ) : clienteEmails.length === 0 ? (
                                <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-300 rounded-lg">
                                    <Mail size={36} className="text-gray-400 mb-3" />
                                    <p className="text-gray-500 mb-2">Nenhum e-mail cadastrado</p>
                                    <p className="text-gray-400 text-sm mb-4">Adicione e-mails para este cliente utilizando o botão acima.</p>
                                    <button
                                        onClick={handleAddEmail}
                                        className="flex items-center px-4 py-2 text-sm font-medium rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50"
                                    >
                                        <Plus size={16} className="mr-1.5" />
                                        Adicionar Primeiro E-mail
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {clienteEmails.map((emailItem) => {
                                        // Split emails by semicolon
                                        const emails = emailItem.ds_email.split(';').map(email => email.trim()).filter(Boolean);

                                        return (
                                            <div key={emailItem.id_email} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="font-medium text-gray-900 flex items-center">
                                                        <AtSign size={16} className="text-blue-600 mr-1.5" />
                                                        {`${emails.length} ${emails.length === 1 ? 'E-mail' : 'E-mails'}`}
                                                    </h4>
                                                    <button
                                                        onClick={() => handleEditEmail(emailItem)}
                                                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                                    >
                                                        <Edit3 size={14} className="mr-1" />
                                                        Editar
                                                    </button>
                                                </div>

                                                <div className="space-y-2">
                                                    {emails.map((email, index) => (
                                                        <div key={index} className="flex items-center text-sm bg-white px-3 py-2 rounded-md border border-gray-100">
                                                            <span className="text-gray-900">{email}</span>
                                                            <a
                                                                href={`mailto:${email}`}
                                                                className="ml-auto text-blue-600 hover:text-blue-800 p-1"
                                                                title="Enviar e-mail"
                                                            >
                                                                <Mail size={14} />
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Email Modal */}
            <EmailFormModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                modalMode={emailModalMode}
                currentEmail={currentEmail}
                cliente={cliente ? { id_cliente: Number(clienteId), ds_nome: cliente.ds_nome } : null}
                onSuccess={handleModalSuccess}
                onError={handleModalError}
            />
        </div>
    );
}

// Helper function to get email type badge class
function getEmailTypeBadgeClass(tipo: string): string {
    switch (tipo) {
        case 'Principal':
            return 'bg-blue-100 text-blue-800 border border-blue-200';
        case 'Financeiro':
            return 'bg-green-100 text-green-800 border border-green-200';
        case 'Comercial':
            return 'bg-purple-100 text-purple-800 border border-purple-200';
        case 'Suporte':
            return 'bg-amber-100 text-amber-800 border border-amber-200';
        case 'NFe':
            return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
        default:
            return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
}

// Component for displaying a data field with label and value
function DataItem({ label, value, className = "" }: { label: string, value: any, className?: string }) {
    return (
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className={`mt-1.5 ${className || 'text-gray-900'}`}>{value || '-'}</p>
        </div>
    );
}

// Component for displaying checkbox items
function CheckboxItem({ checked = false, label }: { checked?: boolean, label: string }) {
    return (
        <div className="flex items-center">
            <div className={`w-5 h-5 rounded-md mr-3 flex items-center justify-center ${checked ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                {checked && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                )}
            </div>
            <span className="text-gray-700">{label}</span>
        </div>
    );
}

// File icon component
function FileIcon({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
    );
}

// Database icon component
function DatabaseIcon({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
        </svg>
    );
}

// Document icon component
function DocumentIcon({ size, className }: { size: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
    );
}