import { jsPDF } from "jspdf";
import api from "./api";
// @ts-ignore - Ignorando erros de tipagem do jspdf-autotable
import autoTable from "jspdf-autotable";

// Interface para dados de deslocamento
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
    total_km?: number;
    valor_total?: number;
}

// Configurações para exportação de PDF
export interface PDFExportOptions {
    filename?: string;  // Nome personalizado do arquivo
    shouldDownload: boolean;  // Se deve baixar diretamente ou abrir em nova aba
    openInNewTab?: boolean;  // Se deve abrir em nova aba após download
}

// Função para formatar uma data
const formatDate = (isoDate: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR');
};

// Função para formatar valor monetário
const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

// Função para gerar relatório de deslocamento em PDF usando jsPDF
export const generateDeslocamentoPDF = async (
    filtro: { id_usuario?: number; dt_inicio: string; dt_fim: string },
    options: PDFExportOptions | boolean = false
): Promise<string> => {
    // Tratamento para compatibilidade com versão anterior
    const exportOptions: PDFExportOptions = typeof options === 'boolean'
        ? { shouldDownload: options }
        : options;

    // Nome padrão do arquivo baseado no período
    const defaultFilename = `relatorio-deslocamento-${filtro.dt_inicio}-${filtro.dt_fim}.pdf`;
    const filename = exportOptions.filename || defaultFilename;

    try {
        // Buscar dados do deslocamento
        const dados = await getRelatorioDeslocamentoData(filtro);

        // Verificar se há dados para gerar o relatório
        if (!dados || dados.length === 0) {
            throw new Error('Não há dados de deslocamento para o período selecionado');
        }

        // Calcular totais para o relatório
        const totalKm = dados.reduce((acc, item) => acc + (item.total_km || 0), 0);
        const totalPedagio = dados.reduce((acc, item) => acc + (item.nr_valor_pedagio || 0), 0);
        const valorTotal = dados.reduce((acc, item) => acc + (item.valor_total || 0), 0);

        // Calcular o valor médio do km rodado
        const avgValorKm = dados.length > 0
            ? dados.reduce((sum, item) => sum + (item.nr_valor_km_rodado || 0), 0) / dados.length
            : 0;

        // Criar nova instância do PDF
        const doc = new jsPDF('portrait', 'mm', 'a4');

        // Adicionar título
        doc.setFontSize(16);
        doc.text('Relatório de Deslocamento', doc.internal.pageSize.width / 2, 15, { align: 'center' });

        // Adicionar período
        doc.setFontSize(12);
        doc.text(`Período: ${formatDate(filtro.dt_inicio)} a ${formatDate(filtro.dt_fim)}`,
            doc.internal.pageSize.width / 2, 22, { align: 'center' });

        // Adicionar filtro de usuário se aplicável
        if (filtro.id_usuario) {
            const usuario = dados[0]?.nome_usuario || 'Usuário selecionado';
            doc.text(`Implantador: ${usuario}`, doc.internal.pageSize.width / 2, 28, { align: 'center' });
        }

        // Configurar tabela
        const tableColumn = [
            'RAT', 'Data', 'Técnico', 'Cliente', 'KM Ida', 'KM Volta',
            'Total KM', 'Valor KM', 'Pedágio', 'Valor Total'
        ];

        // Configurar conteúdo da tabela
        const tableRows = dados.map(item => [
            `#${item.id_rat}`,
            formatDate(item.dt_data_hora_entrada),
            item.nome_usuario || 'N/A',
            item.nome_cliente || 'N/A',
            `${item.nr_km_ida || 0} km`,
            `${item.nr_km_volta || 0} km`,
            `${item.total_km || 0} km`,
            formatCurrency(item.nr_valor_km_rodado),
            formatCurrency(item.nr_valor_pedagio),
            formatCurrency(item.valor_total)
        ]);

        // Definir posição inicial da tabela
        const startY = 35;

        // Adicionar tabela ao documento
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            theme: 'striped',
            headStyles: {
                fillColor: [9, 160, 141], // Cor #09A08D em RGB
                textColor: [255, 255, 255]
            },
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            columnStyles: {
                0: { cellWidth: 15 }, // RAT
                1: { cellWidth: 20 }, // Data
                2: { cellWidth: 25 }, // Técnico
                3: { cellWidth: 35 }, // Cliente
            }
        });

        // Obter a posição final da tabela para adicionar o resumo
        // @ts-ignore - Ignorando erro de propriedade não existente
        const finalY = doc.lastAutoTable?.finalY + 10 || startY + 50;

        doc.setFontSize(12);
        doc.text('Resumo', 14, finalY);

        doc.setFontSize(10);
        doc.text(`Total KM: ${totalKm} km`, 14, finalY + 8);
        doc.text(`Total Pedágio: ${formatCurrency(totalPedagio)}`, 14, finalY + 14);
        doc.text(`Valor Total: ${formatCurrency(valorTotal)}`, 14, finalY + 20);

        // Rodapé
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${i} de ${pageCount}`,
                doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
        }

        // Gerar PDF como URL ou download
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);

        // Se devemos fazer download
        if (exportOptions.shouldDownload) {
            doc.save(filename);

            // Se também devemos abrir em nova aba
            if (exportOptions.openInNewTab) {
                window.open(url, '_blank');
            }
        } else if (exportOptions.openInNewTab !== false) {
            // Por padrão, abrir em nova aba quando não estiver baixando
            window.open(url, '_blank');
        }

        // Retornar a URL para possível uso posterior
        return url;
    } catch (error) {
        console.error('Erro ao gerar PDF do relatório de deslocamento:', error);
        // Repassar erro para ser tratado pelo componente
        throw error;
    }
};

// Função para buscar os dados do relatório de deslocamento
export const getRelatorioDeslocamentoData = async (filtro: { id_usuario?: number; dt_inicio: string; dt_fim: string }) => {
    try {
        // Configurar dados para o corpo da requisição
        const requestBody: any = {
            dt_data_hora_entrada: `${filtro.dt_inicio}T00:00:00.000Z`,
            dt_data_hora_saida: `${filtro.dt_fim}T23:59:59.999Z`
        };

        // Adicionar id_usuario apenas se definido
        if (filtro.id_usuario) {
            requestBody.id_usuario = Number(filtro.id_usuario);
        }

        // Fazer requisição à API para obter dados de deslocamento
        const response = await api.post('/rats/relatorio-deslocamento', requestBody);

        // Processar e retornar os dados com cálculos adicionais
        return response.data.map((item: Deslocamento) => {
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
    } catch (error) {
        console.error('Erro ao buscar dados de deslocamento:', error);
        throw error;
    }
};