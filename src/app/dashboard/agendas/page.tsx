'use client';

import { GoogleCalendarSync } from '@/components/GoogleCalendarSync';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import moment from 'moment';
import 'moment/locale/pt-br';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './agendas.module.css';

// Setup the localizer for react-big-calendar
moment.locale('pt-br');
const localizer = momentLocalizer(moment);

// Define the Agenda type
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
    cliente?: {
        id_cliente: number;
        ds_nome: string;
    };
    contato?: {
        id_contato: number;
        ds_nome: string;
    };
    usuario?: {
        id_usuario: number;
        nome: string;
    };
}

// Calendar event interface for react-big-calendar
interface CalendarEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: Agenda;
}

// Modal mode type
type ModalMode = 'create' | 'edit' | 'view';
type ConvertType = 'rat' | 'ticket' | null;
type ViewMode = 'table' | 'calendar';

// Calendar event style customization
const eventStyleGetter = (event: CalendarEvent) => {
    const agenda = event.resource as Agenda;
    if (!agenda) return {};

    let className = '';

    switch (agenda.ds_tipo) {
        case 'agenda':
            className = styles.calendarEventAgenda;
            break;
        case 'rat':
            className = styles.calendarEventRat;
            break;
        case 'ticket':
            className = styles.calendarEventTicket;
            break;
    }

    if (agenda.ds_status === 'cancelado') {
        className += ' opacity-60';
    }

    if (agenda.ds_prioridade === 'alta' || agenda.ds_prioridade === 'urgente') {
        className += ' border-l-4';
    }

    return {
        className: `${className} shadow-sm hover:shadow-md transition-shadow duration-150`,
        style: {
            fontSize: '0.85rem',
            fontWeight: agenda.ds_prioridade === 'urgente' ? 600 : 500,
            padding: '2px 8px'
        }
    };
};

export default function Agendas() {
    const router = useRouter();
    const { isAuthenticated, isLoading: googleAuthLoading } = useGoogleAuth();
    const [agendas, setAgendas] = useState<Agenda[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSynchronized, setIsSynchronized] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('calendar'); // Default to calendar view
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('create');
    const [currentAgenda, setCurrentAgenda] = useState<Agenda | null>(null);
    const [clientes, setClientes] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [convertType, setConvertType] = useState<ConvertType>(null);

    useEffect(() => {
        const fetchAgendas = async () => {
            try {
                setLoading(true);
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const mockAgendas: Agenda[] = [
                    {
                        id_agenda: 1,
                        ds_titulo: 'Implantação do sistema - Cliente A',
                        ds_descricao: 'Implantação do módulo financeiro',
                        ds_tipo: 'agenda',
                        ds_status: 'agendado',
                        ds_prioridade: 'alta',
                        dt_agendamento: tomorrow.toISOString(),
                        id_cliente: 101,
                        id_usuario: 201,
                        cliente: {
                            id_cliente: 101,
                            ds_nome: 'Empresa ABC Ltda'
                        },
                        usuario: {
                            id_usuario: 201,
                            nome: 'João Silva'
                        },
                        contato: {
                            id_contato: 301,
                            ds_nome: 'Maria Financeiro'
                        },
                    }
                ];

                setAgendas(mockAgendas);
                setError(null);
            } catch (err) {
                console.error('Erro ao buscar agendas:', err);
                setError('Não foi possível carregar as agendas. Tente novamente mais tarde.');
            } finally {
                setLoading(false);
            }
        };

        fetchAgendas();
    }, []);

    // Convert agendas to calendar events
    useEffect(() => {
        if (agendas.length > 0) {
            const events = agendas.map(agenda => {
                const start = agenda.dt_inicio
                    ? new Date(agenda.dt_inicio)
                    : new Date(agenda.dt_agendamento);

                let end;
                if (agenda.dt_fim) {
                    end = new Date(agenda.dt_fim);
                } else {
                    // If no end date, set to 1 hour after start
                    end = new Date(start);
                    end.setHours(end.getHours() + 1);
                }

                return {
                    id: agenda.id_agenda,
                    title: agenda.ds_titulo,
                    start,
                    end,
                    allDay: false,
                    resource: agenda
                };
            });

            setCalendarEvents(events);
        }
    }, [agendas]);

    return (
        <div className="p-1 sm:p-6 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="mb-6"
            >
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-medium text-gray-900 flex items-center">
                            <img
                                src="https://www.gstatic.com/images/branding/product/1x/calendar_48dp.png"
                                alt="Google Calendar"
                                className="w-5 h-5 mr-2"
                            />
                            Sincronização com Google Agenda
                        </h2>
                    </div>
                    <div className="p-4">
                        <GoogleCalendarSync
                            agendas={agendas}
                            onSyncComplete={(updatedAgendas) => {
                                setAgendas(updatedAgendas);
                                setIsSynchronized(true);
                            }}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Only show calendar/table views after synchronization */}
            {isSynchronized && (
                <>
                    {/* View toggle buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="mb-4"
                    >
                        <div className="flex justify-center bg-white rounded-lg shadow-sm border border-gray-100 p-1 w-fit mx-auto">
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`px-4 py-2 rounded-md flex items-center gap-2 ${viewMode === 'calendar'
                                        ? 'bg-teal-50 text-teal-700 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar">
                                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                Calendário
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-4 py-2 rounded-md flex items-center gap-2 ${viewMode === 'table'
                                        ? 'bg-teal-50 text-teal-700 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-table">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                    <line x1="3" y1="9" x2="21" y2="9" />
                                    <line x1="3" y1="15" x2="21" y2="15" />
                                    <line x1="9" y1="3" x2="9" y2="21" />
                                    <line x1="15" y1="3" x2="15" y2="21" />
                                </svg>
                                Tabela
                            </button>
                        </div>
                    </motion.div>

                    {/* View container */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                    >
                        {viewMode === 'calendar' && (
                            <div className="calendar-container h-[600px] p-2">
                                <Calendar
                                    localizer={localizer}
                                    events={calendarEvents}
                                    startAccessor="start"
                                    endAccessor="end"
                                    style={{ height: '100%' }}
                                    eventPropGetter={eventStyleGetter}
                                    formats={{
                                        monthHeaderFormat: (date) => format(date, 'MMMM yyyy', { locale: ptBR }),
                                        dayHeaderFormat: (date) => format(date, 'EEEE, dd', { locale: ptBR }),
                                        dayRangeHeaderFormat: ({ start, end }) =>
                                            `${format(start, 'dd', { locale: ptBR })} - ${format(end, 'dd MMM', {
                                                locale: ptBR,
                                            })}`,
                                    }}
                                    messages={{
                                        today: 'Hoje',
                                        previous: 'Anterior',
                                        next: 'Próximo',
                                        month: 'Mês',
                                        week: 'Semana',
                                        day: 'Dia',
                                        agenda: 'Agenda',
                                        date: 'Data',
                                        time: 'Hora',
                                        event: 'Evento',
                                        noEventsInRange: 'Não há eventos neste período.',
                                        showMore: (total) => `+ ${total} mais`,
                                    }}
                                />
                            </div>
                        )}

                        {viewMode === 'table' && (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {agendas.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-4 px-6 text-center text-gray-500">
                                                    Não há agendamentos disponíveis.
                                                </td>
                                            </tr>
                                        ) : (
                                            agendas.map((agenda) => (
                                                <tr key={agenda.id_agenda} className="hover:bg-gray-50 border-t border-gray-100">
                                                    <td className="py-3 px-4 text-sm">
                                                        <div className="font-medium text-gray-900">{agenda.ds_titulo}</div>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                        {format(new Date(agenda.dt_agendamento), 'dd/MM/yyyy HH:mm')}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                        {agenda.cliente?.ds_nome || '-'}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                                            ${agenda.ds_status === 'agendado' ? 'bg-blue-100 text-blue-800' : ''}
                                                            ${agenda.ds_status === 'em_andamento' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                            ${agenda.ds_status === 'concluido' ? 'bg-green-100 text-green-800' : ''}
                                                            ${agenda.ds_status === 'cancelado' ? 'bg-red-100 text-red-800' : ''}
                                                        `}>
                                                            {agenda.ds_status === 'agendado' && 'Agendado'}
                                                            {agenda.ds_status === 'em_andamento' && 'Em andamento'}
                                                            {agenda.ds_status === 'concluido' && 'Concluído'}
                                                            {agenda.ds_status === 'cancelado' && 'Cancelado'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                                            ${agenda.ds_tipo === 'agenda' ? 'bg-purple-100 text-purple-800' : ''}
                                                            ${agenda.ds_tipo === 'rat' ? 'bg-indigo-100 text-indigo-800' : ''}
                                                            ${agenda.ds_tipo === 'ticket' ? 'bg-cyan-100 text-cyan-800' : ''}
                                                        `}>
                                                            {agenda.ds_tipo === 'agenda' && 'Agenda'}
                                                            {agenda.ds_tipo === 'rat' && 'RAT'}
                                                            {agenda.ds_tipo === 'ticket' && 'Ticket'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </div>
    );
}