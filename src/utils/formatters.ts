/**
 * Módulo de utilitários para formatação e validação de dados
 */

/**
 * Formata um CNPJ aplicando a máscara XX.XXX.XXX/XXXX-XX
 * @param value String contendo o CNPJ (com ou sem formatação)
 * @returns CNPJ formatado
 */
export const formatCNPJ = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Apply CNPJ mask: XX.XXX.XXX/XXXX-XX
    if (digits.length <= 14) {
        return digits
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    }

    return digits.substring(0, 14)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
};

/**
 * Formata um CEP aplicando a máscara XXXXX-XXX
 * @param value String contendo o CEP (com ou sem formatação)
 * @returns CEP formatado
 */
export const formatCEP = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Apply CEP mask: XXXXX-XXX
    if (digits.length <= 8) {
        return digits
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1');
    }

    return digits.substring(0, 8)
        .replace(/(\d{5})(\d)/, '$1-$2');
};

/**
 * Interface para o retorno da API ViaCEP
 */
export interface ViaCEPResponse {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
    ibge: string;
    gia: string;
    ddd: string;
    siafi: string;
    erro?: boolean;
}

/**
 * Busca informações de endereço pelo CEP usando a API ViaCEP
 * @param cep CEP a ser pesquisado (apenas números)
 * @returns Promessa com os dados do endereço ou erro
 */
export const searchAddressByCEP = async (cep: string): Promise<ViaCEPResponse> => {
    const cleanCEP = cep.replace(/\D/g, '');

    if (cleanCEP.length !== 8) {
        throw new Error('CEP deve conter 8 dígitos');
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();

    if (data.erro) {
        throw new Error('CEP não encontrado');
    }

    return data;
};