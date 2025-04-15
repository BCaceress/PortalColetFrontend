export interface ClientePayload {
    ds_nome: string;
    ds_razao_social: string;
    nr_cnpj: string;
    ds_endereco: string;
    ds_cep: string;
    ds_uf: string;
    ds_cidade: string;
    ds_bairro: string;
    nr_numero: string;
    fl_matriz: boolean;
    ds_situacao: string;
    // Optional fields
    nr_inscricao_estadual?: string;
    ds_site?: string;
    ds_complemento?: string;
    nr_codigo_ibge?: string;
    nr_latitude?: number;
    nr_longitude?: number;
    nr_distancia_km?: number;
    ds_sistema?: string;
    ds_contrato?: string;
    // New fields
    tx_observacao_ident?: string;
    nr_nomeados?: number;
    nr_simultaneos?: number;
    nr_tecnica_remoto?: number;
    nr_tecnica_presencial?: number;
    tm_minimo_horas?: string;
    ds_diario_viagem?: string;
    ds_regiao?: string;
    tx_observacao_contrato?: string;
    nr_codigo_zz?: string;
    nr_qtde_documentos?: number;
    nr_valor_franqia?: number;
    nr_valor_excendente?: number;
    dt_data_contrato?: string;
    // Alfasig fields
    ds_franquia_nf?: string;
    fl_nfe?: boolean;
    fl_nfse?: boolean;
    fl_nfce?: boolean;
    nr_qtde_pdv?: number;
    nr_valor_pdv?: number;
    valor_total_pdv?: number; // Added this field to fix the error
}