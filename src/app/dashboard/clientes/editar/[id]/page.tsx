'use client';

import api from '@/services/api';
import { ArrowLeft, Building, ChevronLeft, ChevronRight, FileText, Loader2, MapPin, Save, ShieldAlert } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Types
interface ClientePayload {
    ds_nome: string;
    ds_razao_social: string;
    nr_cnpj: string;
    fl_ativo: boolean;
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
}

interface Cliente extends ClientePayload {
    id: string;
}

type FormStep = 'identificacao' | 'endereco' | 'contrato';

export default function EditarCliente() {
    const router = useRouter();
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    // States
    const [currentStep, setCurrentStep] = useState<FormStep>('identificacao');
    const [formData, setFormData] = useState<ClientePayload>({
        ds_nome: '',
        ds_razao_social: '',
        nr_cnpj: '',
        fl_ativo: true,
        ds_endereco: '',
        ds_cep: '',
        ds_uf: '',
        ds_cidade: '',
        ds_bairro: '',
        nr_numero: '',
        fl_matriz: false,
        ds_situacao: 'Ativo'
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof ClientePayload, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearchingCEP, setIsSearchingCEP] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch client data
    useEffect(() => {
        const fetchCliente = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await api.get(`/clientes/${id}`);
                const clienteData = response.data;
                setFormData(clienteData);
                setIsLoading(false);
            } catch (err) {
                console.error('Erro ao buscar dados do cliente:', err);
                setError('Não foi possível carregar os dados do cliente. Tente novamente.');
                setIsLoading(false);
            }
        };

        if (id) {
            fetchCliente();
        }
    }, [id]);

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

    // CNPJ Formatting
    const formatCNPJ = (value: string) => {
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

    // CEP Formatting
    const formatCEP = (value: string) => {
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
            searchAddressByCEP(value.replace(/\D/g, ''));
        }
    };

    // Buscar endereço pelo CEP
    const searchAddressByCEP = async (cep: string) => {
        try {
            setIsSearchingCEP(true);
            // Utilizando uma API pública para buscar o CEP (ViaCEP)
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (!data.erro) {
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
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        } finally {
            setIsSearchingCEP(false);
        }
    };

    // Step navigation
    const goToNextStep = () => {
        if (currentStep === 'identificacao') {
            // Validate identification fields
            const errors: Partial<Record<keyof ClientePayload, string>> = {};

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

            setFormErrors(errors);

            if (Object.keys(errors).length === 0) {
                setCurrentStep('endereco');
                window.scrollTo(0, 0);
            }
        } else if (currentStep === 'endereco') {
            // Validate address fields
            const errors: Partial<Record<keyof ClientePayload, string>> = {};

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

            setFormErrors(errors);

            if (Object.keys(errors).length === 0) {
                setCurrentStep('contrato');
                window.scrollTo(0, 0);
            }
        }
    };

    const goToPreviousStep = () => {
        if (currentStep === 'endereco') {
            setCurrentStep('identificacao');
        } else if (currentStep === 'contrato') {
            setCurrentStep('endereco');
        }
        window.scrollTo(0, 0);
    };

    // Form validation for final step
    const validateFinalStep = (): boolean => {
        const errors: Partial<Record<keyof ClientePayload, string>> = {};

        if (!formData.ds_situacao.trim()) {
            errors.ds_situacao = 'Situação é obrigatória';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Field style classes
    const getInputClasses = (fieldName: keyof ClientePayload): string => {
        const baseClasses = "w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200";

        if (formErrors[fieldName]) {
            return `${baseClasses} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`;
        } else {
            return `${baseClasses} border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-amber-500 focus:border-amber-500`;
        }
    };

    // Button styles
    const getPrimaryButtonStyles = (): string => {
        const baseClasses = "inline-flex items-center px-5 py-2.5 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200";

        if (isSubmitting) {
            return `${baseClasses} bg-gray-500`;
        } else {
            return `${baseClasses} bg-gradient-to-r from-amber-600 to-amber-500 hover:shadow-md focus:ring-amber-500`;
        }
    };

    // Voltar para a lista de clientes
    const handleCancel = () => {
        router.push('/dashboard/clientes');
    };

    // Submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (currentStep === 'contrato' && validateFinalStep()) {
            setIsSubmitting(true);

            try {
                // Enviar dados para API
                await api.put(`/clientes/${id}`, formData);

                // Redirecionar para lista de clientes após sucesso
                router.push('/dashboard/clientes');
            } catch (error) {
                console.error('Erro ao atualizar cliente:', error);
                alert('Ocorreu um erro ao atualizar o cliente. Tente novamente.');
                setIsSubmitting(false);
            }
        }
    };

    // Step progress indicator
    const StepProgress = () => {
        return (
            <div className="w-full mb-6">
                <div className="flex justify-between mb-2">
                    <div className={`flex flex-col items-center ${currentStep === 'identificacao' ? 'text-amber-600' : 'text-gray-500'}`}>
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${currentStep === 'identificacao' ? 'border-amber-500 bg-amber-50' : currentStep === 'endereco' || currentStep === 'contrato' ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300'}`}>
                            1
                        </div>
                        <span className="text-xs mt-1">Identificação</span>
                    </div>
                    <div className={`flex flex-col items-center ${currentStep === 'endereco' ? 'text-amber-600' : 'text-gray-500'}`}>
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${currentStep === 'endereco' ? 'border-amber-500 bg-amber-50' : currentStep === 'contrato' ? 'bg-amber-500 border-amber-500 text-white' : 'border-gray-300'}`}>
                            2
                        </div>
                        <span className="text-xs mt-1">Endereço</span>
                    </div>
                    <div className={`flex flex-col items-center ${currentStep === 'contrato' ? 'text-amber-600' : 'text-gray-500'}`}>
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${currentStep === 'contrato' ? 'border-amber-500 bg-amber-50' : 'border-gray-300'}`}>
                            3
                        </div>
                        <span className="text-xs mt-1">Contrato</span>
                    </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all duration-300 ease-in-out"
                        style={{ width: currentStep === 'identificacao' ? '33.3%' : currentStep === 'endereco' ? '66.6%' : '100%' }}
                    ></div>
                </div>
            </div>
        );
    };

    // Render form based on current step
    const renderFormStep = () => {
        switch (currentStep) {
            case 'identificacao':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        {/* Nome da Empresa */}
                        <div className="relative md:col-span-2">
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

                        {/* Razão Social */}
                        <div className="relative md:col-span-2">
                            <label htmlFor="ds_razao_social" className="text-sm font-medium text-gray-700 mb-1 block">
                                Razão Social <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="ds_razao_social"
                                name="ds_razao_social"
                                value={formData.ds_razao_social}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className={getInputClasses('ds_razao_social')}
                                placeholder="Razão social da empresa"
                            />
                            {formErrors.ds_razao_social && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                    <span>{formErrors.ds_razao_social}</span>
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
                        <div className="relative md:col-span-2">
                            <label htmlFor="ds_site" className="text-sm font-medium text-gray-700 mb-1 block">
                                Site
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                    <span>https://</span>
                                </div>
                                <input
                                    type="text"
                                    id="ds_site"
                                    name="ds_site"
                                    value={formData.ds_site || ''}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={`${getInputClasses('ds_site')} pl-16`}
                                    placeholder="www.empresa.com.br"
                                />
                            </div>
                            {formErrors.ds_site && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                    <span>{formErrors.ds_site}</span>
                                </p>
                            )}
                        </div>
                    </div>
                );
            case 'endereco':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
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
                                    className={getInputClasses('ds_uf')}
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
                        <div className="relative">
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

                        {/* Endereço */}
                        <div className="relative md:col-span-2">
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

                        {/* Complemento */}
                        <div className="relative md:col-span-3">
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

                        {/* Seção de informações adicionais com expansão opcional */}
                        <div className="md:col-span-3 pt-2">
                            <details className="group">
                                <summary className="flex items-center text-sm font-medium text-gray-700 cursor-pointer mb-2 hover:text-gray-900 transition-colors duration-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 transition-transform duration-200 group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Informações adicionais
                                </summary>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mt-4 pl-6 border-l-2 border-gray-100">
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
                );
            case 'contrato':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        {/* Tipo (Matriz/Filial) */}
                        <div className="flex items-center mb-2">
                            <div className="relative inline-flex items-center">
                                <input
                                    id="fl_matriz"
                                    name="fl_matriz"
                                    type="checkbox"
                                    checked={formData.fl_matriz}
                                    onChange={handleCheckboxChange}
                                    disabled={isSubmitting}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                                <span className="ml-3 text-sm font-medium text-gray-700">Cliente matriz</span>
                            </div>
                        </div>

                        {/* Status do cliente */}
                        <div className="flex items-center mb-2">
                            <div className="relative inline-flex items-center">
                                <input
                                    id="fl_ativo"
                                    name="fl_ativo"
                                    type="checkbox"
                                    checked={formData.fl_ativo}
                                    onChange={handleCheckboxChange}
                                    disabled={isSubmitting}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-emerald-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                <span className="ml-3 text-sm font-medium text-gray-700">Cliente ativo</span>
                            </div>
                        </div>

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
                                    className={getInputClasses('ds_situacao')}
                                >
                                    <option value="">Selecione</option>
                                    <option value="Ativo">Ativo</option>
                                    <option value="Inativo">Inativo</option>
                                    <option value="Prospecto">Prospecto</option>
                                    <option value="Em negociação">Em negociação</option>
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
                        <div className="relative md:col-span-2">
                            <label htmlFor="ds_sistema" className="text-sm font-medium text-gray-700 mb-1 block">
                                Sistema
                            </label>
                            <input
                                type="text"
                                id="ds_sistema"
                                name="ds_sistema"
                                value={formData.ds_sistema || ''}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className={getInputClasses('ds_sistema')}
                                placeholder="Sistema utilizado pelo cliente"
                            />
                        </div>

                        {/* Contrato - Ocupa as duas colunas */}
                        <div className="relative md:col-span-2">
                            <label htmlFor="ds_contrato" className="text-sm font-medium text-gray-700 mb-1 block">
                                Contrato
                            </label>
                            <textarea
                                id="ds_contrato"
                                name="ds_contrato"
                                value={formData.ds_contrato || ''}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className={getInputClasses('ds_contrato')}
                                placeholder="Detalhes do contrato"
                                rows={4}
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // Função para determinar o título da etapa
    const getCurrentStepTitle = () => {
        switch (currentStep) {
            case 'identificacao':
                return (
                    <div className="flex items-center">
                        <Building size={20} className="mr-2 text-amber-500" />
                        <span>Dados de Identificação</span>
                    </div>
                );
            case 'endereco':
                return (
                    <div className="flex items-center">
                        <MapPin size={20} className="mr-2 text-amber-500" />
                        <span>Dados de Endereço</span>
                    </div>
                );
            case 'contrato':
                return (
                    <div className="flex items-center">
                        <FileText size={20} className="mr-2 text-amber-500" />
                        <span>Dados de Contrato</span>
                    </div>
                );
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="p-1 sm:p-4 max-w-7xl mx-auto">
                <div className="flex flex-col items-center justify-center h-96">
                    <Loader2 size={40} className="text-amber-500 animate-spin mb-4" />
                    <p className="text-gray-600">Carregando dados do cliente...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="p-1 sm:p-4 max-w-7xl mx-auto">
                <div className="flex flex-col items-center justify-center h-96">
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
                        <div className="flex items-center">
                            <ShieldAlert className="text-red-500 mr-3" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="flex items-center justify-center px-4 py-2 bg-amber-500 text-white rounded-lg shadow hover:bg-amber-600 transition-colors"
                    >
                        <ArrowLeft className="mr-2" size={16} />
                        Voltar para lista de clientes
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-1 sm:p-4 max-w-7xl mx-auto">
            {/* Cabeçalho da página */}
            <div className="mb-6">
                <button
                    onClick={handleCancel}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft className="mr-2" size={18} />
                    <span>Voltar para lista de clientes</span>
                </button>

                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Editar Cliente</h1>
                </div>
                <p className="text-gray-600 mt-1">Edite os dados de cliente <strong>{formData.ds_nome}</strong></p>
            </div>

            {/* Card do formulário */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="p-6">
                    {/* Progresso */}
                    <StepProgress />

                    {/* Título da seção atual */}
                    <h2 className="text-lg font-medium text-gray-800 mb-5">
                        {getCurrentStepTitle()}
                    </h2>

                    {/* Formulário */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Conteúdo do formulário baseado na etapa atual */}
                        {renderFormStep()}

                        {/* Botões de ação */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                            {currentStep !== 'identificacao' && (
                                <button
                                    type="button"
                                    onClick={goToPreviousStep}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
                                >
                                    <ChevronLeft size={16} className="mr-2" />
                                    Voltar
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
                            >
                                Cancelar
                            </button>

                            {/* Next button on first and second step */}
                            {currentStep !== 'contrato' ? (
                                <button
                                    type="button"
                                    onClick={goToNextStep}
                                    disabled={isSubmitting}
                                    className={getPrimaryButtonStyles()}
                                >
                                    Próximo
                                    <ChevronRight size={16} className="ml-2" />
                                </button>
                            ) : (
                                // Submit button on last step
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={getPrimaryButtonStyles()}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="mr-2 animate-spin" />
                                            <span>Atualizando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} className="mr-2" />
                                            <span>Atualizar Cliente</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}