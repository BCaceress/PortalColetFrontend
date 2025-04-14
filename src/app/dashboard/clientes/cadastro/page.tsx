'use client';

import api from '@/services/api';
import { formatCEP, formatCNPJ, searchAddressByCEP } from '@/utils/formatters';
import { Building, FileText, Loader2, MapPin, Save, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Types
interface ClientePayload {
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
    nr_franquia_nf?: number;
    nr_qtde_documentos?: number;
    nr_valor_franqia?: number;
    nr_valor_excendente?: number;
    dt_data_contrato?: string;
}

export default function CadastroCliente() {
    const router = useRouter();

    // States
    const [formData, setFormData] = useState<ClientePayload>({
        ds_nome: '',
        ds_razao_social: '',
        nr_cnpj: '',
        ds_endereco: '',
        ds_cep: '',
        ds_uf: '',
        ds_cidade: '',
        ds_bairro: '',
        nr_numero: '',
        fl_matriz: true,
        ds_situacao: 'Ativo'
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof ClientePayload, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearchingCEP, setIsSearchingCEP] = useState(false);

    // Add a time formatter function
    const formatTimeHours = (value: string | undefined): string => {
        if (!value) return '';

        // If the value already has a colon, return as is
        if (value.includes(':')) return value;

        // Otherwise, convert to hours:minutes format
        const hours = Math.floor(parseInt(value) / 60);
        const minutes = parseInt(value) % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear validation error when user types
        if (formErrors[name as keyof ClientePayload]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof ClientePayload];
                return newErrors;
            });
        }

        // Verificar se o contrato é "Básico com Suporte" para habilitar os campos de Nomeados e Simultâneos
        if (name === 'ds_contrato') {
            // Se não for "Básico com Suporte", limpa os valores de nomeados e simultâneos
            if (value !== 'Básico com Suporte') {
                setFormData(prev => ({
                    ...prev,
                    nr_nomeados: undefined,
                    nr_simultaneos: undefined
                }));
            }
        }

        // Habilitar ou desabilitar campo Região com base no Diário de Viagem
        if (name === 'ds_diario_viagem') {
            if (value !== 'Sim') {
                setFormData(prev => ({
                    ...prev,
                    ds_regiao: '' // Limpar o valor da região se diário de viagem não for "Sim"
                }));
            }
        }
    };

    // Add a handler for time input
    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Only store the raw value in HH:MM format
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle checkbox change
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    // Handle number input change
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numberValue = value === '' ? undefined : parseFloat(value);
        setFormData(prev => ({ ...prev, [name]: numberValue }));
    };

    // Handle currency input change
    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Remove todos os caracteres não numéricos
        const numericValue = value.replace(/\D/g, '');

        // Converte para o formato monetário brasileiro (da direita para a esquerda)
        let formattedValue;

        if (numericValue === '') {
            formattedValue = '';
        } else {
            // Divide por 100 para transformar em reais,centavos
            const number = parseInt(numericValue, 10) / 100;
            formattedValue = number.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }

        // Atualiza o valor exibido no input
        e.target.value = formattedValue;

        // Converte para float usando ponto como separador decimal para armazenar no state
        const floatValue = formattedValue === '' ?
            undefined :
            parseFloat(formattedValue.replace('.', '').replace(',', '.'));

        setFormData(prev => ({ ...prev, [name]: floatValue }));
    };

    // Format currency for display
    const formatCurrency = (value: number | undefined): string => {
        if (value === undefined) return '';
        return value.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Handle CNPJ change with formatting
    const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const formattedCNPJ = formatCNPJ(value);

        setFormData(prev => ({ ...prev, nr_cnpj: formattedCNPJ }));

        // Clear validation error
        if (formErrors.nr_cnpj) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.nr_cnpj;
                return newErrors;
            });
        }
    };

    // Handle CEP change with formatting
    const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const formattedCEP = formatCEP(value);

        setFormData(prev => ({ ...prev, ds_cep: formattedCEP }));

        // Clear validation error
        if (formErrors.ds_cep) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.ds_cep;
                return newErrors;
            });
        }

        // Quando o CEP tiver 8 dígitos, fazer a busca automaticamente
        if (value.replace(/\D/g, '').length === 8) {
            fetchAddressByCEP(value.replace(/\D/g, ''));
        }
    };

    // Buscar endereço pelo CEP
    const fetchAddressByCEP = async (cep: string) => {
        try {
            setIsSearchingCEP(true);
            const data = await searchAddressByCEP(cep);

            setFormData(prev => ({
                ...prev,
                ds_endereco: data.logradouro || prev.ds_endereco,
                ds_bairro: data.bairro || prev.ds_bairro,
                ds_cidade: data.localidade || prev.ds_cidade,
                ds_uf: data.uf || prev.ds_uf,
                nr_codigo_ibge: data.ibge || prev.nr_codigo_ibge
            }));

            // Limpar erros relacionados aos campos preenchidos
            setFormErrors(prev => {
                const newErrors = { ...prev };
                if (data.logradouro) delete newErrors.ds_endereco;
                if (data.bairro) delete newErrors.ds_bairro;
                if (data.localidade) delete newErrors.ds_cidade;
                if (data.uf) delete newErrors.ds_uf;
                return newErrors;
            });
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        } finally {
            setIsSearchingCEP(false);
        }
    };

    // Voltar para a lista de clientes
    const handleCancel = () => {
        router.push('/dashboard/clientes');
    };

    // Form validation
    const validateForm = (): boolean => {
        const errors: Partial<Record<keyof ClientePayload, string>> = {};

        // Validação dos dados de identificação
        if (!formData.ds_nome.trim()) {
            errors.ds_nome = 'Nome da empresa é obrigatório';
        }

        if (!formData.ds_razao_social.trim()) {
            errors.ds_razao_social = 'Razão social é obrigatória';
        }

        if (!formData.nr_cnpj.trim()) {
            errors.nr_cnpj = 'CNPJ é obrigatório';
        } else if (formData.nr_cnpj.replace(/\D/g, '').length !== 14) {
            errors.nr_cnpj = 'CNPJ inválido';
        }

        // Validação dos dados de endereço
        if (!formData.ds_cep.trim()) {
            errors.ds_cep = 'CEP é obrigatório';
        } else if (formData.ds_cep.replace(/\D/g, '').length !== 8) {
            errors.ds_cep = 'CEP inválido';
        }

        if (!formData.ds_endereco.trim()) {
            errors.ds_endereco = 'Endereço é obrigatório';
        }

        if (!formData.ds_uf.trim()) {
            errors.ds_uf = 'UF é obrigatória';
        }

        if (!formData.ds_cidade.trim()) {
            errors.ds_cidade = 'Cidade é obrigatória';
        }

        if (!formData.ds_bairro.trim()) {
            errors.ds_bairro = 'Bairro é obrigatório';
        }

        if (!formData.nr_numero.trim()) {
            errors.nr_numero = 'Número é obrigatório';
        }

        // Validação de campos de contrato obrigatórios
        if (!formData.ds_situacao || !formData.ds_situacao.trim()) {
            errors.ds_situacao = 'Situação é obrigatória';
        }

        if (!formData.ds_sistema || !formData.ds_sistema.trim()) {
            errors.ds_sistema = 'Sistema é obrigatório';
        }

        if (!formData.ds_diario_viagem || !formData.ds_diario_viagem.trim()) {
            errors.ds_diario_viagem = 'Diário de Viagem é obrigatório';
        }

        if (!formData.ds_contrato || !formData.ds_contrato.trim()) {
            errors.ds_contrato = 'Contrato é obrigatório';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Field style classes
    const getInputClasses = (fieldName: keyof ClientePayload, disabled = false): string => {
        const baseClasses = "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200";

        if (disabled) {
            return `${baseClasses} border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed`;
        } else if (formErrors[fieldName]) {
            return `${baseClasses} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`;
        } else {
            return `${baseClasses} border-gray-200 text-gray-700 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 bg-white`;
        }
    };

    // Select box styles - separado para remover a seta padrão do navegador
    const getSelectClasses = (fieldName: keyof ClientePayload, disabled = false): string => {
        const baseClasses = "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 appearance-none";

        if (disabled) {
            return `${baseClasses} border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed`;
        } else if (formErrors[fieldName]) {
            return `${baseClasses} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`;
        } else {
            return `${baseClasses} border-gray-200 text-gray-700 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 bg-white`;
        }
    };

    // Button styles
    const getPrimaryButtonStyles = (): string => {
        const baseClasses = "inline-flex items-center px-5 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200";

        if (isSubmitting) {
            return `${baseClasses} bg-gray-500 cursor-not-allowed`;
        } else {
            return `${baseClasses} bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`;
        }
    };

    // Submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            setIsSubmitting(true);

            try {
                // Enviar dados para API
                await api.post('/clientes', formData);

                // Redirecionar para lista de clientes após sucesso
                router.push('/dashboard/clientes');
            } catch (error) {
                console.error('Erro ao cadastrar cliente:', error);
                alert('Ocorreu um erro ao cadastrar o cliente. Tente novamente.');
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="p-1 sm:p-6 max-w-7xl mx-auto">
            {/* Cabeçalho da página */}
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Novo Cliente</h1>
                </div>
                <p className="text-gray-500 mt-1">Preencha os campos abaixo para cadastrar um novo cliente no sistema</p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Card de dados de identificação */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center mb-5">
                            <Building size={20} className="mr-2 text-blue-500" />
                            <h2 className="text-lg font-semibold text-gray-800">Dados de Identificação</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

                            {/* Razão Social */}
                            <div className="relative md:col-span-2">
                                <label htmlFor="ds_razao_social" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Razão Social <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="text"
                                        id="ds_razao_social"
                                        name="ds_razao_social"
                                        value={formData.ds_razao_social}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className={`${getInputClasses('ds_razao_social')} flex-grow`}
                                        placeholder="Razão social da empresa"
                                    />
                                    <div className="flex-shrink-0 w-28">
                                        <div className="relative">
                                            <select
                                                id="fl_matriz"
                                                name="fl_matriz"
                                                value={formData.fl_matriz ? "m" : "f"}
                                                onChange={(e) => {
                                                    const value = e.target.value === "matriz";
                                                    setFormData(prev => ({ ...prev, fl_matriz: value }));
                                                }}
                                                disabled={isSubmitting}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 appearance-none"
                                            >
                                                <option value="m">Matriz</option>
                                                <option value="f">Filial</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {formErrors.ds_razao_social && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.ds_razao_social}</span>
                                    </p>
                                )}
                            </div>

                            {/* Nome da Empresa */}
                            <div className="relative">
                                <label htmlFor="ds_nome" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Nome da Empresa <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="ds_nome"
                                    name="ds_nome"
                                    value={formData.ds_nome}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('ds_nome')}
                                    placeholder="Nome da empresa"
                                />
                                {formErrors.ds_nome && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.ds_nome}</span>
                                    </p>
                                )}
                            </div>

                            {/* CNPJ */}
                            <div className="relative">
                                <label htmlFor="nr_cnpj" className="text-sm font-medium text-gray-700 mb-1 block">
                                    CNPJ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="nr_cnpj"
                                    name="nr_cnpj"
                                    value={formData.nr_cnpj}
                                    onChange={handleCNPJChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('nr_cnpj')}
                                    placeholder="00.000.000/0000-00"
                                    maxLength={18}
                                />
                                {formErrors.nr_cnpj && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.nr_cnpj}</span>
                                    </p>
                                )}
                            </div>

                            {/* Inscrição Estadual */}
                            <div className="relative">
                                <label htmlFor="nr_inscricao_estadual" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Inscrição Estadual
                                </label>
                                <input
                                    type="text"
                                    id="nr_inscricao_estadual"
                                    name="nr_inscricao_estadual"
                                    value={formData.nr_inscricao_estadual || ''}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('nr_inscricao_estadual')}
                                    placeholder="Inscrição estadual"
                                />
                                {formErrors.nr_inscricao_estadual && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.nr_inscricao_estadual}</span>
                                    </p>
                                )}
                            </div>

                            {/* Site */}
                            <div className="relative">
                                <label htmlFor="ds_site" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Site
                                </label>
                                <input
                                    type="text"
                                    id="ds_site"
                                    name="ds_site"
                                    value={formData.ds_site || ''}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('ds_site')}
                                    placeholder="www.empresa.com.br"
                                />
                                {formErrors.ds_site && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.ds_site}</span>
                                    </p>
                                )}
                            </div>

                            {/* Observações */}
                            <div className="relative md:col-span-2">
                                <label htmlFor="tx_observacao_ident" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Observações
                                </label>
                                <textarea
                                    id="tx_observacao_ident"
                                    name="tx_observacao_ident"
                                    value={formData.tx_observacao_ident || ''}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('tx_observacao_ident')}
                                    placeholder="Observações sobre a identificação"
                                    rows={4}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card de endereço */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center mb-5">
                            <MapPin size={20} className="mr-2 text-blue-500" />
                            <h2 className="text-lg font-semibold text-gray-800">Endereço</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-x-6 gap-y-5">
                            {/* CEP */}
                            <div className="relative">
                                <label htmlFor="ds_cep" className="text-sm font-medium text-gray-700 mb-1 block">
                                    CEP <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="ds_cep"
                                        name="ds_cep"
                                        value={formData.ds_cep}
                                        onChange={handleCEPChange}
                                        disabled={isSubmitting}
                                        className={getInputClasses('ds_cep')}
                                        placeholder="00000-000"
                                        maxLength={9}
                                    />
                                    {isSearchingCEP && (
                                        <div className="absolute inset-y-0 right-3 flex items-center">
                                            <Loader2 size={16} className="text-gray-400 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                {formErrors.ds_cep && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.ds_cep}</span>
                                    </p>
                                )}
                            </div>

                            {/* UF */}
                            <div className="relative">
                                <label htmlFor="ds_uf" className="text-sm font-medium text-gray-700 mb-1 block">
                                    UF <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="ds_uf"
                                        name="ds_uf"
                                        value={formData.ds_uf}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className={getSelectClasses('ds_uf')}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="AC">Acre</option>
                                        <option value="AL">Alagoas</option>
                                        <option value="AP">Amapá</option>
                                        <option value="AM">Amazonas</option>
                                        <option value="BA">Bahia</option>
                                        <option value="CE">Ceará</option>
                                        <option value="DF">Distrito Federal</option>
                                        <option value="ES">Espírito Santo</option>
                                        <option value="GO">Goiás</option>
                                        <option value="MA">Maranhão</option>
                                        <option value="MT">Mato Grosso</option>
                                        <option value="MS">Mato Grosso do Sul</option>
                                        <option value="MG">Minas Gerais</option>
                                        <option value="PA">Pará</option>
                                        <option value="PB">Paraíba</option>
                                        <option value="PR">Paraná</option>
                                        <option value="PE">Pernambuco</option>
                                        <option value="PI">Piauí</option>
                                        <option value="RJ">Rio de Janeiro</option>
                                        <option value="RN">Rio Grande do Norte</option>
                                        <option value="RS">Rio Grande do Sul</option>
                                        <option value="RO">Rondônia</option>
                                        <option value="RR">Roraima</option>
                                        <option value="SC">Santa Catarina</option>
                                        <option value="SP">São Paulo</option>
                                        <option value="SE">Sergipe</option>
                                        <option value="TO">Tocantins</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                                {formErrors.ds_uf && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.ds_uf}</span>
                                    </p>
                                )}
                            </div>

                            {/* Cidade */}
                            <div className="relative md:col-span-2">
                                <label htmlFor="ds_cidade" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Cidade <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="ds_cidade"
                                    name="ds_cidade"
                                    value={formData.ds_cidade}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('ds_cidade')}
                                    placeholder="Cidade"
                                />
                                {formErrors.ds_cidade && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.ds_cidade}</span>
                                    </p>
                                )}
                            </div>

                            {/* Bairro */}
                            <div className="relative">
                                <label htmlFor="ds_bairro" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Bairro <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="ds_bairro"
                                    name="ds_bairro"
                                    value={formData.ds_bairro}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('ds_bairro')}
                                    placeholder="Bairro"
                                />
                                {formErrors.ds_bairro && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.ds_bairro}</span>
                                    </p>
                                )}
                            </div>

                            {/* Endereço */}
                            <div className="relative md:col-span-3">
                                <label htmlFor="ds_endereco" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Endereço <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="ds_endereco"
                                    name="ds_endereco"
                                    value={formData.ds_endereco}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('ds_endereco')}
                                    placeholder="Rua, Avenida, Logradouro"
                                />
                                {formErrors.ds_endereco && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.ds_endereco}</span>
                                    </p>
                                )}
                            </div>

                            {/* Número */}
                            <div className="relative">
                                <label htmlFor="nr_numero" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Número <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="nr_numero"
                                    name="nr_numero"
                                    value={formData.nr_numero}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('nr_numero')}
                                    placeholder="Número"
                                />
                                {formErrors.nr_numero && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.nr_numero}</span>
                                    </p>
                                )}
                            </div>

                            {/* Código IBGE */}
                            <div className="relative">
                                <label htmlFor="nr_codigo_ibge" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Código IBGE
                                </label>
                                <input
                                    type="text"
                                    id="nr_codigo_ibge"
                                    name="nr_codigo_ibge"
                                    value={formData.nr_codigo_ibge || ''}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('nr_codigo_ibge')}
                                    placeholder="Código IBGE"
                                />
                            </div>


                            {/* Complemento */}
                            <div className="relative md:col-span-5">
                                <label htmlFor="ds_complemento" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Complemento
                                </label>
                                <input
                                    type="text"
                                    id="ds_complemento"
                                    name="ds_complemento"
                                    value={formData.ds_complemento || ''}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('ds_complemento')}
                                    placeholder="Apartamento, sala, conjunto"
                                />
                            </div>
                        </div>

                        {/* Informações adicionais de endereço (colapsável) */}
                        <details className="mt-6">
                            <summary className="text-sm font-medium text-blue-600 cursor-pointer flex items-center hover:text-blue-800 transition-colors duration-200">
                                Informações adicionais de localização
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1">
                                    <path d="M19 9L12 16L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </summary>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 pt-2 border-t border-gray-100">


                                {/* Latitude */}
                                <div className="relative">
                                    <label htmlFor="nr_latitude" className="text-sm font-medium text-gray-700 mb-1 block">
                                        Latitude
                                    </label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        id="nr_latitude"
                                        name="nr_latitude"
                                        value={formData.nr_latitude !== undefined ? formData.nr_latitude : ''}
                                        onChange={handleNumberChange}
                                        disabled={isSubmitting}
                                        className={getInputClasses('nr_latitude')}
                                        placeholder="Latitude"
                                    />
                                </div>

                                {/* Longitude */}
                                <div className="relative">
                                    <label htmlFor="nr_longitude" className="text-sm font-medium text-gray-700 mb-1 block">
                                        Longitude
                                    </label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        id="nr_longitude"
                                        name="nr_longitude"
                                        value={formData.nr_longitude !== undefined ? formData.nr_longitude : ''}
                                        onChange={handleNumberChange}
                                        disabled={isSubmitting}
                                        className={getInputClasses('nr_longitude')}
                                        placeholder="Longitude"
                                    />
                                </div>

                                {/* Distância */}
                                <div className="relative">
                                    <label htmlFor="nr_distancia_km" className="text-sm font-medium text-gray-700 mb-1 block">
                                        Distância (km)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        id="nr_distancia_km"
                                        name="nr_distancia_km"
                                        value={formData.nr_distancia_km !== undefined ? formData.nr_distancia_km : ''}
                                        onChange={handleNumberChange}
                                        disabled={isSubmitting}
                                        className={getInputClasses('nr_distancia_km')}
                                        placeholder="Distância em km"
                                    />
                                </div>
                            </div>
                        </details>
                    </div>
                </div>

                {/* Card de informações de contrato */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center mb-5">
                            <FileText size={20} className="mr-2 text-blue-500" />
                            <h2 className="text-lg font-semibold text-gray-800">Dados de Contrato</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-x-6 gap-y-5">
                            {/* Situação */}
                            <div className="relative md:col-span-2">
                                <label htmlFor="ds_situacao" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Situação <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="ds_situacao"
                                        name="ds_situacao"
                                        value={formData.ds_situacao}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className={getSelectClasses('ds_situacao')}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Implantação">Implantação</option>
                                        <option value="Produção">Produção</option>
                                        <option value="Restrição">Restrição</option>
                                        <option value="Inativo">Inativo</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                                {formErrors.ds_situacao && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.ds_situacao}</span>
                                    </p>
                                )}
                            </div>

                            {/* Sistema */}
                            <div className="relative md:col-span-1">
                                <label htmlFor="ds_sistema" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Sistema <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="ds_sistema"
                                        name="ds_sistema"
                                        value={formData.ds_sistema || ''}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className={getSelectClasses('ds_sistema')}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Manufatura">Manufatura</option>
                                        <option value="Curtume">Curtume</option>
                                        <option value="Tratamento Térmico">Tratamento Térmico</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                                {formErrors.ds_sistema && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.ds_sistema}</span>
                                    </p>
                                )}
                            </div>

                            {/* Data do Contrato - Modificado para mês/ano */}
                            <div className="relative">
                                <label htmlFor="dt_data_contrato" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Data do Contrato (Mês/Ano)
                                </label>
                                <input
                                    type="month"
                                    id="dt_data_contrato"
                                    name="dt_data_contrato"
                                    value={formData.dt_data_contrato || ''}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('dt_data_contrato')}
                                />
                            </div>

                            {/* Código ZZ */}
                            <div className="relative">
                                <label htmlFor="nr_codigo_zz" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Código ZZ
                                </label>
                                <input
                                    type="text"
                                    id="nr_codigo_zz"
                                    name="nr_codigo_zz"
                                    value={formData.nr_codigo_zz || ''}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('nr_codigo_zz')}
                                    placeholder="Código ZZ"
                                />
                            </div>

                            {/* Contrato - Agora é um select */}
                            <div className="relative">
                                <label htmlFor="ds_contrato" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Contrato <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="ds_contrato"
                                        name="ds_contrato"
                                        value={formData.ds_contrato || ''}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className={getSelectClasses('ds_contrato')}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Avançado">Avançado</option>
                                        <option value="Intermediário">Intermediário</option>
                                        <option value="Básico com Suporte">Básico com Suporte</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                                {formErrors.ds_contrato && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.ds_contrato}</span>
                                    </p>
                                )}
                            </div>

                            {/* Nomeados */}
                            <div className="relative">
                                <label htmlFor="nr_nomeados" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    Nomeados
                                    {formData.ds_contrato !== 'Básico com Suporte' && (
                                        <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center">
                                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0-002-2v-6a2 2-0-00-2-2H6a2 2-0-00-2 2v6a2 2-0-00-2 2zm10-10V7a4 4-0-00-8 0v4h8z" />
                                            </svg>
                                            Bloqueado
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    {formData.ds_contrato !== 'Básico com Suporte' && (
                                        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2-0-002-2v-6a2 2-0-00-2-2H6a2 2-0-00-2 2v6a2 2-0-00-2 2zm10-10V7a4 4-0-00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                    )}
                                    <input
                                        type="number"
                                        id="nr_nomeados"
                                        name="nr_nomeados"
                                        value={formData.nr_nomeados || ''}
                                        onChange={handleNumberChange}
                                        disabled={isSubmitting || formData.ds_contrato !== 'Básico com Suporte'}
                                        className={getInputClasses('nr_nomeados', formData.ds_contrato !== 'Básico com Suporte')}
                                        placeholder={formData.ds_contrato !== 'Básico com Suporte' ? "Requer contrato" : "Número de nomeados"}
                                        style={formData.ds_contrato !== 'Básico com Suporte' ? { paddingLeft: '2.5rem' } : {}}
                                    />
                                </div>

                            </div>

                            {/* Simultâneos */}
                            <div className="relative">
                                <label htmlFor="nr_simultaneos" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    Simultâneos
                                    {formData.ds_contrato !== 'Básico com Suporte' && (
                                        <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center">
                                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2-0-002-2v-6a2 2-0-00-2-2H6a2 2-0-00-2 2v6a2 2-0-00-2 2zm10-10V7a4 4-0-00-8 0v4h8z" />
                                            </svg>
                                            Bloqueado
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    {formData.ds_contrato !== 'Básico com Suporte' && (
                                        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2-0-002-2v-6a2 2-0-00-2-2H6a2 2-0-00-2 2v6a2 2-0-00-2 2zm10-10V7a4 4-0-00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                    )}
                                    <input
                                        type="number"
                                        id="nr_simultaneos"
                                        name="nr_simultaneos"
                                        value={formData.nr_simultaneos || ''}
                                        onChange={handleNumberChange}
                                        disabled={isSubmitting || formData.ds_contrato !== 'Básico com Suporte'}
                                        className={getInputClasses('nr_simultaneos', formData.ds_contrato !== 'Básico com Suporte')}
                                        placeholder={formData.ds_contrato !== 'Básico com Suporte' ? "Requer contrato" : "Número de simultâneos"}
                                        style={formData.ds_contrato !== 'Básico com Suporte' ? { paddingLeft: '2.5rem' } : {}}
                                    />
                                </div>
                            </div>

                            {/* Diário de Viagem */}
                            <div className="relative">
                                <label htmlFor="ds_diario_viagem" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Diário de Viagem <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="ds_diario_viagem"
                                        name="ds_diario_viagem"
                                        value={formData.ds_diario_viagem || ''}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className={getSelectClasses('ds_diario_viagem')}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Sim">Sim</option>
                                        <option value="Não">Não</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                                {formErrors.ds_diario_viagem && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.ds_diario_viagem}</span>
                                    </p>
                                )}
                            </div>

                            {/* Região - Alterado para select com opções específicas */}
                            <div className="relative">
                                <label htmlFor="ds_regiao" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    Região
                                    {formData.ds_diario_viagem !== 'Sim' && (
                                        <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center">
                                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2-0-002-2v-6a2 2-0-00-2-2H6a2 2-0-00-2 2v6a2 2-0-00-2 2zm10-10V7a4 4-0-00-8 0v4h8z" />
                                            </svg>
                                            Bloqueado
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    {formData.ds_diario_viagem !== 'Sim' && (
                                        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2-0-002-2v-6a2 2-0-00-2-2H6a2 2-0-00-2 2v6a2 2-0-00-2 2zm10-10V7a4 4-0-00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                    )}
                                    <select
                                        id="ds_regiao"
                                        name="ds_regiao"
                                        value={formData.ds_regiao || ''}
                                        onChange={handleChange}
                                        disabled={isSubmitting || formData.ds_diario_viagem !== 'Sim'}
                                        className={getSelectClasses('ds_regiao', formData.ds_diario_viagem !== 'Sim')}
                                        style={formData.ds_diario_viagem !== 'Sim' ? { paddingLeft: '2.5rem' } : {}}
                                    >
                                        <option value="">{formData.ds_diario_viagem !== 'Sim' ? "Requer Diário" : "Selecione"}</option>
                                        <option value="Capital">Capital</option>
                                        <option value="Interior">Interior</option>
                                        <option value="Exterior">Exterior</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Técnica Remoto */}
                            <div className="relative">
                                <label htmlFor="nr_tecnica_remoto" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Valor Hora Remoto (R$)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <span className="text-gray-500">R$</span>
                                    </div>
                                    <input
                                        type="text"
                                        id="nr_tecnica_remoto"
                                        name="nr_tecnica_remoto"
                                        value={formData.nr_tecnica_remoto !== undefined ? formatCurrency(formData.nr_tecnica_remoto) : ''}
                                        onChange={handleCurrencyChange}
                                        disabled={isSubmitting}
                                        className={`${getInputClasses('nr_tecnica_remoto')} pl-10`}
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>

                            {/* Técnica Presencial */}
                            <div className="relative">
                                <label htmlFor="nr_tecnica_presencial" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Valor Hora Presencial (R$)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <span className="text-gray-500">R$</span>
                                    </div>
                                    <input
                                        type="text"
                                        id="nr_tecnica_presencial"
                                        name="nr_tecnica_presencial"
                                        value={formData.nr_tecnica_presencial !== undefined ? formatCurrency(formData.nr_tecnica_presencial) : ''}
                                        onChange={handleCurrencyChange}
                                        disabled={isSubmitting}
                                        className={`${getInputClasses('nr_tecnica_presencial')} pl-10`}
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>

                            {/* Mínimo de Horas */}
                            <div className="relative">
                                <label htmlFor="tm_minimo_horas" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Mínimo de Horas
                                </label>
                                <input
                                    type="time"
                                    id="tm_minimo_horas"
                                    name="tm_minimo_horas"
                                    value={formData.tm_minimo_horas || ''}
                                    onChange={handleTimeChange} // Use the new handler
                                    disabled={isSubmitting}
                                    className={getInputClasses('tm_minimo_horas')}
                                    placeholder="00:00"
                                />
                            </div>

                            {/* Franquia NF */}
                            <div className="relative md:col-span-2">
                                <label htmlFor="nr_franquia_nf" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Franquia NF
                                </label>
                                <input
                                    type="number"
                                    id="nr_franquia_nf"
                                    name="nr_franquia_nf"
                                    value={formData.nr_franquia_nf || ''}
                                    onChange={handleNumberChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('nr_franquia_nf')}
                                    placeholder="Franquia NF"
                                />
                            </div>

                            {/* Quantidade de Documentos */}
                            <div className="relative">
                                <label htmlFor="nr_qtde_documentos" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Qtde de Documentos
                                </label>
                                <input
                                    type="number"
                                    id="nr_qtde_documentos"
                                    name="nr_qtde_documentos"
                                    value={formData.nr_qtde_documentos || ''}
                                    onChange={handleNumberChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('nr_qtde_documentos')}
                                    placeholder="Qtde de documentos"
                                />
                            </div>

                            {/* Valor da Franquia */}
                            <div className="relative">
                                <label htmlFor="nr_valor_franqia" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Valor da Franquia (R$)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <span className="text-gray-500">R$</span>
                                    </div>
                                    <input
                                        type="text"
                                        id="nr_valor_franqia"
                                        name="nr_valor_franqia"
                                        value={formData.nr_valor_franqia !== undefined ? formatCurrency(formData.nr_valor_franqia) : ''}
                                        onChange={handleCurrencyChange}
                                        disabled={isSubmitting}
                                        className={`${getInputClasses('nr_valor_franqia')} pl-10`}
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>

                            {/* Valor Excedente */}
                            <div className="relative">
                                <label htmlFor="nr_valor_excendente" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Valor Excedente (R$)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <span className="text-gray-500">R$</span>
                                    </div>
                                    <input
                                        type="text"
                                        id="nr_valor_excendente"
                                        name="nr_valor_excendente"
                                        value={formData.nr_valor_excendente !== undefined ? formatCurrency(formData.nr_valor_excendente) : ''}
                                        onChange={handleCurrencyChange}
                                        disabled={isSubmitting}
                                        className={`${getInputClasses('nr_valor_excendente')} pl-10`}
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>

                            {/* Observações do Contrato */}
                            <div className="relative md:col-span-5">
                                <label htmlFor="tx_observacao_contrato" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Observações do Contrato
                                </label>
                                <textarea
                                    id="tx_observacao_contrato"
                                    name="tx_observacao_contrato"
                                    value={formData.tx_observacao_contrato || ''}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('tx_observacao_contrato')}
                                    placeholder="Observações sobre o contrato"
                                    rows={4}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botões de ação */}
                <div className="flex justify-end space-x-3 sticky bottom-0 bg-gray-50 p-4 -mx-6 mt-8 border-t border-gray-200 shadow-md">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={getPrimaryButtonStyles()}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="mr-2 animate-spin" />
                                <span>Cadastrando...</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} className="mr-2" />
                                <span>Cadastrar Cliente</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}