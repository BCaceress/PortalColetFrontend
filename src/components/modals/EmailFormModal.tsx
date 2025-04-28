'use client';

import api from '@/services/api';
import { Dialog, Transition } from '@headlessui/react';
import { AtSign, Check, X } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';

// Interface for client email data
interface EmailData {
    id_email?: number;
    id_cliente: number;
    ds_email: string; // This will store multiple emails separated by semicolons
}

// Props for the email form modal
interface EmailFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    modalMode: 'create' | 'edit';
    currentEmail: EmailData | null;
    cliente: { id_cliente: number; ds_nome: string } | null;
    onSuccess?: (message: string) => void;
    onError?: (message: string) => void;
}

export const EmailFormModal: React.FC<EmailFormModalProps> = ({
    isOpen,
    onClose,
    modalMode,
    currentEmail,
    cliente,
    onSuccess,
    onError,
}) => {
    // Form data state
    const [formData, setFormData] = useState<EmailData>({
        id_email: undefined,
        id_cliente: 0,
        ds_email: '',
    });

    // Form error state
    const [formErrors, setFormErrors] = useState<{
        [key: string]: string;
    }>({});

    // Loading state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingEmails, setIsLoadingEmails] = useState(false);

    // Initialize form data when modal opens or props change
    useEffect(() => {
        if (isOpen) {
            if (modalMode === 'edit' && currentEmail) {
                setFormData({
                    ...currentEmail
                });
            } else {
                // Create mode - initialize with default values
                setFormData({
                    id_email: undefined,
                    id_cliente: cliente?.id_cliente || 0,
                    ds_email: '',
                });

                // Load existing emails if cliente is provided
                if (cliente?.id_cliente) {
                    loadClienteEmails(cliente.id_cliente);
                }
            }
            // Clear any previous form errors
            setFormErrors({});
        }
    }, [isOpen, modalMode, currentEmail, cliente]);

    // Load existing emails for the client
    const loadClienteEmails = async (clienteId: number) => {
        if (!clienteId) return;

        setIsLoadingEmails(true);
        try {
            const response = await api.get(`/clientes/${clienteId}/emails`);
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                // Join all emails with semicolon
                const emails = response.data.map((email: any) => email.ds_email).join(';');
                setFormData(prev => ({
                    ...prev,
                    ds_email: emails
                }));
            }
        } catch (error) {
            console.error('Erro ao carregar emails do cliente:', error);
            if (onError) {
                onError('Não foi possível carregar os emails existentes do cliente.');
            }
        } finally {
            setIsLoadingEmails(false);
        }
    };

    // Handle form input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form data
    const validateForm = (): boolean => {
        const errors: { [key: string]: string } = {};

        // Email validation - check each email in the list
        if (!formData.ds_email) {
            errors.ds_email = 'O e-mail é obrigatório';
        } else {
            // Split by semicolon and validate each email
            const emails = formData.ds_email.split(';').map(email => email.trim());
            const invalidEmails = emails.filter(email => email && !/^\S+@\S+\.\S+$/.test(email));

            if (invalidEmails.length > 0) {
                errors.ds_email = `Formato de e-mail inválido: ${invalidEmails.join(', ')}`;
            }
        }

        // Set errors and return validation result
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            if (modalMode === 'create') {
                // Create new email
                const response = await api.post('/clientes/emails', formData);
                if (onSuccess) {
                    onSuccess('E-mail(s) cadastrado(s) com sucesso!');
                }
            } else {
                // Update existing email
                const response = await api.patch(`/clientes/emails/${formData.id_email}`, formData);
                if (onSuccess) {
                    onSuccess('E-mail(s) atualizado(s) com sucesso!');
                }
            }

            // Close modal after successful submission
            onClose();
        } catch (error) {
            console.error('Erro ao salvar e-mail:', error);
            if (onError) {
                onError('Erro ao salvar o e-mail. Por favor, tente novamente.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => !isSubmitting && onClose()}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-800 flex items-center"
                                    >
                                        <AtSign className="mr-3 text-teal-500" size={20} />
                                        {modalMode === 'create' ? 'Novo E-mail' : 'Editar E-mail'}
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors duration-200 focus:outline-none"
                                        onClick={onClose}
                                        disabled={isSubmitting}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {cliente && (
                                    <div className="mx-6 mt-4 bg-teal-50 border border-teal-100 rounded-lg p-3 flex items-center">
                                        <div className="p-1.5 rounded-full bg-teal-100 mr-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-600" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v4H7V5zm8 8v2h1v1H4v-1h1v-2h-.5a.5.5 0 010-1H6v-1a1 1 0 011-1h.5V9H6a1 1 0 01-1-1V7h7v1a1 1 0 01-1 1h-1v1h.5a1 1 0 011 1v1H13v2h1.5a.5.5 0 010 1H14z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-teal-800 font-medium">
                                            {cliente.ds_nome}
                                        </p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
                                    {/* E-mail Field */}
                                    <div>
                                        <label htmlFor="ds_email" className="block text-sm font-medium text-gray-600 mb-1.5">
                                            E-mail(s) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative group">
                                            <textarea
                                                id="ds_email"
                                                name="ds_email"
                                                value={formData.ds_email}
                                                onChange={handleChange}
                                                className={`block w-full rounded-lg border ${formErrors.ds_email
                                                        ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                                                        : 'border-gray-200 hover:border-gray-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                                                    } shadow-sm transition-all duration-200 text-sm px-4 py-3 text-gray-700 placeholder-gray-400 bg-white`}
                                                placeholder="exemplo@email.com; outro@email.com"
                                                disabled={isSubmitting || isLoadingEmails}
                                                required
                                                rows={3}
                                            />
                                            <AtSign size={18} className="absolute right-3 top-3 text-gray-400 group-hover:text-teal-500 transition-colors duration-200" />
                                        </div>
                                        <div className="mt-2 flex items-center text-xs">
                                            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-teal-100 text-teal-600 mr-1.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <span className="text-gray-500">Separe múltiplos e-mails com ponto e vírgula (;)</span>
                                        </div>
                                        {formErrors.ds_email && (
                                            <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                {formErrors.ds_email}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors duration-200"
                                            disabled={isSubmitting}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className={`inline-flex items-center justify-center rounded-lg ${isSubmitting
                                                ? 'bg-teal-400 cursor-not-allowed'
                                                : 'bg-teal-600 hover:bg-teal-700'
                                                } px-5 py-2.5 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-200`}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>Salvando...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Check size={16} className="mr-2" />
                                                    <span>{modalMode === 'create' ? 'Adicionar' : 'Salvar'}</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition >
    );
};