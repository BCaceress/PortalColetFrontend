'use client';

import api from '@/services/api';
import { format, parseISO } from 'date-fns';
import { Calendar, CalendarClock, Clock, Mail, Pencil, Plus, Save, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormModal } from './FormModal';

interface Cliente {
    id_cliente: number;
    ds_nome: string;
}

interface Contato {
    id_contato: number;
    ds_nome: string;
}

interface Usuario {
    id_usuario: number;
    nome: string;
}

export interface Agenda {
    id_agenda: number;
    ds_titulo: string;
    ds_descricao?: string;
    ds_tipo: 'agenda' | 'rat' | 'ticket';
    ds_status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
    ds_prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
    dt_agendamento: string;
    dt_inicio?: string;
    dt_fim?: string;
    tm_duracao?: string;
    id_cliente: number;
    id_contato?: number;
    id_usuario: number;
    id_rat?: number;
    id_chamado?: number;
    // Extended properties that might come from relationships/joins
    cliente?: Cliente;
    contato?: Contato;
    usuario?: Usuario;
    ds_emails?: string; // Campo para armazenar emails do cliente
}

interface AgendaFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'create' | 'edit' | 'view';
    agenda?: Agenda | null;
    onSave: (agenda: Agenda) => void;
    clientes?: Cliente[];
    usuarios?: Usuario[];
}

export function AgendaFormModal({
    isOpen,
    onClose,
    mode,
    agenda,
    onSave,
    clientes = [],
    usuarios = [],
}: AgendaFormModalProps) {
    const [form, setForm] = useState<Agenda>({
        id_agenda: 0,
        ds_titulo: '',
        ds_descricao: '',
        ds_tipo: 'agenda',
        ds_status: 'agendado',
        ds_prioridade: 'media',
        dt_agendamento: new Date().toISOString(),
        id_cliente: 0,
        id_usuario: 0,
        ds_emails: '', // Inicializar o campo ds_emails
    });
    const [contatos, setContatos] = useState<Contato[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [emails, setEmails] = useState<string>('');

    // Reset form when modal opens with a new agenda
    useEffect(() => {
        if (isOpen && agenda) {
            setForm(agenda);
            // Em produção, carregaria os contatos do cliente atual
            // loadContatosByCliente(agenda.id_cliente);
        } else if (isOpen && mode === 'create') {
            setForm({
                id_agenda: 0,
                ds_titulo: '',
                ds_descricao: '',
                ds_tipo: 'agenda',
                ds_status: 'agendado',
                ds_prioridade: 'media',
                dt_agendamento: new Date().toISOString(),
                id_cliente: 0,
                id_usuario: 0,
                ds_emails: '',
            });
            setContatos([]);
            setEmails('');
        }
    }, [isOpen, agenda, mode]);

    // Simulated function that would normally be linked to the real API
    const loadContatosByCliente = async (clienteId: number) => {
        // setIsLoading(true);
        // try {
        //     const response = await api.get(`/clientes/${clienteId}/contatos`);
        //     setContatos(response.data);
        // } catch (error) {
        //     console.error('Erro ao carregar contatos:', error);
        // } finally {
        //     setIsLoading(false);
        // }

        // Mock data para demonstração
        setContatos([
            { id_contato: 1, ds_nome: 'Ana Silva (Financeiro)' },
            { id_contato: 2, ds_nome: 'João Pereira (TI)' },
            { id_contato: 3, ds_nome: 'Maria Souza (Diretoria)' },
        ]);
    };

    const loadEmailsByCliente = async (clienteId: number) => {
        if (!clienteId || clienteId <= 0) return;

        setIsLoading(true);
        try {
            const response = await api.get(`/clientes/${clienteId}/emails`);
            if (response.data && Array.isArray(response.data)) {
                // Juntar todos os emails com ponto e vírgula
                const emailsStr = response.data.map((email: any) => email.ds_email).join(';');
                setEmails(emailsStr);

                // Também salva no formulário para envio posterior
                setForm(prev => ({
                    ...prev,
                    ds_emails: emailsStr
                }));
            }
        } catch (error) {
            console.error('Erro ao carregar emails do cliente:', error);
            setEmails('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Validação especial para campo de data/hora
        if (name === 'dt_agendamento') {
            try {
                // Certifique-se de que o valor é uma data ISO válida
                const date = new Date(value).toISOString();
                setForm(prev => ({ ...prev, [name]: date }));
            } catch (error) {
                console.error('Data inválida:', error);
            }
            return;
        }

        setForm(prev => ({ ...prev, [name]: value }));

        // Limpa o erro deste campo quando ele é alterado
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        // Carregar contatos e emails quando o cliente for selecionado
        if (name === 'id_cliente' && parseInt(value) > 0) {
            loadContatosByCliente(parseInt(value));
            loadEmailsByCliente(parseInt(value));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validações
        const newErrors: Record<string, string> = {};

        if (!form.ds_titulo.trim()) {
            newErrors.ds_titulo = 'O título é obrigatório';
        }

        if (form.id_cliente <= 0) {
            newErrors.id_cliente = 'Selecione um cliente';
        }

        if (form.id_usuario <= 0) {
            newErrors.id_usuario = 'Selecione um responsável';
        }

        if (!form.dt_agendamento) {
            newErrors.dt_agendamento = 'Data de agendamento é obrigatória';
        }

        // Se houver erros, exibe-os e não prossegue
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);

        try {
            // Em produção, faria uma chamada para API
            // const response = await api.post('/agendas', form) ou api.put(`/agendas/${form.id_agenda}`, form)

            // Simula chamada de API com timeout
            setTimeout(() => {
                // Para demonstração, assumimos que a API retornou com sucesso
                onSave(form);
                onClose();
            }, 500);
        } catch (error) {
            console.error('Erro ao salvar agenda:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Formatar data e hora para exibição ou input
    const formatISOForInput = (isoDate?: string) => {
        if (!isoDate) return '';
        try {
            // Formata para o formato aceito por inputs do tipo datetime-local: YYYY-MM-DDThh:mm
            return format(parseISO(isoDate), "yyyy-MM-dd'T'HH:mm");
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return '';
        }
    };

    // Helper function to format status label
    const formatStatusLabel = (status: string): string => {
        switch (status) {
            case 'agendado': return 'Agendado';
            case 'em_andamento': return 'Em andamento';
            case 'concluido': return 'Concluído';
            case 'cancelado': return 'Cancelado';
            default: return status;
        }
    };

    // Helper function to format priority label
    const formatPrioridadeLabel = (prioridade: string): string => {
        switch (prioridade) {
            case 'baixa': return 'Baixa';
            case 'media': return 'Média';
            case 'alta': return 'Alta';
            case 'urgente': return 'Urgente';
            default: return prioridade;
        }
    };

    // Helper function to format tipo label
    const formatTipoLabel = (tipo: string): string => {
        switch (tipo) {
            case 'agenda': return 'Agenda';
            case 'rat': return 'RAT';
            case 'ticket': return 'Ticket';
            default: return tipo;
        }
    };

    const getModalIcon = () => {
        switch (mode) {
            case 'create': return <Plus className="text-emerald-500" />;
            case 'edit': return <Pencil className="text-amber-500" />;
            case 'view': return <Calendar className="text-blue-500" />;
            default: return <Calendar className="text-gray-500" />;
        }
    };

    const getModalTitle = () => {
        switch (mode) {
            case 'create': return 'Nova Agenda';
            case 'edit': return 'Editar Agenda';
            case 'view': return 'Detalhes da Agenda';
            default: return 'Agenda';
        }
    };

    const isViewMode = mode === 'view';

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={getModalTitle()}
            icon={getModalIcon()}
            mode={mode}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Título da agenda */}
                    <div className="md:col-span-2">
                        <label htmlFor="ds_titulo" className="block text-sm font-medium text-gray-900 mb-1">
                            Título
                        </label>
                        <input
                            type="text"
                            id="ds_titulo"
                            name="ds_titulo"
                            value={form.ds_titulo}
                            onChange={handleChange}
                            disabled={isViewMode}
                            placeholder="Digite o título da agenda"
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 
                                ${errors.ds_titulo ? 'border-red-300' : 'border-gray-300'}
                                ${isViewMode ? 'bg-gray-50 text-gray-800' : ''}`}
                        />
                        {errors.ds_titulo && (
                            <p className="mt-1 text-sm text-red-500">{errors.ds_titulo}</p>
                        )}
                    </div>

                    {/* Descrição */}
                    <div className="md:col-span-2">
                        <label htmlFor="ds_descricao" className="block text-sm font-medium text-gray-900 mb-1">
                            Descrição
                        </label>
                        <textarea
                            id="ds_descricao"
                            name="ds_descricao"
                            value={form.ds_descricao || ''}
                            onChange={handleChange}
                            disabled={isViewMode}
                            rows={3}
                            placeholder="Descreva detalhes sobre esta agenda"
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500
                                ${isViewMode ? 'bg-gray-50 text-gray-800' : 'border-gray-300 text-gray-800 placeholder-gray-500'}`}
                        />
                    </div>

                    {/* Cliente */}
                    <div>
                        <label htmlFor="id_cliente" className="block text-sm font-medium text-gray-900 mb-1">
                            Cliente
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Users size={16} className="text-gray-700" />
                            </div>
                            <select
                                id="id_cliente"
                                name="id_cliente"
                                value={form.id_cliente}
                                onChange={handleChange}
                                disabled={isViewMode}
                                className={`w-full pl-10 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500
                                    ${errors.id_cliente ? 'border-red-300' : 'border-gray-300'}
                                    ${isViewMode ? 'bg-gray-50 text-gray-800' : ''}`}
                            >
                                <option value={0}>Selecione um cliente</option>
                                {clientes.map(cliente => (
                                    <option key={cliente.id_cliente} value={cliente.id_cliente}>
                                        {cliente.ds_nome}
                                    </option>
                                ))}
                                {/* Opções de exemplo para desenvolvimento */}
                                {clientes.length === 0 && [
                                    { id_cliente: 1, ds_nome: 'Empresa XYZ Ltda' },
                                    { id_cliente: 2, ds_nome: 'Comércio ABC S.A.' },
                                    { id_cliente: 3, ds_nome: 'Indústria 123' },
                                ].map(cliente => (
                                    <option key={cliente.id_cliente} value={cliente.id_cliente}>
                                        {cliente.ds_nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.id_cliente && (
                            <p className="mt-1 text-sm text-red-500">{errors.id_cliente}</p>
                        )}
                    </div>

                    {/* Contato */}
                    <div>
                        <label htmlFor="id_contato" className="block text-sm font-medium text-gray-900 mb-1">
                            Contato
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <User size={16} className="text-gray-700" />
                            </div>
                            <select
                                id="id_contato"
                                name="id_contato"
                                value={form.id_contato || 0}
                                onChange={handleChange}
                                disabled={isViewMode || form.id_cliente <= 0}
                                className={`w-full pl-10 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 border-gray-300
                                    ${isViewMode ? 'bg-gray-50 text-gray-800' : ''}
                                    ${form.id_cliente <= 0 ? 'bg-gray-50 opacity-75' : ''}`}
                            >
                                <option value={0}>Selecione um contato</option>
                                {contatos.map(contato => (
                                    <option key={contato.id_contato} value={contato.id_contato}>
                                        {contato.ds_nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Emails */}
                    <div className="md:col-span-2">
                        <label htmlFor="ds_emails" className="block text-sm font-medium text-gray-900 mb-1">
                            Emails do Cliente
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Mail size={16} className="text-gray-700" />
                            </div>
                            <input
                                type="text"
                                id="ds_emails"
                                name="ds_emails"
                                value={emails}
                                disabled
                                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-800"
                            />
                        </div>
                    </div>

                    {/* Data e Hora */}
                    <div>
                        <label htmlFor="dt_agendamento" className="block text-sm font-medium text-gray-900 mb-1">
                            Data e Hora
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <CalendarClock size={16} className="text-gray-700" />
                            </div>
                            <input
                                type="datetime-local"
                                id="dt_agendamento"
                                name="dt_agendamento"
                                value={formatISOForInput(form.dt_agendamento)}
                                onChange={handleChange}
                                disabled={isViewMode}
                                className={`w-full pl-10 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500
                                    ${errors.dt_agendamento ? 'border-red-300' : 'border-gray-300'}
                                    ${isViewMode ? 'bg-gray-50 text-gray-800' : ''}`}
                            />
                        </div>
                        {errors.dt_agendamento && (
                            <p className="mt-1 text-sm text-red-500">{errors.dt_agendamento}</p>
                        )}
                    </div>

                    {/* Duração estimada - apenas para criação/edição */}
                    {!isViewMode && (
                        <div>
                            <label htmlFor="tm_duracao" className="block text-sm font-medium text-gray-900 mb-1">
                                Duração Estimada (opcional)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Clock size={16} className="text-gray-700" />
                                </div>
                                <input
                                    type="time"
                                    id="tm_duracao"
                                    name="tm_duracao"
                                    value={form.tm_duracao?.substring(0, 5) || ''}
                                    onChange={handleChange}
                                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="HH:MM"
                                />
                            </div>
                        </div>
                    )}

                    {/* Responsável */}
                    <div>
                        <label htmlFor="id_usuario" className="block text-sm font-medium text-gray-900 mb-1">
                            Responsável
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <User size={16} className="text-gray-700" />
                            </div>
                            <select
                                id="id_usuario"
                                name="id_usuario"
                                value={form.id_usuario}
                                onChange={handleChange}
                                disabled={isViewMode}
                                className={`w-full pl-10 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500
                                    ${errors.id_usuario ? 'border-red-300' : 'border-gray-300'}
                                    ${isViewMode ? 'bg-gray-50 text-gray-800' : ''}`}
                            >
                                <option value={0}>Selecione um responsável</option>
                                {usuarios.map(usuario => (
                                    <option key={usuario.id_usuario} value={usuario.id_usuario}>
                                        {usuario.nome}
                                    </option>
                                ))}
                                {/* Opções de exemplo para desenvolvimento */}
                                {usuarios.length === 0 && [
                                    { id_usuario: 1, nome: 'João Silva' },
                                    { id_usuario: 2, nome: 'Maria Oliveira' },
                                    { id_usuario: 3, nome: 'Carlos Santos' },
                                ].map(usuario => (
                                    <option key={usuario.id_usuario} value={usuario.id_usuario}>
                                        {usuario.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.id_usuario && (
                            <p className="mt-1 text-sm text-red-500">{errors.id_usuario}</p>
                        )}
                    </div>

                    {/* Status */}
                    <div>
                        <label htmlFor="ds_status" className="block text-sm font-medium text-gray-900 mb-1">
                            Status
                        </label>
                        <select
                            id="ds_status"
                            name="ds_status"
                            value={form.ds_status}
                            onChange={handleChange}
                            disabled={isViewMode}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500
                                ${isViewMode ? 'bg-gray-50 text-gray-800' : ''}`}
                        >
                            <option value="agendado">{formatStatusLabel('agendado')}</option>
                            <option value="em_andamento">{formatStatusLabel('em_andamento')}</option>
                            <option value="concluido">{formatStatusLabel('concluido')}</option>
                            <option value="cancelado">{formatStatusLabel('cancelado')}</option>
                        </select>
                    </div>

                    {/* Prioridade */}
                    <div>
                        <label htmlFor="ds_prioridade" className="block text-sm font-medium text-gray-900 mb-1">
                            Prioridade
                        </label>
                        <select
                            id="ds_prioridade"
                            name="ds_prioridade"
                            value={form.ds_prioridade}
                            onChange={handleChange}
                            disabled={isViewMode}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500
                                ${isViewMode ? 'bg-gray-50 text-gray-800' : ''}`}
                        >
                            <option value="baixa">{formatPrioridadeLabel('baixa')}</option>
                            <option value="media">{formatPrioridadeLabel('media')}</option>
                            <option value="alta">{formatPrioridadeLabel('alta')}</option>
                            <option value="urgente">{formatPrioridadeLabel('urgente')}</option>
                        </select>
                    </div>
                </div>

                {/* Botões de ação */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                        Cancelar
                    </button>

                    {!isViewMode && (
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center space-x-1
                                ${mode === 'create'
                                    ? 'bg-emerald-600 hover:bg-emerald-700'
                                    : 'bg-amber-600 hover:bg-amber-700'
                                } 
                                ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Salvando...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>Salvar</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </form>
        </FormModal>
    );
}