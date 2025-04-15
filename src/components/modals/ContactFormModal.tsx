'use client';

import api from '@/services/api';
import { Contato, ContatoPayload } from '@/types/contatos';
import { ModalMode } from '@/types/modal';
import { formatPhoneNumber } from '@/utils/formatters';
import { Check, ChevronsUpDown, FileEdit, Loader2, Save, ShieldAlert, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormModal } from './FormModal';

// Define client interface
interface Cliente {
    id_cliente: number;
    ds_nome: string;
}

// Extended payload to include client IDs
interface ExtendedContatoPayload extends ContatoPayload {
    id_clientes?: number[];
}

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
    const [formData, setFormData] = useState<ExtendedContatoPayload>({
        ds_nome: '',
        ds_email: '',
        ds_telefone: '',
        ds_cargo: '',
        fl_ativo: true,
        fl_whatsapp: false,
        tx_observacoes: '',
        id_clientes: []
    });

    // Form validation errors
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Loading state for form submission
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for client list and dropdown
    const [clients, setClients] = useState<Cliente[]>([]);
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [clientsLoading, setClientsLoading] = useState(false);

    // Load clients on component mount
    useEffect(() => {
        async function loadClients() {
            try {
                setClientsLoading(true);
                const response = await api.get('/clientes/lista/ativos');
                setClients(response.data);
            } catch (error) {
                console.error('Erro ao carregar clientes:', error);
            } finally {
                setClientsLoading(false);
            }
        }

        loadClients();
    }, []);

    // Custom onClose handler that resets form data and errors
    const handleClose = () => {
        // Reset to initial state if in create mode (não resetamos em edit para preservar mudanças)
        if (modalMode === 'create') {
            setFormData({
                ds_nome: '',
                ds_email: '',
                ds_telefone: '',
                ds_cargo: '',
                fl_ativo: true,
                fl_whatsapp: false,
                tx_observacoes: '',
                id_clientes: []
            });
        }
        // Reset validation errors
        setFormErrors({});
        // Call original onClose
        onClose();
    };

    // Initialize form data when modal opens or contact changes
    useEffect(() => {
        if (currentContact && modalMode === 'edit') {
            // Fetch contact details using GET /contatos/{id_contato}
            async function fetchContactDetails() {
                try {
                    const response = await api.get(`/contatos/${currentContact.id_contato}`);
                    const contactDetails = response.data;

                    // Set form data with fetched details
                    setFormData({
                        ds_nome: contactDetails.ds_nome,
                        ds_email: contactDetails.ds_email,
                        ds_telefone: contactDetails.ds_telefone || '',
                        ds_cargo: contactDetails.ds_cargo,
                        fl_ativo: contactDetails.fl_ativo,
                        fl_whatsapp: contactDetails.fl_whatsapp || false,
                        tx_observacoes: contactDetails.tx_observacoes || '',
                        id_clientes: contactDetails.clientes?.map((cliente: any) => cliente.id_cliente) || []
                    });
                } catch (error) {
                    console.error('Erro ao carregar detalhes do contato:', error);
                    // Fallback to using currentContact data if API call fails
                    setFormData({
                        ds_nome: currentContact.ds_nome,
                        ds_email: currentContact.ds_email,
                        ds_telefone: currentContact.ds_telefone || '',
                        ds_cargo: currentContact.ds_cargo,
                        fl_ativo: currentContact.fl_ativo,
                        fl_whatsapp: currentContact.fl_whatsapp || false,
                        tx_observacoes: currentContact.tx_observacoes || '',
                        id_clientes: []
                    });
                }
            }

            fetchContactDetails();
        } else {
            // Reset form for create mode - sempre com fl_ativo como true
            setFormData({
                ds_nome: '',
                ds_email: '',
                ds_telefone: '',
                ds_cargo: '',
                fl_ativo: true,
                fl_whatsapp: false,
                tx_observacoes: '',
                id_clientes: []
            });
        }

        // Clear any previous errors
        setFormErrors({});
    }, [currentContact, modalMode, isOpen]);

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

    // Handle phone input changes with formatting
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedPhone = formatPhoneNumber(e.target.value);
        setFormData(prev => ({ ...prev, ds_telefone: formattedPhone }));

        // Clear validation error when user types
        if (formErrors.ds_telefone) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.ds_telefone;
                return newErrors;
            });
        }
    };

    // Handle checkbox change
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    // Handle client selection
    const handleClientToggle = (clientId: number) => {
        setFormData(prev => {
            const currentClients = prev.id_clientes || [];
            if (currentClients.includes(clientId)) {
                // Remove client if already selected
                return {
                    ...prev,
                    id_clientes: currentClients.filter(id => id !== clientId)
                };
            } else {
                // Add client if not selected
                return {
                    ...prev,
                    id_clientes: [...currentClients, clientId]
                };
            }
        });
    };

    // Form validation
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.ds_nome.trim()) {
            errors.ds_nome = 'Nome é obrigatório';
        }

        if (!formData.ds_email.trim()) {
            errors.ds_email = 'E-mail é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ds_email)) {
            errors.ds_email = 'E-mail inválido';
        }

        if (!formData.ds_cargo.trim()) {
            errors.ds_cargo = 'Cargo é obrigatório';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Form submission handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            if (modalMode === 'create') {
                // Create new contact - sempre com fl_ativo como true
                const payload = {
                    ...formData,
                    fl_ativo: true,
                };
                await api.post('/contatos', payload);
                onSuccess?.('Contato criado com sucesso!');
            } else if (modalMode === 'edit') {
                // Update existing contact using PATCH instead of PUT
                await api.patch(`/contatos/${currentContact?.id_contato}`, formData);
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
            default:
                return null;
        }
    };

    // Field style classes - different for each mode
    const getInputClasses = (fieldName: string): string => {
        const baseClasses = "w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200";

        if (formErrors[fieldName]) {
            return `${baseClasses} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`;
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

    // Modified renderFormField function to support adding an icon/element inside the input
    const renderFormField = (
        label: string,
        name: keyof ContatoPayload,
        type: string = 'text',
        placeholder: string = '',
        required: boolean = false,
        className: string = '',
        inlineElement?: React.ReactNode
    ) => (
        <div className={`relative ${className}`}>
            <label htmlFor={name} className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
                {modalMode === 'edit' &&
                    currentContact?.[name] !== undefined &&
                    formData[name] !== currentContact[name as keyof Contato] && (
                        <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            Modificado
                        </span>
                    )}
            </label>
            <div className="relative">
                <input
                    type={type}
                    id={name}
                    name={name}
                    value={formData[name] as string}
                    onChange={name === 'ds_telefone' ? handlePhoneChange : handleChange}
                    disabled={isSubmitting}
                    className={`${getInputClasses(name as string)} ${inlineElement ? 'pr-12' : ''}`}
                    placeholder={placeholder}
                    required={required}
                />
                {inlineElement && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {inlineElement}
                    </div>
                )}
            </div>
            {formErrors[name as string] && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                    <ShieldAlert size={16} className="mr-1" />
                    {formErrors[name as string]}
                </p>
            )}
        </div>
    );

    // Renders a textarea field
    const renderTextareaField = (
        label: string,
        name: keyof ContatoPayload,
        placeholder: string = '',
        rows: number = 2
    ) => (
        <div className="relative">
            <label htmlFor={name} className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                {label}
                {modalMode === 'edit' &&
                    currentContact?.[name] !== undefined &&
                    formData[name] !== currentContact[name as keyof Contato] && (
                        <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            Modificado
                        </span>
                    )}
            </label>
            <textarea
                id={name}
                name={name}
                value={formData[name] as string}
                onChange={handleChange}
                disabled={isSubmitting}
                className={getInputClasses(name as string)}
                placeholder={placeholder}
                rows={rows}
            />
        </div>
    );

    return (
        <FormModal
            isOpen={isOpen}
            onClose={handleClose}
            title={getModalTitle()}
            size="2xl"
            mode={modalMode}
            icon={getModalIcon()}
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nome e Cargo - mesma linha */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        {renderFormField('Nome', 'ds_nome', 'text', 'Nome completo', true)}
                        {/* Status (ativo/inativo) - apenas para edição e junto ao nome */}
                        {modalMode === 'edit' && (
                            <div className="absolute top-0 right-0 flex items-center">
                                <input
                                    id="fl_ativo"
                                    name="fl_ativo"
                                    type="checkbox"
                                    checked={formData.fl_ativo}
                                    onChange={handleCheckboxChange}
                                    disabled={isSubmitting}
                                    className="h-4 w-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
                                />
                                <label htmlFor="fl_ativo" className="ml-2 block text-xs text-gray-600">
                                    Contato Ativo
                                </label>
                            </div>
                        )}
                    </div>
                    {renderFormField('Cargo', 'ds_cargo', 'text', 'Cargo na empresa', true)}
                </div>

                {/* Email e Telefone+WhatsApp - email na linha inteira, telefone e whatsapp na linha abaixo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderFormField('E-mail', 'ds_email', 'email', 'email@exemplo.com.br', true)}

                    {renderFormField(
                        'Telefone',
                        'ds_telefone',
                        'text',
                        '(00) 00000-0000',
                        false,
                        '',
                        <div className="flex items-center space-x-1 bg-gray-50 rounded-md px-2 py-1">
                            <input
                                id="fl_whatsapp"
                                name="fl_whatsapp"
                                type="checkbox"
                                checked={formData.fl_whatsapp}
                                onChange={handleCheckboxChange}
                                disabled={isSubmitting}
                                className={`h-4 w-4 ${modalMode === 'edit' ? 'text-amber-500 focus:ring-amber-500' : 'text-emerald-500 focus:ring-emerald-500'} border-gray-300 rounded`}
                            />
                            <label htmlFor="fl_whatsapp" className="text-xs text-gray-700 whitespace-nowrap">
                                WhatsApp
                            </label>
                        </div>
                    )}
                </div>

                {/* Client selector */}
                <div className="relative">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
                        Clientes vinculados
                    </label>

                    {/* Selected clients display - ajustando a cor da fonte */}
                    <div className="mb-2 flex flex-wrap gap-2">
                        {formData.id_clientes && formData.id_clientes.map(clientId => {
                            const client = clients.find(c => c.id_cliente === clientId);
                            return client ? (
                                <div
                                    key={client.id_cliente}
                                    className={`rounded-full px-3 py-1 text-sm flex items-center ${modalMode === 'edit'
                                        ? 'bg-amber-50 text-amber-900'
                                        : 'bg-emerald-50 text-emerald-900'
                                        }`}
                                >
                                    {client.ds_nome}
                                    <button
                                        type="button"
                                        onClick={() => handleClientToggle(client.id_cliente)}
                                        className={`ml-2 ${modalMode === 'edit'
                                            ? 'text-amber-700 hover:text-red-500'
                                            : 'text-emerald-700 hover:text-red-500'
                                            }`}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : null;
                        })}
                    </div>

                    {/* Dropdown trigger */}
                    <button
                        type="button"
                        onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                        className={`${getInputClasses('id_clientes')} text-left flex items-center justify-between`}
                        disabled={isSubmitting || clientsLoading}
                    >
                        <span className="block truncate text-gray-500">
                            {clientsLoading ? 'Carregando clientes...' : 'Selecione os clientes'}
                        </span>
                        <ChevronsUpDown size={18} className="ml-2 opacity-50" />
                    </button>

                    {/* Dropdown menu */}
                    {isClientDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-300 rounded-md shadow-lg">
                            <ul className="py-1">
                                {clients.length === 0 ? (
                                    <li className="px-4 py-2 text-sm text-gray-500">
                                        Nenhum cliente disponível
                                    </li>
                                ) : (
                                    clients.map(client => (
                                        <li
                                            key={client.id_cliente}
                                            onClick={() => handleClientToggle(client.id_cliente)}
                                            className="px-4 py-2 text-sm cursor-pointer text-gray-800 hover:bg-gray-100 flex items-center justify-between"
                                        >
                                            <span>{client.ds_nome}</span>
                                            {formData.id_clientes?.includes(client.id_cliente) && (
                                                <Check size={18} className="text-emerald-500" />
                                            )}
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Observações */}
                {renderTextareaField('Observações', 'tx_observacoes', 'Informações adicionais sobre o contato')}

                {/* Action buttons */}
                <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-gray-100">
                    {/* Cancel button */}
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
                    >
                        Cancelar
                    </button>

                    {/* Submit button */}
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
        </FormModal>
    );
}