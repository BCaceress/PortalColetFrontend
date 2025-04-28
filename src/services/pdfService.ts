import api from "./api";

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

// Função para gerar relatório de deslocamento em PDF
export const generateDeslocamentoPDF = async (
    filtro: { id_usuario?: number; dt_inicio: string; dt_fim: string }
): Promise<Blob> => {
    try {
        // Configurar dados para o corpo da requisição
        const requestBody: any = {
            dt_data_hora_entrada: `${filtro.dt_inicio}T00:00:00.000Z`,
            dt_data_hora_saida: `${filtro.dt_fim}T23:59:59.999Z`
        };

        // Adicionar id_usuario apenas se definido
        if (filtro.id_usuario) {
            requestBody.id_usuario = filtro.id_usuario;
        }

        // Chamada para o endpoint correto com dados no corpo da requisição
        const response = await api.post('/rats/relatorio_deslocamento', requestBody, {
            responseType: 'blob'
        });

        return response.data;
    } catch (error) {
        console.error('Erro ao gerar PDF do relatório de deslocamento:', error);
        throw error;
    }
};

// Função para buscar os dados e gerar o relatório de deslocamento (usando JavaScript no cliente)
export const getRelatorioDeslocamentoData = async (filtro: { id_usuario?: number; dt_inicio: string; dt_fim: string }) => {
    try {
        // Configurar dados para o corpo da requisição
        const requestBody: any = {
            dt_data_hora_entrada: `${filtro.dt_inicio}T00:00:00.000Z`,
            dt_data_hora_saida: `${filtro.dt_fim}T23:59:59.999Z`
        };

        // Adicionar id_usuario apenas se definido
        if (filtro.id_usuario) {
            requestBody.id_usuario = filtro.id_usuario;
        }

        const response = await api.post('/rats/relatorio_deslocamento', requestBody);

        return response.data.map((item: Deslocamento) => ({
            ...item,
            total_km: (item.nr_km_volta || 0) - (item.nr_km_ida || 0)
        }));
    } catch (error) {
        console.error('Erro ao buscar dados de deslocamento:', error);
        throw error;
    }
};