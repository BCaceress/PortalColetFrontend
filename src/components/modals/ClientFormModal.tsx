'use client';

import { Building, ChevronLeft, ChevronRight, FileText, Info, Loader2, MapPin, Save, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormModal } from './FormModal';

// Types
interface Cliente {
    id_cliente?: number;
    ds_nome: string;
    ds_razao_social: string;
    nr_cnpj: string;
    nr_inscricao_estadual?: string;
    ds_site?: string;
    ds_endereco: string;
    ds_cep: string;
    ds_uf: string;
    ds_cidade: string;
    ds_bairro: string;
    nr_numero: string;
    ds_complemento?: string;
    nr_codigo_ibge?: string;
    nr_latitude?: number;
    nr_longitude?: number;
    nr_distancia_km?: number;
    fl_matriz: boolean;
    ds_situacao: string;
    ds_sistema?: string;
    ds_contrato?: string;
    fl_ativo: boolean;
}

interface ClientePayload {
    ds_nome: string;
    ds_razao_social: string;
    nr_cnpj: string;
    nr_inscricao_estadual?: string;
    ds_site?: string;
    ds_endereco: string;
    ds_cep: string;
    ds_uf: string;
    ds_cidade: string;
    ds_bairro: string;
    nr_numero: string;
    ds_complemento?: string;
    nr_codigo_ibge?: string;
    nr_latitude?: number;
    nr_longitude?: number;
    nr_distancia_km?: number;
    fl_matriz: boolean;
    ds_situacao: string;
    ds_sistema?: string;
    ds_contrato?: string;
    fl_ativo: boolean;
}

type ModalMode = 'create' | 'edit' | 'view';
type FormStep = 'identificacao' | 'endereco' | 'contrato';

interface ClientFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: ModalMode;
    cliente: Cliente | null;
    formData: ClientePayload;
    setFormData: React.Dispatch<React.SetStateAction<ClientePayload>>;
    formErrors: Partial<Record<keyof ClientePayload, string>>;
    setFormErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof ClientePayload, string>>>>;
    isSubmitting: boolean;
    setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ClientFormModal({
    isOpen,
    onClose,
    mode,
    cliente,
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    isSubmitting,
    setIsSubmitting
}: ClientFormModalProps) {
    // Current step state
    const [currentStep, setCurrentStep] = useState<FormStep>('identificacao');

    // Reset step when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentStep('identificacao');
        }
    }, [isOpen]);

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
    const [isSearchingCEP, setIsSearchingCEP] = useState(false);

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
            }
        }
    };

    const goToPreviousStep = () => {
        if (currentStep === 'endereco') {
            setCurrentStep('identificacao');
        } else if (currentStep === 'contrato') {
            setCurrentStep('endereco');
        }
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

    // Modal title based on mode and step
    const getModalTitle = (): string => {
        const baseTitle = mode === 'create'
            ? 'Adicionar Novo Cliente'
            : mode === 'edit'
                ? 'Editar Cliente'
                : 'Detalhes do Cliente';

        if (mode === 'view') return baseTitle;

        const stepTitle = currentStep === 'identificacao'
            ? '- Identificação'
            : currentStep === 'endereco'
                ? '- Endereço'
                : '- Contrato';

        return `${baseTitle} ${stepTitle}`;
    };

    // Modal icon based on mode and step
    const getModalIcon = () => {
        if (mode === 'view') {
            return <Info size={20} className="mr-2 text-blue-500" />;
        }

        if (currentStep === 'identificacao') {
            return <Building size={20} className={`mr-2 ${mode === 'create' ? 'text-emerald-500' : 'text-amber-500'}`} />;
        } else if (currentStep === 'endereco') {
            return <MapPin size={20} className={`mr-2 ${mode === 'create' ? 'text-emerald-500' : 'text-amber-500'}`} />;
        } else {
            return <FileText size={20} className={`mr-2 ${mode === 'create' ? 'text-emerald-500' : 'text-amber-500'}`} />;
        }
    };

    // Field style classes - different for each mode
    const getInputClasses = (fieldName: keyof ClientePayload): string => {
        const baseClasses = "w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200";

        if (formErrors[fieldName]) {
            return `${baseClasses} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`;
        } else if (mode === 'view') {
            return `${baseClasses} border-blue-200 bg-blue-50 text-gray-700`;
        } else if (mode === 'edit') {
            return `${baseClasses} border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-amber-500 focus:border-amber-500`;
        } else {
            return `${baseClasses} border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500`;
        }
    };

    // Color scheme based on mode for buttons
    const getPrimaryButtonStyles = (): string => {
        const baseClasses = "inline-flex items-center px-5 py-2.5 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200";

        if (isSubmitting) {
            return `${baseClasses} bg-gray-500`;
        } else if (mode === 'edit') {
            return `${baseClasses} bg-gradient-to-r from-amber-600 to-amber-500 hover:shadow-md focus:ring-amber-500`;
        } else {
            return `${baseClasses} bg-gradient-to-r from-emerald-600 to-emerald-500 hover:shadow-md focus:ring-emerald-500`;
        }
    };

    // Step progress indicator
    const StepProgress = () => {
        return (
            <div className="w-full mb-6">
                <div className="flex justify-between mb-2">
                    <div className={`flex flex-col items-center ${currentStep === 'identificacao' ? 'text-emerald-600' : 'text-gray-500'}`}>
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${currentStep === 'identificacao' ? 'border-emerald-500 bg-emerald-50' : currentStep === 'endereco' || currentStep === 'contrato' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'}`}>
                            1
                        </div>
                        <span className="text-xs mt-1">Identificação</span>
                    </div>
                    <div className={`flex flex-col items-center ${currentStep === 'endereco' ? 'text-emerald-600' : 'text-gray-500'}`}>
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${currentStep === 'endereco' ? 'border-emerald-500 bg-emerald-50' : currentStep === 'contrato' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'}`}>
                            2
                        </div>
                        <span className="text-xs mt-1">Endereço</span>
                    </div>
                    <div className={`flex flex-col items-center ${currentStep === 'contrato' ? 'text-emerald-600' : 'text-gray-500'}`}>
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${currentStep === 'contrato' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'}`}>
                            3
                        </div>
                        <span className="text-xs mt-1">Contrato</span>
                    </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300 ease-in-out"
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
                    <>
                        {/* Status (ativo/inativo) - apenas para edição */}
                        {mode === 'edit' && (
                            <div className="flex items-center mb-5">
                                <input
                                    id="fl_ativo"
                                    name="fl_ativo"
                                    type="checkbox"
                                    checked={formData.fl_ativo}
                                    onChange={handleCheckboxChange}
                                    disabled={isSubmitting || mode === 'view'}
                                    className="h-4 w-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                                />
                                <label htmlFor="fl_ativo" className="ml-2 block text-sm text-gray-700">
                                    Cliente ativo
                                </label>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            {/* Nome da Empresa */}
                            <div className="relative md:col-span-2">
                                <label htmlFor="ds_nome" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                    Nome da Empresa <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="ds_nome"
                                    name="ds_nome"
                                    value={formData.ds_nome}
                                    onChange={handleChange}
                                    disabled={isSubmitting || mode === 'view'}
                                    className={getInputClasses('ds_nome')}
                                    placeholder="Nome da empresa"
                                />
                                {formErrors.ds_nome && (
                                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={16} className="mr-1" />
                                        {formErrors.ds_nome}
                                    </p>
                                )}
                            </div>

                            {/* Razão Social */}
                            <div className="relative md:col-span-2">
                                <label htmlFor="ds_razao_social" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                    Razão Social <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="ds_razao_social"
                                    name="ds_razao_social"
                                    value={formData.ds_razao_social}
                                    onChange={handleChange}
                                    disabled={isSubmitting || mode === 'view'}
                                    className={getInputClasses('ds_razao_social')}
                                    placeholder="Razão social da empresa"
                                />
                                {formErrors.ds_razao_social && (
                                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={16} className="mr-1" />
                                        {formErrors.ds_razao_social}
                                    </p>
                                )}
                            </div>

                            {/* CNPJ */}
                            <div className="relative">
                                <label htmlFor="nr_cnpj" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                    CNPJ <span className="text-red-500 ml-1">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="nr_cnpj"
                                    name="nr_cnpj"
                                    value={formData.nr_cnpj}
                                    onChange={handleCNPJChange}
                                    disabled={isSubmitting || mode === 'view'}
                                    className={getInputClasses('nr_cnpj')}
                                    placeholder="00.000.000/0000-00"
                                    maxLength={18}
                                />
                                {formErrors.nr_cnpj && (
                                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={16} className="mr-1" />
                                        {formErrors.nr_cnpj}
                                    </p>
                                )}
                            </div>

                            {/* Inscrição Estadual */}
                            <div className="relative">
                                <label htmlFor="nr_inscricao_estadual" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                    Inscrição Estadual
                                </label>
                                <input
                                    type="text"
                                    id="nr_inscricao_estadual"
                                    name="nr_inscricao_estadual"
                                    value={formData.nr_inscricao_estadual || ''}
                                    onChange={handleChange}
                                    disabled={isSubmitting || mode === 'view'}
                                    className={getInputClasses('nr_inscricao_estadual')}
                                    placeholder="Inscrição estadual"
                                />
                                {formErrors.nr_inscricao_estadual && (
                                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={16} className="mr-1" />
                                        {formErrors.nr_inscricao_estadual}
                                    </p>
                                )}
                            </div>

                            {/* Site */}
                            <div className="relative md:col-span-2">
                                <label htmlFor="ds_site" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                    Site
                                </label>
                                <input
                                    type="text"
                                    id="ds_site"
                                    name="ds_site"
                                    value={formData.ds_site || ''}
                                    onChange={handleChange}
                                    disabled={isSubmitting || mode === 'view'}
                                    className={getInputClasses('ds_site')}
                                    placeholder="www.empresa.com.br"
                                />
                                {formErrors.ds_site && (
                                    <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={16} className="mr-1" />
                                        {formErrors.ds_site}
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                );
            case 'endereco':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                        {/* CEP */}
                        <div className="relative">
                            <label htmlFor="ds_cep" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                CEP <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="ds_cep"
                                    name="ds_cep"
                                    value={formData.ds_cep}
                                    onChange={handleCEPChange}
                                    disabled={isSubmitting || mode === 'view'}
                                    className={getInputClasses('ds_cep')}
                                    placeholder="00000-000"
                                    maxLength={9}
                                />
                                {isSearchingCEP && (
                                    <Loader2 size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" />
                                )}
                            </div>
                            {formErrors.ds_cep && (
                                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                    <ShieldAlert size={16} className="mr-1" />
                                    {formErrors.ds_cep}
                                </p>
                            )}
                        </div>

                        {/* UF */}
                        <div className="relative">
                            <label htmlFor="ds_uf" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                UF <span className="text-red-500 ml-1">*</span>
                            </label>
                            <select
                                id="ds_uf"
                                name="ds_uf"
                                value={formData.ds_uf}
                                onChange={handleChange}
                                disabled={isSubmitting || mode === 'view'}
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
                            {formErrors.ds_uf && (
                                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                    <ShieldAlert size={16} className="mr-1" />
                                    {formErrors.ds_uf}
                                </p>
                            )}
                        </div>

                        {/* Cidade */}
                        <div className="relative">
                            <label htmlFor="ds_cidade" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                Cidade <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="text"
                                id="ds_cidade"
                                name="ds_cidade"
                                value={formData.ds_cidade}
                                onChange={handleChange}
                                disabled={isSubmitting || mode === 'view'}
                                className={getInputClasses('ds_cidade')}
                                placeholder="Cidade"
                            />
                            {formErrors.ds_cidade && (
                                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                    <ShieldAlert size={16} className="mr-1" />
                                    {formErrors.ds_cidade}
                                </p>
                            )}
                        </div>

                        {/* Endereço */}
                        <div className="relative md:col-span-2">
                            <label htmlFor="ds_endereco" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                Endereço <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="text"
                                id="ds_endereco"
                                name="ds_endereco"
                                value={formData.ds_endereco}
                                onChange={handleChange}
                                disabled={isSubmitting || mode === 'view'}
                                className={getInputClasses('ds_endereco')}
                                placeholder="Rua, Avenida, Logradouro"
                            />
                            {formErrors.ds_endereco && (
                                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                    <ShieldAlert size={16} className="mr-1" />
                                    {formErrors.ds_endereco}
                                </p>
                            )}
                        </div>

                        {/* Número */}
                        <div className="relative">
                            <label htmlFor="nr_numero" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                Número <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="text"
                                id="nr_numero"
                                name="nr_numero"
                                value={formData.nr_numero}
                                onChange={handleChange}
                                disabled={isSubmitting || mode === 'view'}
                                className={getInputClasses('nr_numero')}
                                placeholder="Número"
                            />
                            {formErrors.nr_numero && (
                                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                    <ShieldAlert size={16} className="mr-1" />
                                    {formErrors.nr_numero}
                                </p>
                            )}
                        </div>

                        {/* Bairro */}
                        <div className="relative">
                            <label htmlFor="ds_bairro" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                Bairro <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="text"
                                id="ds_bairro"
                                name="ds_bairro"
                                value={formData.ds_bairro}
                                onChange={handleChange}
                                disabled={isSubmitting || mode === 'view'}
                                className={getInputClasses('ds_bairro')}
                                placeholder="Bairro"
                            />
                            {formErrors.ds_bairro && (
                                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                    <ShieldAlert size={16} className="mr-1" />
                                    {formErrors.ds_bairro}
                                </p>
                            )}
                        </div>

                        {/* Complemento */}
                        <div className="relative">
                            <label htmlFor="ds_complemento" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                Complemento
                            </label>
                            <input
                                type="text"
                                id="ds_complemento"
                                name="ds_complemento"
                                value={formData.ds_complemento || ''}
                                onChange={handleChange}
                                disabled={isSubmitting || mode === 'view'}
                                className={getInputClasses('ds_complemento')}
                                placeholder="Apartamento, sala, conjunto"
                            />
                        </div>

                        {/* Código IBGE */}
                        <div className="relative">
                            <label htmlFor="nr_codigo_ibge" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                Código IBGE
                            </label>
                            <input
                                type="text"
                                id="nr_codigo_ibge"
                                name="nr_codigo_ibge"
                                value={formData.nr_codigo_ibge || ''}
                                onChange={handleChange}
                                disabled={isSubmitting || mode === 'view'}
                                className={getInputClasses('nr_codigo_ibge')}
                                placeholder="Código IBGE"
                            />
                        </div>

                        {/* Latitude */}
                        <div className="relative">
                            <label htmlFor="nr_latitude" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                Latitude
                            </label>
                            <input
                                type="number"
                                step="0.000001"
                                id="nr_latitude"
                                name="nr_latitude"
                                value={formData.nr_latitude !== undefined ? formData.nr_latitude : ''}
                                onChange={handleNumberChange}
                                disabled={isSubmitting || mode === 'view'}
                                className={getInputClasses('nr_latitude')}
                                placeholder="Latitude"
                            />
                        </div>

                        {/* Longitude */}
                        <div className="relative">
                            <label htmlFor="nr_longitude" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                Longitude
                            </label>
                            <input
                                type="number"
                                step="0.000001"
                                id="nr_longitude"
                                name="nr_longitude"
                                value={formData.nr_longitude !== undefined ? formData.nr_longitude : ''}
                                onChange={handleNumberChange}
                                disabled={isSubmitting || mode === 'view'}
                                className={getInputClasses('nr_longitude')}
                                placeholder="Longitude"
                            />
                        </div>

                        {/* Distância */}
                        <div className="relative">
                            <label htmlFor="nr_distancia_km" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                Distância (km)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                id="nr_distancia_km"
                                name="nr_distancia_km"
                                value={formData.nr_distancia_km !== undefined ? formData.nr_distancia_km : ''}
                                onChange={handleNumberChange}
                                disabled={isSubmitting || mode === 'view'}
                                className={getInputClasses('nr_distancia_km')}
                                placeholder="Distância em km"
                            />
                        </div>
                    </div>
                );
            case 'contrato':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {/* Tipo (Matriz/Filial) */}
                        <div className="flex items-center mb-2">
                            <input
                                id="fl_matriz"
                                name="fl_matriz"
                                type="checkbox"
                                checked={formData.fl_matriz}
                                onChange={handleCheckboxChange}
                                disabled={isSubmitting || mode === 'view'}
                                className="h-4 w-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                            />
                            <label htmlFor="fl_matriz" className="ml-2 block text-sm text-gray-700">
                                Cliente matriz
                            </label>
                        </div>

                        {/* Espaço em branco para balancear o grid */}
                        <div></div>

                        {/* Situação */}
                        <div className="relative">
                            <label htmlFor="ds_situacao" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                Situação <span className="text-red-500 ml-1">*</span>
                            </label>
                            <select
                                id="ds_situacao"
                                name="ds_situacao"
                                value={formData.ds_situacao}
                                onChange={handleChange}
                                disabled={isSubmitting || mode === 'view'}
                                className={getInputClasses('ds_situacao')}
                            >
                                <option value="">Selecione</option>
                                <option value="Ativo">Ativo</option>
                                <option value="Inativo">Inativo</option>
                                <option value="Prospecto">Prospecto</option>
                                <option value="Em negociação">Em negociação</option>
                            </select>
                            {formErrors.ds_situacao && (
                                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                    <ShieldAlert size={16} className="mr-1" />
                                    {formErrors.ds_situacao}
                                </p>
                            )}
                        </div>

                        {/* Sistema */}
                        <div className="relative">
                            <label htmlFor="ds_sistema" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                Sistema
                            </label>
                            <input
                                type="text"
                                id="ds_sistema"
                                name="ds_sistema"
                                value={formData.ds_sistema || ''}
                                onChange={handleChange}
                                disabled={isSubmitting || mode === 'view'}
                                className={getInputClasses('ds_sistema')}
                                placeholder="Sistema utilizado pelo cliente"
                            />
                        </div>

                        {/* Contrato - Ocupa as duas colunas */}
                        <div className="relative md:col-span-2">
                            <label htmlFor="ds_contrato" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                                Contrato
                            </label>
                            <textarea
                                id="ds_contrato"
                                name="ds_contrato"
                                value={formData.ds_contrato || ''}
                                onChange={handleChange}
                                disabled={isSubmitting || mode === 'view'}
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

    // Step buttons
    const renderStepButtons = () => {
        if (mode === 'view') {
            return (
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                >
                    Fechar
                </button>
            );
        }

        return (
            <>
                {/* Previous button - not shown on first step */}
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
                                <span>Salvando...</span>
                            </>
                        ) : mode === 'create' ? (
                            <>
                                <Building size={18} className="mr-2" />
                                <span>Adicionar</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} className="mr-2" />
                                <span>Salvar</span>
                            </>
                        )}
                    </button>
                )}
            </>
        );
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={getModalTitle()}
            size="2xl"
            mode={mode}
            icon={getModalIcon()}
        >
            {mode === 'view' ? (
                <div className="space-y-6">
                    {/* Client profile card with elegant design - View mode */}
                    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                        {/* Background pattern */}
                        <div
                            className="absolute top-0 right-0 w-full h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.2) 2px, transparent 0), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.2) 2px, transparent 0)',
                                backgroundSize: '100px 100px'
                            }}
                        />

                        {/* Client avatar and name */}
                        <div className="relative pt-8 px-6 pb-6 flex flex-col items-center border-b border-gray-100">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-medium shadow-lg mb-4">
                                {formData.ds_nome.slice(0, 1).toUpperCase()}
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 mb-1 text-center">{formData.ds_nome}</h3>
                            <p className="text-gray-500 text-sm mb-2">{formData.ds_razao_social}</p>

                            <div className="flex items-center gap-2 mb-3">
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formData.fl_ativo
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                    }`}>
                                    <span className={`mr-1.5 w-2 h-2 rounded-full ${formData.fl_ativo ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                    {formData.fl_ativo ? 'Ativo' : 'Inativo'}
                                </div>

                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formData.fl_matriz
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                    }`}>
                                    {formData.fl_matriz ? 'Matriz' : 'Filial'}
                                </div>
                            </div>

                            <span className="text-sm text-gray-500 font-medium">{formData.nr_cnpj}</span>
                            {formData.nr_inscricao_estadual && (
                                <span className="text-sm text-gray-500">IE: {formData.nr_inscricao_estadual}</span>
                            )}
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-5">
                                    {/* Site */}
                                    {formData.ds_site && (
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mr-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium mb-0.5">Website</p>
                                                <p className="text-sm text-gray-900 font-semibold">{formData.ds_site}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Endereço completo */}
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 mr-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium mb-0.5">Endereço</p>
                                            <p className="text-sm text-gray-900 font-semibold">
                                                {`${formData.ds_endereco}, ${formData.nr_numero}${formData.ds_complemento ? `, ${formData.ds_complemento}` : ''}`}
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                {`${formData.ds_bairro}, ${formData.ds_cidade} - ${formData.ds_uf}, ${formData.ds_cep}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {/* Contrato */}
                                    {formData.ds_contrato && (
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 mr-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium mb-0.5">Contrato</p>
                                                <p className="text-sm text-gray-900 font-semibold">{formData.ds_contrato}</p>
                                                {formData.ds_sistema && (
                                                    <p className="text-sm text-gray-600">Sistema: {formData.ds_sistema}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Situação */}
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 mr-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium mb-0.5">Situação</p>
                                            <p className="text-sm text-gray-900 font-semibold">{formData.ds_situacao}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action button */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm font-medium text-white bg-blue-500 rounded-lg shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={(e) => {
                    e.preventDefault();
                    if (currentStep === 'contrato' && validateFinalStep()) {
                        setIsSubmitting(true);
                        // Aqui seria implementada a lógica de submissão do formulário
                        setTimeout(() => {
                            setIsSubmitting(false);
                            onClose();
                        }, 1500);
                    }
                }} className="space-y-5">
                    {/* Progress steps */}
                    {mode !== 'view' && <StepProgress />}

                    {/* Dynamic form content based on current step */}
                    {renderFormStep()}

                    {/* Action buttons */}
                    <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-gray-100">
                        {/* Cancel button */}
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
                        >
                            Cancelar
                        </button>

                        {/* Step-specific buttons */}
                        {renderStepButtons()}
                    </div>
                </form>
            )}
        </FormModal>
    );
}