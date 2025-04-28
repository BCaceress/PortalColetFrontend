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
 * Formata um número de telefone brasileiro aplicando a máscara 
 * (XX) XXXXX-XXXX para celular ou (XX) XXXX-XXXX para telefone fixo
 * @param value String contendo o número de telefone (com ou sem formatação)
 * @returns Telefone formatado
 */
export const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');

    // Check if it's a mobile number (with 9 digits after DDD) or landline
    if (digits.length > 10) {
        // Mobile phone: (XX) XXXXX-XXXX
        return digits
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    } else {
        // Landline: (XX) XXXX-XXXX
        return digits
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    }
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
    // Clean CEP by removing any non-digit characters
    const cleanCEP = cep.replace(/\D/g, '');

    try {
        // Make the request to ViaCEP API
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);

        // Parse the response
        const data = await response.json();

        // Check if the API returned an error
        if (data.erro) {
            throw new Error('CEP não encontrado');
        }

        return data;
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        throw error;
    }
};