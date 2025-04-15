'use client';

import api from '@/services/api';
import { ClientePayload } from '@/types/cliente';
import { formatCEP, formatCNPJ } from '@/utils/formatters';
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    CalendarRange,
    Clock,
    Download,
    Edit3,
    ExternalLink,
    Globe,
    MapPin,
    MoreHorizontal,
    Phone,
    RefreshCw,
    Smartphone,
    Users
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function VisualizarCliente() {
    const router = useRouter();
    const params = useParams();
    const clienteId = params.id;

    // States
    const [cliente, setCliente] = useState<ClientePayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('identificacao');

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
                        {['identificacao', 'endereco', 'contrato', 'alfasig'].map(tab => (
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
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Identification Tab */}
                {activeTab === 'identificacao' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center border-b border-gray-100 pb-3">
                                    <Building2 size={20} className="mr-2 text-blue-600" />
                                    Dados de Identificação
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <div className="space-y-6">
                                            <DataItem label="Razão Social" value={cliente.ds_razao_social} />
                                            <DataItem label="Nome Fantasia" value={cliente.ds_nome} />
                                            <DataItem label="CNPJ" value={formatCNPJ(cliente.nr_cnpj)} />
                                            <DataItem label="Inscrição Estadual" value={cliente.nr_inscricao_estadual} />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="space-y-6">
                                            <DataItem
                                                label="Tipo"
                                                value={cliente.fl_matriz ? 'Matriz' : 'Filial'}
                                                className={cliente.fl_matriz ? 'text-purple-700' : 'text-blue-700'}
                                            />
                                            <DataItem label="Código ZZ" value={cliente.nr_codigo_zz} />
                                            <DataItem
                                                label="Site"
                                                value={
                                                    cliente.ds_site && (
                                                        <a
                                                            href={cliente.ds_site.startsWith('http') ? cliente.ds_site : `http://${cliente.ds_site}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors group"
                                                        >
                                                            {cliente.ds_site}
                                                            <ExternalLink size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </a>
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-4 space-y-6">
                            {cliente.tx_observacao_ident ? (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h4 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-600">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                        Observações
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                                        <p className="text-gray-700 whitespace-pre-wrap">{cliente.tx_observacao_ident}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50/50 rounded-xl border border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-center h-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-2">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                    <p className="text-gray-500">Nenhuma observação registrada</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Address Tab */}
                {activeTab === 'endereco' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center border-b border-gray-100 pb-3">
                                    <MapPin size={20} className="mr-2 text-blue-600" />
                                    Endereço
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                                    <div className="col-span-2">
                                        <DataItem
                                            label="Endereço Completo"
                                            value={
                                                <>
                                                    {cliente.ds_endereco}, {cliente.nr_numero}
                                                    {cliente.ds_complemento ? `, ${cliente.ds_complemento}` : ''}
                                                </>
                                            }
                                        />
                                    </div>
                                    <DataItem label="Bairro" value={cliente.ds_bairro} />
                                    <DataItem label="CEP" value={formatCEP(cliente.ds_cep)} />
                                    <DataItem label="Cidade/UF" value={`${cliente.ds_cidade}/${cliente.ds_uf}`} />
                                    <DataItem label="Código IBGE" value={cliente.nr_codigo_ibge} />

                                    {cliente.nr_latitude !== undefined || cliente.nr_longitude !== undefined || cliente.nr_distancia_km !== undefined ? (
                                        <div className="col-span-2 mt-4">
                                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-600">
                                                    <circle cx="12" cy="10" r="3"></circle>
                                                    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"></path>
                                                </svg>
                                                Dados de Geolocalização
                                            </h4>
                                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {cliente.nr_latitude !== undefined && (
                                                    <DataItem
                                                        label="Latitude"
                                                        value={cliente.nr_latitude}
                                                        className="text-blue-800"
                                                    />
                                                )}
                                                {cliente.nr_longitude !== undefined && (
                                                    <DataItem
                                                        label="Longitude"
                                                        value={cliente.nr_longitude}
                                                        className="text-blue-800"
                                                    />
                                                )}
                                                {cliente.nr_distancia_km !== undefined && (
                                                    <DataItem
                                                        label="Distância (km)"
                                                        value={cliente.nr_distancia_km}
                                                        className="text-blue-800"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all h-full">
                                <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-600">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    Mapa
                                </h4>
                                <div className="bg-gray-50 rounded-lg border border-gray-200 aspect-square flex items-center justify-center overflow-hidden relative">
                                    {cliente.nr_latitude && cliente.nr_longitude ? (
                                        <a
                                            href={`https://www.google.com/maps?q=${cliente.nr_latitude},${cliente.nr_longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full h-full flex items-center justify-center bg-gray-100 group"
                                        >
                                            <div className="absolute inset-0 bg-cover bg-center opacity-70 group-hover:opacity-90 transition-opacity"
                                                style={{
                                                    backgroundImage: `url('https://maps.googleapis.com/maps/api/staticmap?center=${cliente.nr_latitude},${cliente.nr_longitude}&zoom=14&size=400x400&markers=color:red%7C${cliente.nr_latitude},${cliente.nr_longitude}&key=YOUR_API_KEY')`
                                                }}>
                                            </div>
                                            <div className="bg-white rounded-full p-3 z-10 shadow-lg group-hover:scale-110 transition-transform">
                                                <MapPin size={24} className="text-red-500" />
                                            </div>
                                        </a>
                                    ) : (
                                        <div className="text-center p-4">
                                            <MapPin size={32} className="text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-500">Localização não disponível</p>
                                            <p className="text-gray-400 text-sm mt-1">Coordenadas não cadastradas</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Contract Tab */}
                {activeTab === 'contrato' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-8 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center border-b border-gray-100 pb-3">
                                    <FileIcon size={20} className="mr-2 text-blue-600" />
                                    Dados do Contrato
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                                    <div>
                                        <DataItem
                                            label="Situação"
                                            value={
                                                <span className={`inline-flex rounded-md px-3 py-1 text-sm font-semibold ${getStatusColor(cliente.ds_situacao)}`}>
                                                    {cliente.ds_situacao || '-'}
                                                </span>
                                            }
                                        />
                                    </div>
                                    <DataItem label="Sistema" value={cliente.ds_sistema} />

                                    <DataItem
                                        label="Data do Contrato"
                                        value={
                                            cliente.dt_data_contrato ? (
                                                <span className="flex items-center">
                                                    <CalendarRange size={15} className="text-gray-500 mr-1.5" />
                                                    {new Date(cliente.dt_data_contrato).toLocaleDateString('pt-BR', {
                                                        year: 'numeric',
                                                        month: 'long'
                                                    })}
                                                </span>
                                            ) : '-'
                                        }
                                    />

                                    <DataItem label="Tipo de Contrato" value={cliente.ds_contrato} />
                                    <DataItem label="Diário de Viagem" value={cliente.ds_diario_viagem} />
                                    <DataItem label="Região" value={cliente.ds_regiao} />
                                </div>

                                <div className="mt-8">
                                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-600">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                        Valores do Contrato
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                                        <DataItem
                                            label="Valor Hora Remoto"
                                            value={cliente.nr_tecnica_remoto !== undefined ? formatCurrency(cliente.nr_tecnica_remoto) : '-'}
                                            className="text-blue-800 font-semibold"
                                        />
                                        <DataItem
                                            label="Valor Hora Presencial"
                                            value={cliente.nr_tecnica_presencial !== undefined ? formatCurrency(cliente.nr_tecnica_presencial) : '-'}
                                            className="text-blue-800 font-semibold"
                                        />
                                        <DataItem
                                            label="Mínimo de Horas"
                                            value={
                                                cliente.tm_minimo_horas ? (
                                                    <span className="flex items-center">
                                                        <Clock size={15} className="text-gray-500 mr-1.5" />
                                                        {cliente.tm_minimo_horas}
                                                    </span>
                                                ) : '-'
                                            }
                                            className="text-blue-800 font-semibold"
                                        />
                                    </div>
                                </div>

                                {cliente.ds_contrato === 'Básico' && (
                                    <div className="mt-6">
                                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                                            <Users size={18} className="mr-2 text-blue-600" />
                                            Configurações do Contrato
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100">
                                            <DataItem
                                                label="Nomeados"
                                                value={cliente.nr_nomeados}
                                                className="text-purple-800 font-medium"
                                            />
                                            <DataItem
                                                label="Simultâneos"
                                                value={cliente.nr_simultaneos}
                                                className="text-purple-800 font-medium"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-4">
                            {cliente.tx_observacao_contrato ? (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all h-full">
                                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-600">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                        Observações do Contrato
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                                        <p className="text-gray-700 whitespace-pre-wrap">{cliente.tx_observacao_contrato}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50/50 rounded-xl border border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-center h-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-2">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                    <p className="text-gray-500">Nenhuma observação de contrato registrada</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Alfasig Tab */}
                {activeTab === 'alfasig' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-12">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center border-b border-gray-100 pb-3">
                                    <DatabaseIcon size={20} className="mr-2 text-blue-600" />
                                    Informações Alfasig
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-100 mb-6">
                                            <DataItem
                                                label="Franquia NF"
                                                value={
                                                    <span className={`inline-flex rounded-md px-3 py-1 text-sm font-semibold ${cliente.ds_franquia_nf === 'Colet'
                                                        ? 'bg-indigo-100 text-indigo-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {cliente.ds_franquia_nf || 'Não definida'}
                                                    </span>
                                                }
                                            />
                                        </div>

                                        {cliente.ds_franquia_nf === 'Colet' && (
                                            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                                    <DocumentIcon size={18} className="mr-2 text-indigo-600" />
                                                    Tipos de Notas Fiscais
                                                </h4>
                                                <div className="space-y-3">
                                                    <CheckboxItem
                                                        checked={cliente.fl_nfe ?? false}
                                                        label="NFe (Nota Fiscal Eletrônica)"
                                                    />
                                                    <CheckboxItem
                                                        checked={cliente.fl_nfse ?? false}
                                                        label="NFSe (Nota Fiscal de Serviço Eletrônica)"
                                                    />
                                                    <CheckboxItem
                                                        checked={cliente.fl_nfce ?? false}
                                                        label="NFCe (Nota Fiscal de Consumidor Eletrônica)"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {cliente.ds_franquia_nf === 'Colet' && (
                                            <div className="space-y-6">
                                                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-indigo-600">
                                                            <line x1="12" y1="1" x2="12" y2="23"></line>
                                                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                                        </svg>
                                                        Informações de Franquia
                                                    </h4>
                                                    <div className="space-y-4">
                                                        <DataItem
                                                            label="Quantidade de Documentos"
                                                            value={cliente.nr_qtde_documentos}
                                                            className="font-medium"
                                                        />
                                                        <DataItem
                                                            label="Valor da Franquia"
                                                            value={cliente.nr_valor_franqia !== undefined ? formatCurrency(cliente.nr_valor_franqia) : '-'}
                                                            className="font-semibold text-indigo-800"
                                                        />
                                                        <DataItem
                                                            label="Valor Excedente"
                                                            value={cliente.nr_valor_excendente !== undefined ? formatCurrency(cliente.nr_valor_excendente) : '-'}
                                                            className="font-semibold text-indigo-800"
                                                        />
                                                    </div>
                                                </div>

                                                {cliente.fl_nfce && (
                                                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-indigo-600">
                                                                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                                                                <line x1="12" y1="18" x2="12.01" y2="18"></line>
                                                                <line x1="8" y1="6" x2="16" y2="6"></line>
                                                                <line x1="8" y1="10" x2="16" y2="10"></line>
                                                                <line x1="8" y1="14" x2="16" y2="14"></line>
                                                            </svg>
                                                            Informações de PDV
                                                        </h4>
                                                        <div className="space-y-4">
                                                            <DataItem
                                                                label="Quantidade de PDV"
                                                                value={cliente.nr_qtde_pdv}
                                                                className="font-medium"
                                                            />
                                                            <DataItem
                                                                label="Valor do PDV"
                                                                value={cliente.nr_valor_pdv !== undefined ? formatCurrency(cliente.nr_valor_pdv) : '-'}
                                                                className="font-semibold text-indigo-800"
                                                            />
                                                            {cliente.nr_qtde_pdv && cliente.nr_valor_pdv && (
                                                                <DataItem
                                                                    label="Valor Total PDV"
                                                                    value={formatCurrency(cliente.nr_qtde_pdv * cliente.nr_valor_pdv)}
                                                                    className="font-semibold text-indigo-800"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
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