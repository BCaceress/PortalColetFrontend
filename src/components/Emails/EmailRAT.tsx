import api from '@/services/api';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Loader2, Mail } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Define the RAT type for this component (or import from a types file)
interface RAT {
    id_rat: number;
    ds_status: string;
    dt_data_hora_entrada: string;
    dt_data_hora_saida: string;
    tm_duracao: string;
    tx_atividades?: string;
    tx_tarefas?: string;
    tx_pendencias?: string;
    ds_observacao?: string;
    usuario?: {
        id_usuario: number;
        nome: string;
    };
    cliente?: {
        id_cliente: number;
        ds_nome: string;
    };
    contato?: {
        id_contato: number;
        ds_nome: string;
        ds_email?: string;
    };
}

interface EmailCliente {
    id_email_cliente: number;
    ds_email: string;
    id_cliente: number;
}

interface EmailRATProps {
    rat: RAT;
    variant?: 'icon' | 'button';
    size?: 'sm' | 'md';
}

export const EmailRAT = ({ rat, variant = 'icon', size = 'md' }: EmailRATProps) => {
    // Estado para controlar loading durante a busca do email
    const [isLoading, setIsLoading] = useState(false);
    // Estado para mostrar o dropdown de opções de email
    const [showOptions, setShowOptions] = useState(false);
    // Ref para o dropdown
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fechar dropdown quando clicar fora dele
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowOptions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Format date helper function
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
        } catch (error) {
            return 'Data inválida';
        }
    };

    // Format duration helper function
    const formatDuration = (duration: string) => {
        if (!duration) return '-';
        const [hours, minutes] = duration.split(':');
        return `${hours}h ${minutes}min`;
    };

    // Generate email content - usando apenas formato texto simples
    const generateEmailContent = (rat: RAT) => {
        const clienteName = rat.cliente?.ds_nome || 'Cliente não informado';
        const ratDate = formatDate(rat.dt_data_hora_entrada);
        const startTime = format(parseISO(rat.dt_data_hora_entrada), 'HH:mm');
        const endTime = format(parseISO(rat.dt_data_hora_saida), 'HH:mm');
        const technician = rat.usuario?.nome || 'Técnico não informado';

        const subject = `Relatório de Atendimento Técnico #${rat.id_rat} - ${clienteName}`;

        // Formato texto simples mais limpo e legível
        const body = `
Prezado(a) Cliente,

Agradecemos pela confiança em nossos serviços. Segue o resumo do atendimento técnico realizado:

Registro de Atendimento: #${rat.id_rat}
Cliente: ${clienteName}
Data: ${ratDate}
Horário: ${startTime} às ${endTime}
Duração: ${formatDuration(rat.tm_duracao)}
Técnico: ${technician}
Status: ${rat.ds_status}
${rat.tx_atividades ? `\nAtividades Realizadas:\n${rat.tx_atividades}` : ''}${rat.tx_tarefas ? `\n\nTarefas Concluídas:\n${rat.tx_tarefas}` : ''}${rat.tx_pendencias ? `\n\nPendências:\n${rat.tx_pendencias}` : ''}${rat.ds_observacao ? `\n\nObservações:\n${rat.ds_observacao}` : ''}

Para qualquer esclarecimento adicional, não hesite em nos contatar.

Atenciosamente,
Equipe de Suporte Técnico
`;

        return { subject, body };
    };

    // Buscar email do contato via API
    const fetchContatoEmail = async (contatoId: number) => {
        try {
            const response = await api.get(`/contatos/${contatoId}`);
            return response.data.ds_email || '';
        } catch (error) {
            console.error('Erro ao buscar email do contato:', error);
            // Se falhar, tenta usar o email já presente no objeto RAT
            return rat.contato?.ds_email || '';
        }
    };

    // Buscar emails adicionais do cliente da tabela EmailCliente
    const fetchEmailsCliente = async (clienteId: number) => {
        try {
            const response = await api.get(`/clientes/${clienteId}/emails`);
            return response.data || [];
        } catch (error) {
            console.error('Erro ao buscar emails do cliente:', error);
            return [];
        }
    };

    // Handle email sending
    const handleSendEmail = async (e: React.MouseEvent, useGmail: boolean = false) => {
        e.stopPropagation();
        setShowOptions(false);
        setIsLoading(true);

        try {
            if (!rat.cliente?.id_cliente) {
                throw new Error('ID do cliente não encontrado');
            }

            // Buscar o email do contato via API
            let toEmail = '';

            if (rat.contato?.id_contato) {
                toEmail = await fetchContatoEmail(rat.contato.id_contato);
            }

            if (!toEmail) {
                alert('Não foi possível obter o email do contato.');
                setIsLoading(false);
                return;
            }

            // Buscar emails adicionais da tabela EmailCliente
            const emailsCliente = await fetchEmailsCliente(rat.cliente.id_cliente);
            const ccEmails = emailsCliente.map((email: EmailCliente) => email.ds_email).join(',');

            const { subject, body } = generateEmailContent(rat);

            if (useGmail) {
                // Gmail URL format
                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}${ccEmails ? `&cc=${encodeURIComponent(ccEmails)}` : ''}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

                // Abrir o Gmail em uma nova aba
                window.open(gmailUrl, '_blank');
            } else {
                // Criar o mailto URL com cc para os emails adicionais
                const mailtoLink = `mailto:${toEmail}${ccEmails ? `?cc=${encodeURIComponent(ccEmails)}` : ''}${ccEmails ? '&' : '?'}subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

                try {
                    // Abrir no cliente de email padrão
                    window.location.href = mailtoLink;
                } catch (mailtoError) {
                    console.error('Erro ao abrir cliente de email:', mailtoError);

                    // Oferecer alternativa de copiar o email para a área de transferência
                    const confirmCopy = window.confirm(
                        'Não foi possível abrir seu cliente de email. Deseja copiar o endereço de email do contato para a área de transferência?'
                    );

                    if (confirmCopy) {
                        try {
                            await navigator.clipboard.writeText(toEmail);
                            alert(`Email copiado: ${toEmail}`);
                        } catch (clipboardError) {
                            console.error('Erro ao copiar para área de transferência:', clipboardError);
                            alert(`O email do contato é: ${toEmail}`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao processar o email:', error);
            alert('Ocorreu um erro ao processar o email. Tente novamente mais tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle dropdown
    const toggleOptions = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowOptions(!showOptions);
    };

    // Email options dropdown
    const EmailOptions = () => (
        <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200"
        >
            <button
                onClick={(e) => handleSendEmail(e, false)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
                <Mail size={14} />
                <span>Email Padrão</span>
            </button>
            <button
                onClick={(e) => handleSendEmail(e, true)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" className="text-red-500">
                    <path fill="currentColor" d="M20 18h-2V9.25L12 13L6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                </svg>
                <span>Gmail</span>
            </button>
        </div>
    );

    // Render icon variant
    if (variant === 'icon') {
        return (
            <div className="relative">
                <motion.button
                    onClick={toggleOptions}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.97 }}
                    className="p-1 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                    title="Opções de email"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 size={size === 'sm' ? 14 : 18} className="animate-spin" />
                    ) : (
                        <Mail size={size === 'sm' ? 14 : 18} />
                    )}
                </motion.button>
                {showOptions && <EmailOptions />}
            </div>
        );
    }

    // Render button variant
    return (
        <div className="relative">
            <motion.button
                onClick={toggleOptions}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 flex items-center gap-1"
                disabled={isLoading}
            >
                {isLoading ? (
                    <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" />
                ) : (
                    <Mail size={size === 'sm' ? 12 : 14} />
                )}
                E-mail
            </motion.button>
            {showOptions && <EmailOptions />}
        </div>
    );
};