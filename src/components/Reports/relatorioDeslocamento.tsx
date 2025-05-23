'use client';

import { Column, DataTable } from '@/components/ui/DataTable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import api from '@/services/api';
import { PDFExportOptions, generateDeslocamentoPDF } from '@/services/pdfService';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Calendar, Car, DollarSign, Download, File, FileText, Loader, User } from 'lucide-react';
import { useEffect, useState } from 'react';

// Interface para dados de deslocamento extraídos das RATs
interface Deslocamento {
    id_rat: number;
    dt_data_hora_entrada: string;
    dt_data_hora_saida: string;
    nr_km_ida?: number;
    nr_km_volta?: number;
    nr_valor_pedagio?: number;
    nr_valor_km_rodado?: number;
    tm_duracao: string;
    nome_usuario: string;
    nome_cliente: string;
    total_km?: number; // Calculado: nr_km_volta - nr_km_ida
    valor_total?: number; // Calculado: (total_km * nr_valor_km_rodado) + nr_valor_pedagio
}

interface ReportFilter {
    id_usuario?: number;
    dt_inicio: string;
    dt_fim: string;
}

// Props para o componente
interface RelatorioDeslocamentoProps {
    isEmbedded?: boolean;
}

export default function RelatorioDeslocamento({ isEmbedded = false }: RelatorioDeslocamentoProps) {
    const [deslocamentos, setDeslocamentos] = useState<Deslocamento[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usuarios, setUsuarios] = useState<{ id_usuario: number, nome: string }[]>([]);
    const [usuarioSelecionado, setUsuarioSelecionado] = useState<number | string>('');
    const [dataInicio, setDataInicio] = useState<string>('');
    const [dataFim, setDataFim] = useState<string>('');
    const [animateItems, setAnimateItems] = useState(false);
    const [exportLoading, setExportLoading] = useState<boolean>(false);
    const [exportSuccess, setExportSuccess] = useState<boolean>(false);
    const [totalDeslocamento, setTotalDeslocamento] = useState({
        totalKm: 0,
        totalPedagio: 0,
        valorTotal: 0, // Novo campo para o valor total
        avgValorKm: 0 // Novo campo para o valor médio do km rodado
    });

    // Buscar usuários para o filtro - apenas implantadores
    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                // Buscar apenas usuários com função de implantador
                const response = await api.get('/usuarios', {
                    params: { funcao: 'Implantador' }
                });
                setUsuarios(response.data);
            } catch (error) {
                console.error('Erro ao buscar usuários:', error);
                setError('Não foi possível carregar a lista de implantadores');
            }
        };

        fetchUsuarios();
    }, []);

    // Funções auxiliares para formatação
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
        } catch (error) {
            return 'Data inválida';
        }
    };

    const formatDateTime = (dateString: string) => {
        try {
            return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
        } catch (error) {
            return 'Data/hora inválida';
        }
    };

    const formatTime = (timeString: string) => {
        if (!timeString) return '';
        return timeString;
    };

    const formatMoeda = (valor?: number): string => {
        if (valor === undefined || valor === null) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    // Função para pesquisar deslocamentos
    const pesquisarDeslocamentos = async () => {
        if (!dataInicio || !dataFim) {
            setError('É necessário informar um período de datas para a pesquisa');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Preparar corpo da requisição conforme especificado
            const requestBody: any = {
                dt_data_hora_entrada: `${dataInicio}T00:00:00.000Z`,
                dt_data_hora_saida: `${dataFim}T23:59:59.999Z`
            };

            // Adicionar usuário apenas se selecionado
            if (usuarioSelecionado) {
                requestBody.id_usuario = Number(usuarioSelecionado);
            }

            // Chamada direta à API usando POST
            const response = await api.post('/rats/relatorio-deslocamento', requestBody);

            // Processar dados retornados
            const dados = response.data.map((item: Deslocamento) => {
                // Calcular a diferença de km (total percorrido)
                const kmPercorrido = (item.nr_km_volta || 0) - (item.nr_km_ida || 0);

                // Calcular o valor do deslocamento (km percorrido * valor do km)
                const valorKmRodado = kmPercorrido * (item.nr_valor_km_rodado || 0);

                // Calcular o valor total (valor do deslocamento + valor do pedágio)
                const valorTotal = valorKmRodado + (item.nr_valor_pedagio || 0);

                return {
                    ...item,
                    total_km: kmPercorrido,
                    valor_total: valorTotal
                };
            });

            setDeslocamentos(dados);

            // Calcular totais
            const kmTotal = dados.reduce((acc: number, item: Deslocamento) =>
                acc + (item.total_km || 0), 0);

            const pedagioTotal = dados.reduce((acc: number, item: Deslocamento) =>
                acc + (item.nr_valor_pedagio || 0), 0);

            // Somar os valores totais de cada RAT para obter o valor total geral
            const valorTotal = dados.reduce((acc: number, item: Deslocamento) =>
                acc + (item.valor_total || 0), 0);

            // Calcular o valor médio do km rodado (se houver dados)
            const avgValorKm = dados.length > 0
                ? dados.reduce((sum, item) => sum + (item.nr_valor_km_rodado || 0), 0) / dados.length
                : 0;

            setTotalDeslocamento({
                totalKm: kmTotal,
                totalPedagio: pedagioTotal,
                valorTotal: valorTotal,
                avgValorKm: avgValorKm
            });

            // Animar a tabela
            setAnimateItems(true);

        } catch (error) {
            console.error('Erro ao buscar deslocamentos:', error);
            setError('Falha ao buscar dados de deslocamento. Verifique se o período selecionado é válido.');
            setDeslocamentos([]);
        } finally {
            setLoading(false);
        }
    };

    // Função para exportar relatório em PDF
    const exportarRelatorioPDF = async (downloadDirectly: boolean = false) => {
        if (!dataInicio || !dataFim) {
            setError('É necessário informar um período de datas para exportar');
            return;
        }

        try {
            setExportLoading(true);
            setError(null);
            setExportSuccess(false);

            // Preparar o nome do arquivo
            const periodoStr = `${formatDate(dataInicio)}_a_${formatDate(dataFim)}`.replace(/\//g, '-');
            const usuarioStr = usuarioSelecionado ?
                `_${usuarios.find(u => u.id_usuario === Number(usuarioSelecionado))?.nome || 'usuario'}` : '';

            const filename = `relatorio_deslocamento${usuarioStr}_${periodoStr}.pdf`;

            // Preparar filtro para o serviço PDF com opções avançadas
            const filtro: ReportFilter = {
                dt_inicio: dataInicio,
                dt_fim: dataFim
            };

            // Adicionar usuário apenas se selecionado
            if (usuarioSelecionado) {
                filtro.id_usuario = Number(usuarioSelecionado);
            }

            // Configurar opções de exportação
            const options: PDFExportOptions = {
                filename,
                shouldDownload: downloadDirectly,
                openInNewTab: !downloadDirectly // Abrir em nova aba apenas se não for download direto
            };

            // Usando o serviço para gerar o PDF com as opções configuradas
            await generateDeslocamentoPDF(filtro, options);

            // Mostrar feedback de sucesso temporário
            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 3000);

        } catch (error) {
            console.error('Erro ao exportar relatório:', error);
            setError('Não foi possível exportar o relatório em PDF. Verifique sua conexão e tente novamente.');
        } finally {
            setExportLoading(false);
        }
    };

    // Colunas para a tabela de deslocamentos
    const columns: Column<Deslocamento>[] = [
        {
            header: 'RAT',
            accessor: 'id_rat',
            cellRenderer: (value) => (
                <span className="text-gray-700 font-medium">#{value}</span>
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
            header: 'Técnico',
            accessor: 'nome_usuario',
            cellRenderer: (value) => (
                <span className="text-gray-700">
                    {value || 'Não informado'}
                </span>
            )
        },
        {
            header: 'Cliente',
            accessor: 'nome_cliente',
            cellRenderer: (value) => (
                <div className="font-medium text-gray-900">
                    {value || 'Cliente não informado'}
                </div>
            )
        },
        {
            header: 'KM Ida',
            accessor: 'nr_km_ida',
            cellRenderer: (value) => (
                <span className="text-gray-700">{value || 0} km</span>
            )
        },
        {
            header: 'KM Volta',
            accessor: 'nr_km_volta',
            cellRenderer: (value) => (
                <span className="text-gray-700">{value || 0} km</span>
            )
        },
        {
            header: 'Total KM',
            accessor: 'total_km',
            cellRenderer: (value) => (
                <span className="font-medium text-gray-800">{value || 0} km</span>
            )
        },
        {
            header: 'Valor KM',
            accessor: 'nr_valor_km_rodado',
            cellRenderer: (value) => (
                <span className="text-gray-700">{formatMoeda(value)}</span>
            )
        },
        {
            header: 'Duração',
            accessor: 'tm_duracao',
            cellRenderer: (value) => (
                <span className="text-gray-700">{formatTime(value)}</span>
            )
        },
        {
            header: 'Pedágio',
            accessor: 'nr_valor_pedagio',
            cellRenderer: (value) => (
                <span className="text-gray-700">{formatMoeda(value)}</span>
            )
        },
        {
            header: 'Valor Total',
            accessor: 'valor_total',
            cellRenderer: (value) => (
                <span className="font-medium text-gray-800">{formatMoeda(value)}</span>
            )
        }
    ];

    return (
        <div className="p-1 sm:p-5 max-w-7xl mx-auto">
            {!isEmbedded && (
                <PageHeader
                    title="Relatório de Deslocamento"
                    description="Análise de deslocamentos registrados nas RATs"
                />
            )}

            {/* Filtros do relatório */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6"
            >
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros do Relatório</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Filtro de Usuário (apenas implantadores) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Implantador</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <User size={16} className="text-gray-400" />
                            </div>
                            <select
                                value={usuarioSelecionado}
                                onChange={(e) => setUsuarioSelecionado(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-[#09A08D] focus:border-[#09A08D] sm:text-sm"
                            >
                                <option value="">Todos os implantadores</option>
                                {usuarios.map((user) => (
                                    <option key={user.id_usuario} value={user.id_usuario}>
                                        {user.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Filtro de Data Inicial */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Calendar size={16} className="text-gray-400" />
                            </div>
                            <input
                                type="date"
                                value={dataInicio}
                                onChange={(e) => setDataInicio(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-[#09A08D] focus:border-[#09A08D] sm:text-sm"
                                required
                            />
                        </div>
                    </div>

                    {/* Filtro de Data Final */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Calendar size={16} className="text-gray-400" />
                            </div>
                            <input
                                type="date"
                                value={dataFim}
                                onChange={(e) => setDataFim(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 text-base text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-[#09A08D] focus:border-[#09A08D] sm:text-sm"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-between">
                    <button
                        onClick={pesquisarDeslocamentos}
                        disabled={!dataInicio || !dataFim || loading}
                        className="bg-gradient-to-r from-[#09A08D] to-teal-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                    >
                        <FileText size={16} />
                        <span>Gerar Relatório</span>
                    </button>

                    {deslocamentos.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-end">
                            {/* Botão para visualizar PDF em nova aba */}
                            <button
                                onClick={() => exportarRelatorioPDF(false)}
                                disabled={exportLoading}
                                className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-gray-50 disabled:opacity-70 transition-all"
                            >
                                {exportLoading ? (
                                    <Loader size={16} className="animate-spin" />
                                ) : (
                                    <File size={16} className="text-red-500" />
                                )}
                                <span>Visualizar PDF</span>
                            </button>

                            {/* Botão para download direto do PDF */}
                            <button
                                onClick={() => exportarRelatorioPDF(true)}
                                disabled={exportLoading}
                                className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-gray-50 disabled:opacity-70 transition-all"
                            >
                                {exportLoading ? (
                                    <Loader size={16} className="animate-spin" />
                                ) : (
                                    <Download size={16} className="text-blue-500" />
                                )}
                                <span>Baixar PDF</span>
                            </button>

                            {/* Feedback de sucesso */}
                            {exportSuccess && (
                                <span className="text-green-500 flex items-center gap-1 px-2">
                                    PDF gerado com sucesso!
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Mostrar resultados apenas depois que a pesquisa for executada */}
            {(loading || deslocamentos.length > 0 || error) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                    {/* Cabeçalho da tabela com totais */}
                    {deslocamentos.length > 0 && (
                        <div className="p-5 border-b border-gray-100">
                            <h3 className="text-lg font-medium text-gray-800 mb-3">Resumo de Deslocamentos</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4 flex items-center">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                                        <Car size={24} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Quilômetros Percorridos</p>
                                        <p className="text-xl font-semibold text-gray-800">{totalDeslocamento.totalKm} km</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 flex items-center">
                                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                                        <DollarSign size={24} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Total em Pedágios</p>
                                        <p className="text-xl font-semibold text-gray-800">
                                            {formatMoeda(totalDeslocamento.totalPedagio)}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 flex items-center">
                                    <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
                                        <DollarSign size={24} className="text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Valor Total</p>
                                        <p className="text-xl font-semibold text-gray-800">
                                            {formatMoeda(totalDeslocamento.valorTotal)}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 flex items-center">
                                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                                        <DollarSign size={24} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Valor Médio do KM Rodado</p>
                                        <p className="text-xl font-semibold text-gray-800">
                                            {formatMoeda(totalDeslocamento.avgValorKm)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabela de Deslocamentos */}
                    <DataTable<Deslocamento>
                        data={deslocamentos}
                        columns={columns}
                        keyField="id_rat"
                        isLoading={loading}
                        error={error}
                        loadingComponent={<LoadingSpinner size="medium" color="primary" text="Carregando dados de deslocamento..." />}
                        animationEnabled={animateItems}
                        emptyState={{
                            title: "Nenhum deslocamento encontrado",
                            description: "Tente alterar os filtros ou selecionar outro período",
                        }}
                    />
                </motion.div>
            )}
        </div>
    );
}