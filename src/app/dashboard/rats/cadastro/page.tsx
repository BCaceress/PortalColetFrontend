'use client';

import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import { format } from 'date-fns';
import { AlignLeft, Car, ClipboardList, Loader2, Map, Save, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Atualizando a interface RATPayload para remover campos desnecessários
interface RATPayload {
    ds_status: string;
    fl_deslocamento: string;
    dt_data_hora_entrada: string;
    dt_data_hora_saida: string;
    tx_comentario_interno?: string;
    ds_originada?: string;
    ds_observacao?: string;
    nr_km_ida?: number;
    nr_km_volta?: number;
    nr_valor_pedagio?: number;
    tx_atividades?: string;
    tx_tarefas?: string;
    tx_pendencias?: string;
    id_usuario: number;
    id_cliente: number;
    id_contato: number;
    tm_duracao?: string;
}

// Interface para cliente
interface Cliente {
    id_cliente: number;
    ds_nome: string;
}

// Interface para contato
interface Contato {
    id_contato: number;
    ds_nome: string;
    id_cliente: number;
}

// Adicionando interface para usuários
interface Usuario {
    id_usuario: number;
    nome: string;
}

export default function CadastroRAT() {
    const router = useRouter();
    const { user } = useAuth();

    // States
    const [formData, setFormData] = useState<RATPayload>({
        ds_status: 'Finalizado',
        fl_deslocamento: 'R',
        dt_data_hora_entrada: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        dt_data_hora_saida: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        ds_originada: '',
        ds_observacao: '',
        tx_comentario_interno: '',
        tx_atividades: '',
        tx_tarefas: '',
        tx_pendencias: '',
        id_usuario: user?.id || 0,
        id_cliente: 0,
        id_contato: 0
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof RATPayload, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // States para listas de seleção
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [contatos, setContatos] = useState<Contato[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [isLoadingClientes, setIsLoadingClientes] = useState(false);
    const [isLoadingContatos, setIsLoadingContatos] = useState(false);
    const [isLoadingUsuarios, setIsLoadingUsuarios] = useState(false);

    // Calcular duração quando entrada ou saída mudam
    useEffect(() => {
        if (formData.dt_data_hora_entrada && formData.dt_data_hora_saida) {
            const entrada = new Date(formData.dt_data_hora_entrada);
            const saida = new Date(formData.dt_data_hora_saida);

            // Validar se entrada é anterior à saída
            if (entrada > saida) {
                setFormErrors(prev => ({
                    ...prev,
                    dt_data_hora_saida: 'A data/hora de saída deve ser posterior à entrada'
                }));
                return;
            } else {
                // Limpar erro se válido
                setFormErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.dt_data_hora_saida;
                    return newErrors;
                });
            }

            // Calcular diferença em milissegundos
            const diffMs = saida.getTime() - entrada.getTime();

            // Converter para horas e minutos
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            // Formatar como HH:MM:00
            const duracao = `${diffHours.toString().padStart(2, '0')}:${diffMinutes.toString().padStart(2, '0')}:00`;

            // Atualizar campo de duração no formulário apenas se não tiver sido editado manualmente
            setFormData(prev => ({
                ...prev,
                tm_duracao: duracao
            }));
        }
    }, [formData.dt_data_hora_entrada, formData.dt_data_hora_saida]);

    // Carregar lista de clientes ativos e usuários ao montar o componente
    useEffect(() => {
        fetchClientes();
        fetchUsuarios();
    }, []);

    // Carregar contatos quando o cliente for selecionado
    useEffect(() => {
        if (formData.id_cliente > 0) {
            fetchContatos(formData.id_cliente);
        } else {
            setContatos([]);
        }
    }, [formData.id_cliente]);

    // Buscar clientes ativos da API
    const fetchClientes = async () => {
        try {
            setIsLoadingClientes(true);
            const response = await api.get('/clientes/lista/ativos');
            setClientes(response.data);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
            alert('Não foi possível carregar a lista de clientes. Tente novamente.');
        } finally {
            setIsLoadingClientes(false);
        }
    };

    // Buscar contatos de um cliente específico
    const fetchContatos = async (clienteId: number) => {
        try {
            setIsLoadingContatos(true);
            const response = await api.get(`/contatos/lista/ativos/${clienteId}`);
            setContatos(response.data);
        } catch (error) {
            console.error('Erro ao buscar contatos:', error);
            alert('Não foi possível carregar a lista de contatos. Tente novamente.');
        } finally {
            setIsLoadingContatos(false);
        }
    };

    // Buscar usuários da API
    const fetchUsuarios = async () => {
        try {
            setIsLoadingUsuarios(true);
            const response = await api.get('/usuarios');
            setUsuarios(response.data);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            alert('Não foi possível carregar a lista de usuários. Tente novamente.');
        } finally {
            setIsLoadingUsuarios(false);
        }
    };

    // Handle genérico para campos de texto e números
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Tratamento especial para id_cliente e id_contato para garantir que sejam enviados como números
        if (name === 'id_cliente' || name === 'id_contato') {
            const numValue = parseInt(value, 10);
            setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Limpar erro quando o usuário digitar
        if (formErrors[name as keyof RATPayload]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof RATPayload];
                return newErrors;
            });
        }

        // Lógica específica para o campo de deslocamento
        if (name === 'fl_deslocamento') {
            const hasDeslocamento = value === 'P';

            // Se não há deslocamento, limpar campos relacionados
            if (!hasDeslocamento) {
                setFormData(prev => ({
                    ...prev,
                    nr_km_ida: undefined,
                    nr_km_volta: undefined,
                    nr_valor_pedagio: undefined
                }));
            }
        }
    };

    // Handle para campo de duração manual
    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;

        // Validar formato de hora (HH:MM:SS ou HH:MM)
        if (value && !/^([0-9]{1,2}):([0-9]{1,2})(?::([0-9]{1,2}))?$/.test(value)) {
            return; // Não aceitar valores em formato inválido
        }

        setFormData(prev => ({
            ...prev,
            tm_duracao: value
        }));
    };

    // Handle para campos numéricos
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numberValue = value === '' ? undefined : parseFloat(value);

        setFormData(prev => ({ ...prev, [name]: numberValue }));

        // Limpar erro quando o usuário digitar
        if (formErrors[name as keyof RATPayload]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof RATPayload];
                return newErrors;
            });
        }
    };

    // Função para formatar currency (R$)
    const formatCurrency = (value: number | undefined): string => {
        if (value === undefined) return '';
        return value.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Handle para campos monetários (R$)
    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Remover todos os caracteres não numéricos
        const numericValue = value.replace(/\D/g, '');

        // Converte para o formato monetário brasileiro
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

        // Converte para float usando ponto como separador decimal
        const floatValue = formattedValue === ''
            ? undefined
            : parseFloat(formattedValue.replace('.', '').replace(',', '.'));

        setFormData(prev => ({ ...prev, [name]: floatValue }));
    };

    // Voltar para a lista de RATs
    const handleCancel = () => {
        router.push('/dashboard/rats');
    };

    // Validação do formulário
    const validateForm = (): boolean => {
        const errors: Partial<Record<keyof RATPayload, string>> = {};

        // Validar campos obrigatórios
        if (!formData.ds_status) {
            errors.ds_status = 'Status é obrigatório';
        }

        if (!formData.dt_data_hora_entrada) {
            errors.dt_data_hora_entrada = 'Data/hora de entrada é obrigatória';
        }

        if (!formData.dt_data_hora_saida) {
            errors.dt_data_hora_saida = 'Data/hora de saída é obrigatória';
        } else {
            // Verificar se a data de saída é posterior à de entrada
            const entrada = new Date(formData.dt_data_hora_entrada);
            const saida = new Date(formData.dt_data_hora_saida);

            if (entrada > saida) {
                errors.dt_data_hora_saida = 'A data/hora de saída deve ser posterior à entrada';
            }
        }

        if (!formData.id_cliente || formData.id_cliente <= 0) {
            errors.id_cliente = 'Cliente é obrigatório';
        }

        if (!formData.id_contato || formData.id_contato <= 0) {
            errors.id_contato = 'Contato é obrigatório';
        }

        // Validar usuário
        if (!formData.id_usuario) {
            errors.id_usuario = 'Usuário é obrigatório';
        }

        // Se tem deslocamento, validar campos relacionados
        if (formData.fl_deslocamento === 'P') {
            if (!formData.nr_km_ida && formData.nr_km_ida !== 0) {
                errors.nr_km_ida = 'KM de ida é obrigatório quando há deslocamento';
            }

            if (!formData.nr_km_volta && formData.nr_km_volta !== 0) {
                errors.nr_km_volta = 'KM de volta é obrigatório quando há deslocamento';
            }
        }

        // Validar atividades
        if (!formData.tx_atividades || !formData.tx_atividades.trim()) {
            errors.tx_atividades = 'Atividades realizadas são obrigatórias';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Estilo dos campos
    const getInputClasses = (fieldName: keyof RATPayload, disabled = false): string => {
        const baseClasses = "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200";

        if (disabled) {
            return `${baseClasses} border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed`;
        } else if (formErrors[fieldName]) {
            return `${baseClasses} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`;
        } else {
            return `${baseClasses} border-gray-200 text-gray-700 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 bg-white`;
        }
    };

    // Select box styles
    const getSelectClasses = (fieldName: keyof RATPayload, disabled = false): string => {
        const baseClasses = "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 appearance-none";

        if (disabled) {
            return `${baseClasses} border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed`;
        } else if (formErrors[fieldName]) {
            return `${baseClasses} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`;
        } else {
            return `${baseClasses} border-gray-200 text-gray-700 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 bg-white`;
        }
    };

    // Botão de submissão
    const getPrimaryButtonStyles = (): string => {
        const baseClasses = "inline-flex items-center px-5 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200";

        if (isSubmitting) {
            return `${baseClasses} bg-gray-500 cursor-not-allowed`;
        } else {
            return `${baseClasses} bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`;
        }
    };

    // Submit do formulário
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            setIsSubmitting(true);

            try {
                // Preparar dados para API
                const submitData = {
                    ...formData,
                    id_cliente: Number(formData.id_cliente),
                    id_contato: Number(formData.id_contato),
                    id_usuario: Number(formData.id_usuario)
                };

                // Enviar dados para API
                await api.post('/rats', submitData);

                // Redirecionar para lista de RATs após sucesso
                router.push('/dashboard/rats');
            } catch (error) {
                console.error('Erro ao cadastrar RAT:', error);
                alert('Ocorreu um erro ao cadastrar o RAT. Tente novamente.');
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="p-1 sm:p-6 max-w-7xl mx-auto">
            {/* Cabeçalho da página */}
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Novo RAT</h1>
                </div>
                <p className="text-gray-500 mt-1">Preencha os campos abaixo para registrar um novo atendimento técnico</p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Card de identificação da RAT */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center mb-5">
                            <ClipboardList size={20} className="mr-2 text-blue-500" />
                            <h2 className="text-lg font-semibold text-gray-800">Identificação da RAT</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-x-6 gap-y-5">

                            {/* Usuário Responsável */}
                            <div className="relative md:col-span-2">
                                <label htmlFor="id_usuario" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Responsável <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="id_usuario"
                                        name="id_usuario"
                                        value={formData.id_usuario}
                                        onChange={handleChange}
                                        disabled={isSubmitting || isLoadingUsuarios}
                                        className={getSelectClasses('id_usuario')}
                                    >
                                        <option value={0}>Selecione um usuário</option>
                                        {usuarios.map(usuario => (
                                            <option key={usuario.id_usuario} value={usuario.id_usuario}>
                                                {usuario.nome} {usuario.id_usuario === user?.id ? '(Você)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        {isLoadingUsuarios ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                {formErrors.id_usuario && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.id_usuario}</span>
                                    </p>
                                )}
                            </div>

                            {/* Cliente */}
                            <div className="relative ">
                                <label htmlFor="id_cliente" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Cliente <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="id_cliente"
                                        name="id_cliente"
                                        value={formData.id_cliente}
                                        onChange={handleChange}
                                        disabled={isSubmitting || isLoadingClientes}
                                        className={getSelectClasses('id_cliente')}
                                    >
                                        <option value={0}>Selecione um cliente</option>
                                        {clientes.map(cliente => (
                                            <option key={cliente.id_cliente} value={cliente.id_cliente}>
                                                {cliente.ds_nome}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        {isLoadingClientes ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                {formErrors.id_cliente && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.id_cliente}</span>
                                    </p>
                                )}
                            </div>

                            {/* Contato */}
                            <div className="relative">
                                <label htmlFor="id_contato" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Contato <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="id_contato"
                                        name="id_contato"
                                        value={formData.id_contato}
                                        onChange={handleChange}
                                        disabled={isSubmitting || isLoadingContatos || formData.id_cliente <= 0}
                                        className={getSelectClasses('id_contato', formData.id_cliente <= 0)}
                                    >
                                        <option value={0}>
                                            {formData.id_cliente <= 0
                                                ? 'Selecione um cliente'
                                                : 'Selecione um contato'}
                                        </option>
                                        {contatos.map(contato => (
                                            <option key={contato.id_contato} value={contato.id_contato}>
                                                {contato.ds_nome}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        {isLoadingContatos ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                {formErrors.id_contato && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.id_contato}</span>
                                    </p>
                                )}
                            </div>

                            {/* Origem do Atendimento */}
                            <div className="relative">
                                <label htmlFor="ds_originada" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Origem
                                </label>
                                <div className="relative">
                                    <select
                                        id="ds_originada"
                                        name="ds_originada"
                                        value={formData.ds_originada}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className={getSelectClasses('ds_originada')}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Análise">Análise</option>
                                        <option value="Cliente">Cliente</option>
                                        <option value="Comercial">Comercial</option>
                                        <option value="Implantação">Implantação</option>
                                        <option value="Suporte">Suporte</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Data/Hora de Entrada */}
                            <div className="relative">
                                <label htmlFor="dt_data_hora_entrada" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Data/Hora de Entrada <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    id="dt_data_hora_entrada"
                                    name="dt_data_hora_entrada"
                                    value={formData.dt_data_hora_entrada}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('dt_data_hora_entrada')}
                                />
                                {formErrors.dt_data_hora_entrada && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.dt_data_hora_entrada}</span>
                                    </p>
                                )}
                            </div>

                            {/* Data/Hora de Saída */}
                            <div className="relative">
                                <label htmlFor="dt_data_hora_saida" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Data/Hora de Saída <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    id="dt_data_hora_saida"
                                    name="dt_data_hora_saida"
                                    value={formData.dt_data_hora_saida}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('dt_data_hora_saida')}
                                />
                                {formErrors.dt_data_hora_saida && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.dt_data_hora_saida}</span>
                                    </p>
                                )}
                            </div>

                            {/* Duração (modificado para permitir edição) */}
                            <div className="relative">
                                <label htmlFor="tm_duracao" className="text-sm font-medium text-gray-700 mb-1 block flex items-center">
                                    Duração
                                </label>
                                <input
                                    type="text"
                                    id="tm_duracao"
                                    name="tm_duracao"
                                    value={formData.tm_duracao || ''}
                                    onChange={handleDurationChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('tm_duracao')}
                                    placeholder="HH:MM:SS"
                                />
                                {formErrors.tm_duracao && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.tm_duracao}</span>
                                    </p>
                                )}
                            </div>

                            {/* Observação (ds_observacao como select box) */}
                            <div className="relative">
                                <label htmlFor="ds_observacao" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Observação
                                </label>
                                <div className="relative">
                                    <select
                                        id="ds_observacao"
                                        name="ds_observacao"
                                        value={formData.ds_observacao}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className={getSelectClasses('ds_observacao')}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Acordo">Acordo</option>
                                        <option value="Colet+">Colet+</option>
                                        <option value="Cortesia">Cortesia</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Status do RAT */}
                            <div className="relative">
                                <label htmlFor="ds_status" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="ds_status"
                                        name="ds_status"
                                        value={formData.ds_status}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className={getSelectClasses('ds_status')}
                                    >
                                        <option value="Finalizado">Finalizado</option>
                                        <option value="Pendente">Pendente</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                                {formErrors.ds_status && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.ds_status}</span>
                                    </p>
                                )}
                            </div>

                            {/* Comentário interno (apenas para uso interno) */}
                            <div className="relative md:col-span-5">
                                <label htmlFor="tx_comentario_interno" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Comentário Interno
                                </label>
                                <textarea
                                    id="tx_comentario_interno"
                                    name="tx_comentario_interno"
                                    value={formData.tx_comentario_interno || ''}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('tx_comentario_interno')}
                                    placeholder="Comentários internos (não visíveis para o cliente)"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card de Informações de Deslocamento */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center mb-5">
                            <Car size={20} className="mr-2 text-blue-500" />
                            <h2 className="text-lg font-semibold text-gray-800">Informações de Deslocamento</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-x-6 gap-y-5">
                            {/* Flag de Deslocamento */}
                            <div className="relative">
                                <label htmlFor="fl_deslocamento" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Atendimento? <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="fl_deslocamento"
                                        name="fl_deslocamento"
                                        value={formData.fl_deslocamento}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className={getSelectClasses('fl_deslocamento')}
                                    >
                                        <option value="R">Remoto </option>
                                        <option value="P">Presencial</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* KM Ida */}
                            <div className="relative">
                                <label htmlFor="nr_km_ida" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    KM Ida
                                    {formData.fl_deslocamento === 'P' && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <input
                                    type="number"
                                    id="nr_km_ida"
                                    name="nr_km_ida"
                                    value={formData.nr_km_ida || ''}
                                    onChange={handleNumberChange}
                                    disabled={isSubmitting || formData.fl_deslocamento === 'R'}
                                    className={getInputClasses('nr_km_ida', formData.fl_deslocamento === 'R')}
                                    placeholder={formData.fl_deslocamento === 'R' ? "Sem deslocamento" : "KM de ida"}
                                    min={0}
                                />
                                {formErrors.nr_km_ida && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.nr_km_ida}</span>
                                    </p>
                                )}
                            </div>

                            {/* KM Volta */}
                            <div className="relative">
                                <label htmlFor="nr_km_volta" className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    KM Volta
                                    {formData.fl_deslocamento === 'P' && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <input
                                    type="number"
                                    id="nr_km_volta"
                                    name="nr_km_volta"
                                    value={formData.nr_km_volta || ''}
                                    onChange={handleNumberChange}
                                    disabled={isSubmitting || formData.fl_deslocamento === 'N'}
                                    className={getInputClasses('nr_km_volta', formData.fl_deslocamento === 'R')}
                                    placeholder={formData.fl_deslocamento === 'R' ? "Sem deslocamento" : "KM de volta"}
                                    min={0}
                                />
                                {formErrors.nr_km_volta && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.nr_km_volta}</span>
                                    </p>
                                )}
                            </div>

                            {/* Valor Pedágio */}
                            <div className="relative">
                                <label htmlFor="nr_valor_pedagio" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Valor Pedágio (R$)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <span className={`${formData.fl_deslocamento === 'P' ? 'text-gray-500' : 'text-gray-300'}`}>R$</span>
                                    </div>
                                    <input
                                        type="text"
                                        id="nr_valor_pedagio"
                                        name="nr_valor_pedagio"
                                        value={formData.nr_valor_pedagio !== undefined ? formatCurrency(formData.nr_valor_pedagio) : ''}
                                        onChange={handleCurrencyChange}
                                        disabled={isSubmitting || formData.fl_deslocamento === 'R'}
                                        className={`${getInputClasses('nr_valor_pedagio', formData.fl_deslocamento === 'R')} pl-10`}
                                        placeholder={formData.fl_deslocamento === 'R' ? "Sem deslocamento" : "0,00"}
                                    />
                                </div>
                            </div>

                            {/* Total KM (calculado - KM VOLTA menos KM IDA) - se houver deslocamento */}
                            {formData.fl_deslocamento === 'P' && (
                                <div className="relative">
                                    <label htmlFor="total_km" className="text-sm font-medium text-gray-700 mb-1 block flex items-center">
                                        Total KM
                                        <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                            <Map size={10} className="inline mr-1" />
                                            Calculado
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        id="total_km"
                                        name="total_km"
                                        value={(formData.nr_km_volta || 0) - (formData.nr_km_ida || 0)}
                                        readOnly
                                        disabled={true}
                                        className={`${getInputClasses('nr_km_ida', true)} bg-blue-50 text-blue-700`}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Card de Atividades */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center mb-5">
                            <AlignLeft size={20} className="mr-2 text-blue-500" />
                            <h2 className="text-lg font-semibold text-gray-800">Atividades Realizadas</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-y-5">
                            {/* Atividades Realizadas */}
                            <div className="relative">
                                <label htmlFor="tx_atividades" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Atividades Realizadas <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="tx_atividades"
                                    name="tx_atividades"
                                    value={formData.tx_atividades || ''}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('tx_atividades')}
                                    placeholder="Descreva as atividades realizadas durante o atendimento"
                                    rows={5}
                                />
                                {formErrors.tx_atividades && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.tx_atividades}</span>
                                    </p>
                                )}
                            </div>

                            {/* Tarefas */}
                            <div className="relative">
                                <label htmlFor="tx_tarefas" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Tarefas
                                </label>
                                <textarea
                                    id="tx_tarefas"
                                    name="tx_tarefas"
                                    value={formData.tx_tarefas || ''}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('tx_tarefas')}
                                    placeholder="Liste as tarefas realizadas ou a realizar"
                                    rows={4}
                                />
                            </div>

                            {/* Pendências */}
                            <div className="relative">
                                <label htmlFor="tx_pendencias" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Pendências
                                </label>
                                <textarea
                                    id="tx_pendencias"
                                    name="tx_pendencias"
                                    value={formData.tx_pendencias || ''}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('tx_pendencias')}
                                    placeholder="Liste as pendências do atendimento"
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
                                <span>Cadastrar RAT</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}