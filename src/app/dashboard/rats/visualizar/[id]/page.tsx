'use client';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import api from '@/services/api';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    Car,
    CheckCircle2,
    ClipboardList,
    Edit,
    ExternalLink,
    FileSpreadsheet,
    Hourglass,
    MessageSquareText
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Define the RAT type based on the API response
interface RAT {
    id_rat: number;
    ds_status: string;
    fl_deslocamento: string; // P = Presencial, R = Remoto
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
        nome: string;
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

export default function VisualizarRAT() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [rat, setRAT] = useState<RAT | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'atividades' | 'tarefas' | 'pendencias'>('atividades');
    const [isPrinting, setIsPrinting] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);

    useEffect(() => {
        const fetchRAT = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/rats/${id}`);
                setRAT(response.data);
                setError(null);
            } catch (err) {
                console.error('Erro ao buscar RAT:', err);
                setError('Não foi possível carregar os detalhes do registro de atendimento.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchRAT();
        }
    }, [id]);

    // Format date helper function
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
        } catch (error) {
            return 'Data inválida';
        }
    };

    // Format date and time helper function
    const formatDateTime = (dateString: string) => {
        if (!dateString) return '-';
        try {
            return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
        } catch (error) {
            return 'Data/hora inválida';
        }
    };

    // Format time only helper function
    const formatTime = (dateString: string) => {
        if (!dateString) return '-';
        try {
            return format(parseISO(dateString), 'HH:mm', { locale: ptBR });
        } catch (error) {
            return 'Hora inválida';
        }
    };

    // Format duration helper function (HH:MM:SS to HHh MMmin)
    const formatDuration = (duration: string) => {
        if (!duration) return '-';
        const [hours, minutes] = duration.split(':');
        return `${hours}h ${minutes}min`;
    };

    // Format currency helper function
    const formatCurrency = (value?: number) => {
        if (value === undefined || value === null) return '-';
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });
    };

    // Calculate KM total
    const calculateTotalKm = () => {
        if (!rat) return 0;
        const ida = rat.nr_km_ida || 0;
        const volta = rat.nr_km_volta || 0;
        return volta > ida ? volta - ida : 0;
    };

    const handleEdit = () => {
        router.push(`/dashboard/rats/editar/${id}`);
    };

    const handleBack = () => {
        router.push('/dashboard/rats');
    };

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 300);
    };

    // Define status badge styling
    const getStatusBadge = (status: string) => {
        let colorClass = '';
        let icon = null;

        switch (status.toLowerCase()) {
            case 'finalizado':
            case 'concluído':
                colorClass = 'bg-green-100 text-green-700 border-green-200';
                icon = <CheckCircle2 size={14} className="mr-1" />;
                break;
            case 'em andamento':
                colorClass = 'bg-blue-100 text-blue-700 border-blue-200';
                icon = <Hourglass size={14} className="mr-1" />;
                break;
            case 'pendente':
                colorClass = 'bg-yellow-100 text-yellow-700 border-yellow-200';
                icon = <AlertTriangle size={14} className="mr-1" />;
                break;
            case 'cancelado':
                colorClass = 'bg-red-100 text-red-700 border-red-200';
                icon = <AlertTriangle size={14} className="mr-1" />;
                break;
            default:
                colorClass = 'bg-gray-100 text-gray-700 border-gray-200';
        }

        return (
            <div className={`inline-flex items-center px-2.5 py-1 rounded-full border ${colorClass}`}>
                {icon}
                <span className="text-sm font-medium">{status}</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="large" color="primary" text="Carregando detalhes do atendimento..." />
            </div>
        );
    }

    if (error || !rat) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 shadow-sm">
                    <div className="flex items-center">
                        <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                        <p>{error || 'Registro de atendimento não encontrado.'}</p>
                    </div>
                </div>

                <div className="flex justify-center mt-8">
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Voltar para a lista
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-4 sm:p-6 max-w-7xl mx-auto ${isPrinting ? 'print-mode' : ''}`}>
            {/* Header com título e ações */}
            <div className="mb-6 print:mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBack}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors print:hidden"
                            aria-label="Voltar"
                            title="Voltar para lista"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    RAT #{rat.id_rat}
                                </h1>
                                {getStatusBadge(rat.ds_status)}
                            </div>

                            <p className="text-gray-500 mt-1">
                                {rat.cliente?.ds_nome || 'Cliente não informado'} • {formatDate(rat.dt_data_hora_entrada)}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-end print:hidden">
                        <motion.button
                            onClick={handleEdit}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Edit size={16} className="mr-2" />
                            Editar RAT
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Layout principal: Card comprido à esquerda e Card maior à direita */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:gap-4">
                {/* Card comprido à esquerda - Dados principais */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
                        <div className="p-6 h-full flex flex-col">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                <FileSpreadsheet className="text-blue-600 mr-2" size={20} />
                                Detalhes do Registro
                            </h2>

                            <div className="space-y-5 flex-grow">
                                {/* Responsável */}
                                <div>
                                    <h3 className="text-sm text-gray-500 font-medium mb-1.5">Responsável</h3>
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-2">
                                            {rat.usuario?.nome?.charAt(0) || '?'}
                                        </div>
                                        <span className="text-gray-800 font-medium">{rat.usuario?.nome || '-'}</span>
                                    </div>
                                </div>

                                {/* Cliente */}
                                <div>
                                    <h3 className="text-sm text-gray-500 font-medium mb-1.5">Cliente</h3>
                                    <p className="text-gray-800 font-medium">{rat.cliente?.ds_nome || 'Cliente não informado'}</p>
                                </div>

                                {/* Contato */}
                                <div>
                                    <h3 className="text-sm text-gray-500 font-medium mb-1.5">Contato</h3>
                                    <p className="text-gray-800">{rat.contato?.ds_nome || 'Não informado'}</p>
                                    {rat.contato?.ds_email && (
                                        <p className="text-blue-600 text-sm mt-0.5">
                                            {rat.contato.ds_email}
                                        </p>
                                    )}
                                </div>

                                {/* Origem */}
                                <div>
                                    <h3 className="text-sm text-gray-500 font-medium mb-1.5">Origem</h3>
                                    <p className="text-gray-800">{rat.ds_originada || 'Não especificada'}</p>
                                </div>

                                {/* Status */}
                                <div>
                                    <h3 className="text-sm text-gray-500 font-medium mb-1.5">Status</h3>
                                    <div>{getStatusBadge(rat.ds_status)}</div>
                                </div>



                                {/* Data e Hora */}
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex items-center mb-1">
                                        <Calendar size={16} className="text-gray-400 mr-2" />
                                        <h3 className="text-sm text-gray-500 font-medium">Data e Hora</h3>
                                    </div>

                                    <div className="ml-7 space-y-2">
                                        <div>
                                            <p className="text-xs text-gray-500">Entrada:</p>
                                            <p className="text-gray-800">{formatDateTime(rat.dt_data_hora_entrada)}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500">Saída:</p>
                                            <p className="text-gray-800">{formatDateTime(rat.dt_data_hora_saida)}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500">Duração:</p>
                                            <p className="text-gray-800 font-medium">{formatDuration(rat.tm_duracao)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Observação (se existir) */}
                                {rat.ds_observacao && (
                                    <div className="pt-4 border-t border-gray-200">
                                        <h3 className="text-sm text-gray-500 font-medium mb-1.5">Observação</h3>
                                        <p className="text-gray-800 bg-gray-50 p-3 rounded-md border border-gray-100">{rat.ds_observacao}</p>
                                    </div>
                                )}

                                {/* Comentários Internos (se existir) */}
                                {rat.tx_comentario_interno && (
                                    <div className="pt-4 border-t border-gray-200">
                                        <h3 className="text-sm text-gray-500 font-medium mb-1.5 flex items-center">
                                            <MessageSquareText size={16} className="text-amber-500 mr-1.5" />
                                            Comentários Internos
                                        </h3>
                                        <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-md">
                                            <div className="text-sm text-gray-700 whitespace-pre-wrap">{rat.tx_comentario_interno}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card maior à direita - Deslocamento e Atividades */}
                <div className="lg:col-span-2">
                    <div className="space-y-6">
                        {/* Card de Deslocamento */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                    <Car className="text-blue-600 mr-2" size={20} />
                                    Informações de Deslocamento
                                </h2>

                                {rat.fl_deslocamento === 'P' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                                <h3 className="text-sm font-medium text-gray-500 mb-2">KM Ida</h3>
                                                <p className="text-xl font-bold text-gray-900">{rat.nr_km_ida || '0'} <span className="text-sm font-normal text-gray-500">km</span></p>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h3 className="text-sm font-medium text-gray-500 mb-2">KM Volta</h3>
                                                <p className="text-xl font-bold text-gray-900">{rat.nr_km_volta || '0'} <span className="text-sm font-normal text-gray-500">km</span></p>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="bg-blue-50 rounded-lg p-4 mb-4">
                                                <h3 className="text-sm font-medium text-blue-700 mb-2">Total Percorrido</h3>
                                                <p className="text-xl font-bold text-blue-700">{calculateTotalKm()} <span className="text-sm font-normal">km</span></p>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h3 className="text-sm font-medium text-gray-500 mb-2">Valor do Pedágio</h3>
                                                <p className="text-xl font-bold text-gray-900">{formatCurrency(rat.nr_valor_pedagio)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 flex items-center">
                                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4">
                                            <ExternalLink size={20} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-medium text-blue-700">Atendimento Remoto</p>
                                            <p className="text-sm text-blue-600 mt-1">Este atendimento foi realizado remotamente, sem deslocamento físico.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card de Atividades/Conteúdo */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="border-b border-gray-200 print:hidden">
                                <nav className="flex">
                                    <button
                                        onClick={() => setActiveTab('atividades')}
                                        className={`relative py-4 px-6 text-sm font-medium focus:outline-none ${activeTab === 'atividades'
                                            ? 'text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        Atividades Realizadas
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('tarefas')}
                                        className={`relative py-4 px-6 text-sm font-medium focus:outline-none ${activeTab === 'tarefas'
                                            ? 'text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        Tarefas
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('pendencias')}
                                        className={`relative py-4 px-6 text-sm font-medium focus:outline-none ${activeTab === 'pendencias'
                                            ? 'text-blue-600 border-b-2 border-blue-600'
                                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        Pendências
                                    </button>
                                </nav>
                            </div>

                            <div className="p-6">
                                {/* Conteúdo da aba Atividades */}
                                <div className={activeTab === 'atividades' ? 'block' : 'hidden'}>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <ClipboardList size={18} className="text-blue-600 mr-2" />
                                        Atividades Realizadas
                                    </h3>

                                    {rat.tx_atividades ? (
                                        <div className="prose prose-sm max-w-none">
                                            <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100">{rat.tx_atividades}</div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">Nenhuma atividade registrada</p>
                                    )}
                                </div>

                                {/* Conteúdo da aba Tarefas */}
                                <div className={activeTab === 'tarefas' ? 'block' : 'hidden'}>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <CheckCircle2 size={18} className="text-blue-600 mr-2" />
                                        Tarefas
                                    </h3>

                                    {rat.tx_tarefas ? (
                                        <div className="prose prose-sm max-w-none">
                                            <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100">{rat.tx_tarefas}</div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">Nenhuma tarefa registrada</p>
                                    )}
                                </div>

                                {/* Conteúdo da aba Pendências */}
                                <div className={activeTab === 'pendencias' ? 'block' : 'hidden'}>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <AlertTriangle size={18} className="text-amber-500 mr-2" />
                                        Pendências
                                    </h3>

                                    {rat.tx_pendencias ? (
                                        <div className="prose prose-sm max-w-none">
                                            <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100">{rat.tx_pendencias}</div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">Nenhuma pendência registrada</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estilo para impressão */}
            <style jsx global>{`
        @media print {
          body {
            background-color: white;
            color: black;
            font-size: 12pt;
          }
          
          .print-mode {
            padding: 0 !important;
          }
          
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>
        </div>
    );
}