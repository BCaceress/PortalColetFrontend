export interface Contato {
    id_contato?: number;
    ds_nome: string;
    ds_email: string;
    ds_telefone?: string;
    ds_cargo: string;
    fl_ativo: boolean;
    fl_whatsapp?: boolean;
    tx_observacoes?: string;
}

export interface ContatoPayload {
    ds_nome: string;
    ds_email: string;
    ds_telefone?: string;
    ds_cargo: string;
    fl_ativo: boolean;
    fl_whatsapp?: boolean;
    tx_observacoes?: string;
}