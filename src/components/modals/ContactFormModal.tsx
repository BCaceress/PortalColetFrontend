'use client';

import api from '@/services/api';
import { FileEdit, Info, Loader2, Phone, Save, ShieldAlert, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormModal } from './FormModal';

// Types
interface Contato {
    id_contato?: number;
    nome: string;
    email: string;
    telefone: string;
    empresa: string;
    cargo: string;
    fl_ativo: boolean;
}

interface ContatoPayload {
    nome: string;
    email: string;
    telefone: string;
    empresa: string;
    cargo: string;
    fl_ativo: boolean;
}

type ModalMode = 'create' | 'edit' | 'view';

interface ContactFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    modalMode: ModalMode;
    currentContact?: Contato | null;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

export function ContactFormModal({
    isOpen,
    onClose,
    modalMode,
    currentContact,
    onSuccess,
    onError
}: ContactFormModalProps) {
    // Form state
    const [formData, setFormData] = useState<ContatoPayload>({
        nome: '',
        email: '',
        telefone: '',
        empresa: '',
        cargo: '',
        fl_ativo: true
    });

    // Form validation errors
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Loading state for form submission
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form data when modal opens or contact changes
    useEffect(() => {
        if (currentContact && (modalMode === 'edit' || modalMode === 'view')) {
            setFormData({
                nome: currentContact.nome,
                email: currentContact.email,
                telefone: currentContact.telefone,
                empresa: currentContact.empresa,
                cargo: currentContact.cargo,
                fl_ativo: currentContact.fl_ativo
            });
        } else {
            // Reset form for create mode - sempre com fl_ativo como true
            setFormData({
                nome: '',
                email: '',
                telefone: '',
                empresa: '',
                cargo: '',
                fl_ativo: true
            });
        }

        // Clear any previous errors
        setFormErrors({});
    }, [currentContact, modalMode, isOpen]);

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear validation error when user types
        if (formErrors[name]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Handle checkbox change
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    // Form validation
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.nome.trim()) {
            errors.nome = 'Nome é obrigatório';
        }

        if (!formData.email.trim()) {
            errors.email = 'E-mail é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'E-mail inválido';
        }

        if (!formData.telefone.trim()) {
            errors.telefone = 'Telefone é obrigatório';
        }

        if (!formData.empresa.trim()) {
            errors.empresa = 'Empresa é obrigatória';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Form submission handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Exit early for view mode
        if (modalMode === 'view') {
            onClose();
            return;
        }

        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            if (modalMode === 'create') {
                // Create new contact
                await api.post('/contatos', formData);
                onSuccess?.('Contato criado com sucesso!');
            } else if (modalMode === 'edit') {
                // Update existing contact
                await api.put(`/contatos/${currentContact?.id_contato}`, formData);
                onSuccess?.('Contato atualizado com sucesso!');
            }

            onClose();
        } catch (error) {
            console.error('Erro ao salvar contato:', error);
            onError?.(
                modalMode === 'create'
                    ? 'Erro ao criar contato. Tente novamente.'
                    : 'Erro ao atualizar contato. Tente novamente.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Modal title based on mode
    const getModalTitle = (): string => {
        switch (modalMode) {
            case 'create':
                return 'Adicionar Novo Contato';
            case 'edit':
                return 'Editar Contato';
            case 'view':
                return 'Detalhes do Contato';
            default:
                return 'Contato';
        }
    };

    // Modal icon based on mode
    const getModalIcon = () => {
        switch (modalMode) {
            case 'create':
                return <UserPlus size={20} className="mr-2 text-emerald-500" />;
            case 'edit':
                return <FileEdit size={20} className="mr-2 text-amber-500" />;
            case 'view':
                return <Info size={20} className="mr-2 text-blue-500" />;
            default:
                return null;
        }
    };

    // Field style classes - different for each mode
    const getInputClasses = (fieldName: string): string => {
        const baseClasses = "w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200";

        if (formErrors[fieldName]) {
            return `${baseClasses} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`;
        } else if (modalMode === 'view') {
            return `${baseClasses} border-blue-200 bg-blue-50 text-gray-700`;
        } else if (modalMode === 'edit') {
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
        } else if (modalMode === 'edit') {
            return `${baseClasses} bg-gradient-to-r from-amber-600 to-amber-500 hover:shadow-md focus:ring-amber-500`;
        } else {
            return `${baseClasses} bg-gradient-to-r from-emerald-600 to-emerald-500 hover:shadow-md focus:ring-emerald-500`;
        }
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={getModalTitle()}
            size="md"
            mode={modalMode}
            icon={getModalIcon()}
        >
            {modalMode === 'view' ? (
                <div className="space-y-6">
                    {/* Contact profile card with elegant design */}
                    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                        {/* Background pattern */}
                        <div
                            className="absolute top-0 right-0 w-full h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.2) 2px, transparent 0), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.2) 2px, transparent 0)',
                                backgroundSize: '100px 100px'
                            }}
                        />

                        {/* Contact avatar and name */}
                        <div className="relative pt-8 px-6 pb-6 flex flex-col items-center border-b border-gray-100">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-medium shadow-lg mb-4">
                                {formData.nome.slice(0, 1).toUpperCase()}
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 mb-1 text-center">{formData.nome}</h3>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                    {formData.cargo}
                                </span>

                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formData.fl_ativo
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                    }`}>
                                    <span className={`mr-1.5 w-2 h-2 rounded-full ${formData.fl_ativo ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                    {formData.fl_ativo ? 'Ativo' : 'Inativo'}
                                </div>
                            </div>
                            <span className="text-sm text-gray-500 font-medium">{formData.empresa}</span>
                        </div>

                        {/* Contact details with icons */}
                        <div className="p-6 space-y-5">
                            {/* Email info */}
                            <div className="flex items-center">
                                <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium mb-0.5">E-mail</p>
                                    <p className="text-sm text-gray-900 font-semibold">{formData.email}</p>
                                </div>
                            </div>

                            {/* Phone info */}
                            <div className="flex items-center">
                                <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 mr-4">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium mb-0.5">Telefone</p>
                                    <p className="text-sm text-gray-900 font-semibold">{formData.telefone}</p>
                                </div>
                            </div>

                            {/* Company info */}
                            <div className="flex items-center">
                                <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium mb-0.5">Empresa</p>
                                    <p className="text-sm text-gray-900 font-semibold">{formData.empresa}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Nome */}
                    <div className="relative">
                        <label htmlFor="nome" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                            Nome
                            {modalMode === 'edit' && currentContact?.nome && formData.nome !== currentContact.nome && (
                                <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Modificado</span>
                            )}
                        </label>
                        <input
                            type="text"
                            id="nome"
                            name="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            disabled={isSubmitting || modalMode === 'view'}
                            className={getInputClasses('nome')}
                            placeholder="Nome completo"
                        />
                        {formErrors.nome && (
                            <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                <ShieldAlert size={16} className="mr-1" />
                                {formErrors.nome}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="relative">
                        <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                            E-mail
                            {modalMode === 'edit' && currentContact?.email && formData.email !== currentContact.email && (
                                <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Modificado</span>
                            )}
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isSubmitting || modalMode === 'view'}
                            className={getInputClasses('email')}
                            placeholder="email@exemplo.com.br"
                        />
                        {formErrors.email && (
                            <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                <ShieldAlert size={16} className="mr-1" />
                                {formErrors.email}
                            </p>
                        )}
                    </div>

                    {/* Telefone */}
                    <div className="relative">
                        <label htmlFor="telefone" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                            Telefone
                            {modalMode === 'edit' && currentContact?.telefone && formData.telefone !== currentContact.telefone && (
                                <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Modificado</span>
                            )}
                        </label>
                        <input
                            type="text"
                            id="telefone"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleChange}
                            disabled={isSubmitting || modalMode === 'view'}
                            className={getInputClasses('telefone')}
                            placeholder="(00) 00000-0000"
                        />
                        {formErrors.telefone && (
                            <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                <ShieldAlert size={16} className="mr-1" />
                                {formErrors.telefone}
                            </p>
                        )}
                    </div>

                    {/* Empresa */}
                    <div className="relative">
                        <label htmlFor="empresa" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                            Empresa
                            {modalMode === 'edit' && currentContact?.empresa && formData.empresa !== currentContact.empresa && (
                                <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Modificado</span>
                            )}
                        </label>
                        <input
                            type="text"
                            id="empresa"
                            name="empresa"
                            value={formData.empresa}
                            onChange={handleChange}
                            disabled={isSubmitting || modalMode === 'view'}
                            className={getInputClasses('empresa')}
                            placeholder="Nome da empresa"
                        />
                        {formErrors.empresa && (
                            <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                <ShieldAlert size={16} className="mr-1" />
                                {formErrors.empresa}
                            </p>
                        )}
                    </div>

                    {/* Cargo */}
                    <div className="relative">
                        <label htmlFor="cargo" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                            Cargo
                            {modalMode === 'edit' && currentContact?.cargo && formData.cargo !== currentContact.cargo && (
                                <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Modificado</span>
                            )}
                        </label>
                        <input
                            type="text"
                            id="cargo"
                            name="cargo"
                            value={formData.cargo}
                            onChange={handleChange}
                            disabled={isSubmitting || modalMode === 'view'}
                            className={getInputClasses('cargo')}
                            placeholder="Cargo na empresa"
                        />
                    </div>

                    {/* Status (ativo/inativo) - apenas para edição */}
                    {modalMode === 'edit' && (
                        <div className="flex items-center">
                            <input
                                id="fl_ativo"
                                name="fl_ativo"
                                type="checkbox"
                                checked={formData.fl_ativo}
                                onChange={handleCheckboxChange}
                                disabled={isSubmitting}
                                className="h-4 w-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                            />
                            <label htmlFor="fl_ativo" className="ml-2 block text-sm text-gray-700">
                                Contato ativo
                            </label>
                        </div>
                    )}

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

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || modalMode === 'view'}
                            className={getPrimaryButtonStyles()}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="mr-2 animate-spin" />
                                    <span>Salvando...</span>
                                </>
                            ) : modalMode === 'create' ? (
                                <>
                                    <UserPlus size={18} className="mr-2" />
                                    <span>Adicionar</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} className="mr-2" />
                                    <span>Salvar</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </FormModal>
    );
}