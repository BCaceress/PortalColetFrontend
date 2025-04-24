'use client';

import { AgendaFormModal } from '@/components/modals/AgendaFormModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Interface para o cliente
interface Cliente {
    id_cliente: number;
    ds_nome: string;
}

// Interface para o usuário
interface Usuario {
    id_usuario: number;
    nome: string;
}

// Interface para a agenda
interface Agenda {
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
    cliente?: Cliente;
    contato?: {
        id_contato: number;
        ds_nome: string;
    };
    usuario?: Usuario;
}

export default function CadastroAgenda() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);

    // Abrir o modal automaticamente quando a página carregar
    useEffect(() => {
        // Carregar dados necessários para o formulário
        carregarDados();

        // Abrir o modal automaticamente
        setIsModalOpen(true);
    }, []);

    const carregarDados = async () => {
        // Aqui você faria as chamadas reais para a API
        // const responseClientes = await api.get('/clientes');
        // const responseUsuarios = await api.get('/usuarios');

        // Dados mockados para desenvolvimento
        setClientes([
            { id_cliente: 1, ds_nome: 'Empresa XYZ Ltda' },
            { id_cliente: 2, ds_nome: 'Comércio ABC S.A.' },
            { id_cliente: 3, ds_nome: 'Indústria 123' },
        ]);

        setUsuarios([
            { id_usuario: 1, nome: 'João Silva' },
            { id_usuario: 2, nome: 'Maria Oliveira' },
            { id_usuario: 3, nome: 'Carlos Santos' },
        ]);
    };

    const handleSalvarAgenda = async (agenda: Agenda) => {
        try {
            // Aqui você faria a chamada real para a API
            // await api.post('/agendas', agenda);

            console.log('Agenda salva:', agenda);

            // Redirecionar para a página de listagem de agendas
            router.push('/dashboard/agendas');
        } catch (error) {
            console.error('Erro ao salvar agenda:', error);
            // Aqui você poderia mostrar uma mensagem de erro
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Redirecionar para a página de listagem após fechar o modal
        router.push('/dashboard/agendas');
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <PageHeader
                title="Nova Agenda"
                description="Crie uma nova agenda para acompanhar seus compromissos"
                actionButton={<Plus className="w-8 h-8 text-teal-600" />}
            />

            {/* Botão alternativo para abrir o modal caso ele seja fechado */}
            <div className="mt-6 flex justify-center">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-md shadow-sm flex items-center gap-2"
                >
                    <Plus size={18} />
                    <span>Nova Agenda</span>
                </button>
            </div>

            {/* Modal de cadastro de agenda */}
            <AgendaFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                mode="create"
                onSave={handleSalvarAgenda}
                clientes={clientes}
                usuarios={usuarios}
            />
        </div>
    );
}