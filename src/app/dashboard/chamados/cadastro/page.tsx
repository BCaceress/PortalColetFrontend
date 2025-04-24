'use client';

import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, ArrowLeft, Loader2, Save, ShieldAlert, Ticket } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

// Define interfaces
interface ChamadoPayload {
    ds_titulo: string;
    ds_descricao?: string;
    ds_prioridade: 'baixa' | 'media' | 'alta' | 'critica';
    ds_status: 'aberto' | 'em_atendimento' | 'pendente' | 'resolvido' | 'fechado';
    ds_categoria: string;
    id_cliente: number;
    id_solicitante: number;
    id_atendente?: number;
}

interface Cliente {
    id_cliente: number;
    ds_nome: string;
}

interface Usuario {
    id_usuario: number;
    ds_nome: string;
}

export default function CadastroChamado() {
    const router = useRouter();
    const { user } = useAuth();

    // States
    const [formData, setFormData] = useState<ChamadoPayload>({
        ds_titulo: '',
        ds_descricao: '',
        ds_prioridade: 'media',
        ds_status: 'aberto',
        ds_categoria: '',
        id_cliente: 0,
        id_solicitante: user?.id || 0
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof ChamadoPayload, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // States para listas de seleção
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [isLoadingClientes, setIsLoadingClientes] = useState(false);
    const [isLoadingUsuarios, setIsLoadingUsuarios] = useState(false);

    // Carregar lista de clientes e usuários ao montar o componente
    useEffect(() => {
        fetchClientes();
        fetchUsuarios();
    }, []);

    // Buscar clientes ativos da API
    const fetchClientes = async () => {
        try {
            setIsLoadingClientes(true);
            // Em produção, seria:
            // const response = await api.get('/clientes/lista/ativos');
            // setClientes(response.data);

            // Dados mockados para desenvolvimento
            setClientes([
                { id_cliente: 101, ds_nome: 'Empresa ABC Ltda' },
                { id_cliente: 102, ds_nome: 'Indústrias XYZ S/A' },
                { id_cliente: 103, ds_nome: 'Consultoria 123' },
                { id_cliente: 104, ds_nome: 'Comércio Rápido Ltda' },
                { id_cliente: 105, ds_nome: 'Tech Solutions' }
            ]);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
            alert('Não foi possível carregar a lista de clientes. Tente novamente.');
        } finally {
            setIsLoadingClientes(false);
        }
    };

    // Buscar usuários da API
    const fetchUsuarios = async () => {
        try {
            setIsLoadingUsuarios(true);
            // Em produção, seria:
            // const response = await api.get('/usuarios');
            // setUsuarios(response.data);

            // Dados mockados para desenvolvimento
            setUsuarios([
                { id_usuario: 201, ds_nome: 'João Silva' },
                { id_usuario: 202, ds_nome: 'Maria Oliveira' },
                { id_usuario: 203, ds_nome: 'Pedro Santos' },
                { id_usuario: 204, ds_nome: 'Paula Mendes' },
                { id_usuario: 205, ds_nome: 'Amanda Costa' },
                { id_usuario: 301, ds_nome: 'Carlos Técnico' },
                { id_usuario: 302, ds_nome: 'Ana Suporte' },
                { id_usuario: 303, ds_nome: 'Roberto Técnico' }
            ]);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            alert('Não foi possível carregar a lista de usuários. Tente novamente.');
        } finally {
            setIsLoadingUsuarios(false);
        }
    };

    // Handle genérico para campos de texto e selects
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Tratamento especial para id_cliente e id_solicitante para garantir que sejam enviados como números
        if (name === 'id_cliente' || name === 'id_solicitante' || name === 'id_atendente') {
            const numValue = parseInt(value, 10);
            setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Limpar erro quando o usuário digitar
        if (formErrors[name as keyof ChamadoPayload]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof ChamadoPayload];
                return newErrors;
            });
        }
    };

    // Voltar para a lista de chamados
    const handleCancel = () => {
        router.push('/dashboard/chamados');
    };

    // Validação do formulário
    const validateForm = (): boolean => {
        const errors: Partial<Record<keyof ChamadoPayload, string>> = {};

        // Validar campos obrigatórios
        if (!formData.ds_titulo || !formData.ds_titulo.trim()) {
            errors.ds_titulo = 'Título é obrigatório';
        }

        if (!formData.ds_categoria || !formData.ds_categoria.trim()) {
            errors.ds_categoria = 'Categoria é obrigatória';
        }

        if (!formData.ds_prioridade) {
            errors.ds_prioridade = 'Prioridade é obrigatória';
        }

        if (!formData.id_cliente || formData.id_cliente <= 0) {
            errors.id_cliente = 'Cliente é obrigatório';
        }

        if (!formData.id_solicitante || formData.id_solicitante <= 0) {
            errors.id_solicitante = 'Solicitante é obrigatório';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Estilo dos campos
    const getInputClasses = (fieldName: keyof ChamadoPayload, disabled = false): string => {
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
    const getSelectClasses = (fieldName: keyof ChamadoPayload, disabled = false): string => {
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
            return `${baseClasses} bg-[#09A08D] hover:bg-teal-700 focus:ring-teal-500`;
        }
    };

    // Submit do formulário
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            setIsSubmitting(true);

            try {
                // Em produção, seria:
                // await api.post('/chamados', formData);

                // Simulação de envio para o servidor
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Redirecionar para lista de chamados após sucesso
                router.push('/dashboard/chamados');
            } catch (error) {
                console.error('Erro ao cadastrar chamado:', error);
                alert('Ocorreu um erro ao cadastrar o chamado. Tente novamente.');
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="p-1 sm:p-6 max-w-7xl mx-auto">
            {/* Cabeçalho da página */}
            <div className="mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Voltar"
                    >
                        <ArrowLeft size={20} className="text-gray-500" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Novo Chamado</h1>
                </div>
                <p className="text-gray-500 mt-1 ml-10">Preencha os campos abaixo para registrar um novo chamado</p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-8 ml-10">
                {/* Card de informações principais */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center mb-5">
                            <Ticket size={20} className="mr-2 text-blue-500" />
                            <h2 className="text-lg font-semibold text-gray-800">Informações do Chamado</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                            {/* Título do chamado */}
                            <div className="relative md:col-span-3">
                                <label htmlFor="ds_titulo" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Título <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="ds_titulo"
                                    name="ds_titulo"
                                    value={formData.ds_titulo}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('ds_titulo')}
                                    placeholder="Digite um título objetivo para o chamado"
                                />
                                {formErrors.ds_titulo && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.ds_titulo}</span>
                                    </p>
                                )}
                            </div>

                            {/* Cliente */}
                            <div className="relative md:col-span-2">
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

                            {/* Categoria */}
                            <div className="relative">
                                <label htmlFor="ds_categoria" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Categoria <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="ds_categoria"
                                        name="ds_categoria"
                                        value={formData.ds_categoria}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className={getSelectClasses('ds_categoria')}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Erro de Sistema">Erro de Sistema</option>
                                        <option value="Integração">Integração</option>
                                        <option value="Solicitação">Solicitação</option>
                                        <option value="Dúvida">Dúvida</option>
                                        <option value="Acesso">Acesso</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                                {formErrors.ds_categoria && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.ds_categoria}</span>
                                    </p>
                                )}
                            </div>

                            {/* Prioridade */}
                            <div className="relative md:col-span-2">
                                <label htmlFor="ds_prioridade" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Prioridade <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="ds_prioridade"
                                        name="ds_prioridade"
                                        value={formData.ds_prioridade}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className={getSelectClasses('ds_prioridade')}
                                    >
                                        <option value="baixa">Baixa</option>
                                        <option value="media">Média</option>
                                        <option value="alta">Alta</option>
                                        <option value="critica">Crítica</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                                {formErrors.ds_prioridade && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.ds_prioridade}</span>
                                    </p>
                                )}
                            </div>

                            {/* Status (geralmente fica como aberto inicialmente) */}
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
                                        <option value="aberto">Aberto</option>
                                        <option value="em_atendimento">Em Atendimento</option>
                                        <option value="pendente">Pendente</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Solicitante */}
                            <div className="relative md:col-span-2">
                                <label htmlFor="id_solicitante" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Solicitante <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="id_solicitante"
                                        name="id_solicitante"
                                        value={formData.id_solicitante}
                                        onChange={handleChange}
                                        disabled={isSubmitting || isLoadingUsuarios}
                                        className={getSelectClasses('id_solicitante')}
                                    >
                                        <option value={0}>Selecione um solicitante</option>
                                        {usuarios.map(usuario => (
                                            <option key={usuario.id_usuario} value={usuario.id_usuario}>
                                                {usuario.ds_nome} {usuario.id_usuario === user?.id ? '(Você)' : ''}
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
                                {formErrors.id_solicitante && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <ShieldAlert size={14} className="mr-1 flex-shrink-0" />
                                        <span>{formErrors.id_solicitante}</span>
                                    </p>
                                )}
                            </div>

                            {/* Atendente (opcional) */}
                            <div className="relative">
                                <label htmlFor="id_atendente" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Atendente
                                </label>
                                <div className="relative">
                                    <select
                                        id="id_atendente"
                                        name="id_atendente"
                                        value={formData.id_atendente || 0}
                                        onChange={handleChange}
                                        disabled={isSubmitting || isLoadingUsuarios}
                                        className={getSelectClasses('id_atendente')}
                                    >
                                        <option value={0}>Selecione (opcional)</option>
                                        {usuarios.filter(u => u.id_usuario >= 300).map(usuario => (
                                            <option key={usuario.id_usuario} value={usuario.id_usuario}>
                                                {usuario.ds_nome}
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
                            </div>

                            {/* Descrição do chamado */}
                            <div className="relative md:col-span-3">
                                <label htmlFor="ds_descricao" className="text-sm font-medium text-gray-700 mb-1 block flex items-center">
                                    Descrição
                                </label>
                                <ReactQuill
                                    id="ds_descricao"
                                    value={formData.ds_descricao || ''}
                                    onChange={(value) => setFormData(prev => ({ ...prev, ds_descricao: value }))}
                                    readOnly={isSubmitting}
                                    theme="snow"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Guia de prioridades */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center mb-5">
                            <AlertCircle size={20} className="mr-2 text-amber-500" />
                            <h2 className="text-lg font-semibold text-gray-800">Guia de Prioridades</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg bg-green-50 border-green-100">
                                <div className="flex items-center mb-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 mr-2">
                                        Baixa
                                    </span>
                                    <p className="text-sm font-medium text-gray-700">Até 72 horas úteis</p>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Para situações que não afetam as operações principais do cliente, como dúvidas gerais, solicitações de informação ou pequenos ajustes.
                                </p>
                            </div>

                            <div className="p-4 border rounded-lg bg-blue-50 border-blue-100">
                                <div className="flex items-center mb-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 mr-2">
                                        Média
                                    </span>
                                    <p className="text-sm font-medium text-gray-700">Até 48 horas úteis</p>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Para problemas que afetam funcionalidades específicas mas não impedem o uso do sistema como um todo.
                                </p>
                            </div>

                            <div className="p-4 border rounded-lg bg-amber-50 border-amber-100">
                                <div className="flex items-center mb-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 mr-2">
                                        <AlertCircle size={12} className="mr-1" />
                                        Alta
                                    </span>
                                    <p className="text-sm font-medium text-gray-700">Até 24 horas úteis</p>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Para problemas que afetam significativamente a operação do cliente, mas ainda permitem trabalhar com limitações ou alternativas.
                                </p>
                            </div>

                            <div className="p-4 border rounded-lg bg-red-50 border-red-100">
                                <div className="flex items-center mb-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 mr-2">
                                        <AlertCircle size={12} className="mr-1" />
                                        Crítica
                                    </span>
                                    <p className="text-sm font-medium text-gray-700">Até 4 horas úteis</p>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Para problemas críticos que impedem o funcionamento total do sistema, causando indisponibilidade completa ou comprometendo dados.
                                </p>
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
                                <span>Cadastrar Chamado</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}