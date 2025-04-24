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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900 flex items-center"
                                    >
                                        <AtSign className="mr-2 text-blue-600" size={20} />
                                        {modalMode === 'create' ? 'Novo E-mail' : 'Editar E-mail'}
                                    </Dialog.Title>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                        onClick={onClose}
                                        disabled={isSubmitting}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {cliente && (
                                    <div className="mt-4 bg-blue-50 border border-blue-100 rounded-md p-3">
                                        <p className="text-sm text-blue-700">
                                            <span className="font-medium">Cliente:</span> {cliente.ds_nome}
                                        </p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                    {/* E-mail Field */}
                                    <div>
                                        <label htmlFor="ds_email" className="block text-sm font-medium text-gray-700 mb-1">
                                            E-mail(s) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <textarea
                                                id="ds_email"
                                                name="ds_email"
                                                value={formData.ds_email}
                                                onChange={handleChange}
                                                className={`block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 ${formErrors.ds_email ? 'border-red-300' : 'border-gray-300'} text-gray-800 placeholder-gray-500`}
                                                placeholder="email1@exemplo.com;email2@exemplo.com;email3@exemplo.com"
                                                disabled={isSubmitting || isLoadingEmails}
                                                required
                                                rows={4}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Insira múltiplos e-mails separados por ponto e vírgula (;)
                                        </p>
                                        {formErrors.ds_email && (
                                            <p className="mt-1 text-sm text-red-600">{formErrors.ds_email}</p>
                                        )}
                                    </div>

                                    <div className="mt-6 flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                            disabled={isSubmitting}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className={`inline-flex justify-center rounded-md border border-transparent ${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Salvando...
                                                </>
                                            ) : (
                                                <>
                                                    <Check size={16} className="mr-2" />
                                                    {modalMode === 'create' ? 'Adicionar' : 'Salvar'}
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