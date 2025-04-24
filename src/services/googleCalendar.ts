// Browser-compatible Google Calendar service

// Google Calendar API constants
const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
];

// Carregando de variáveis de ambiente
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';

// Interface for calendar events
export interface GoogleCalendarEvent {
    id?: string;
    summary: string;
    description?: string;
    location?: string;
    start: {
        dateTime: string;
        timeZone?: string;
    };
    end: {
        dateTime: string;
        timeZone?: string;
    };
    colorId?: string;
    attendees?: Array<{ email: string; displayName?: string }>;
}

// Convert local agenda format to Google Calendar format
export const convertToGoogleEvent = (agenda: any): GoogleCalendarEvent => {
    // Validar se a agenda possui os campos mínimos necessários
    if (!agenda || !agenda.ds_titulo || !agenda.dt_agendamento) {
        console.error('Agenda inválida ou incompleta:', agenda);
        throw new Error('Agenda inválida ou incompleta para conversão');
    }

    const start = new Date(agenda.dt_agendamento);
    let end;

    if (agenda.dt_fim) {
        end = new Date(agenda.dt_fim);
    } else if (agenda.dt_inicio) {
        // If we have a start time but no end time, make it a 1-hour event
        end = new Date(new Date(agenda.dt_inicio).getTime() + 60 * 60 * 1000);
    } else {
        // Default to a 1-hour event from the agenda time
        end = new Date(start.getTime() + 60 * 60 * 1000);
    }

    // Color mapping based on local agenda status
    const colorIdMap: Record<string, string> = {
        agendado: '1', // Blue
        em_andamento: '5', // Yellow
        concluido: '2', // Green
        cancelado: '4', // Red
    };

    // Compose description with cliente name and any existing description
    let description = '';
    if (agenda.cliente?.ds_nome) {
        description += `Cliente: ${agenda.cliente.ds_nome}\n`;
    }
    if (agenda.contato?.ds_nome) {
        description += `Contato: ${agenda.contato.ds_nome}\n`;
    }
    if (agenda.ds_descricao) {
        description += `\n${agenda.ds_descricao}`;
    }

    const event: GoogleCalendarEvent = {
        summary: agenda.ds_titulo,
        description,
        start: {
            dateTime: start.toISOString(),
            timeZone: 'America/Sao_Paulo'
        },
        end: {
            dateTime: end.toISOString(),
            timeZone: 'America/Sao_Paulo'
        },
        colorId: colorIdMap[agenda.ds_status] || '0',
    };

    // Adicionar ID do evento caso já exista no Google Calendar
    if (agenda.google_event_id) {
        event.id = agenda.google_event_id;
    }

    // Adicionar participantes apenas se o contato tiver email
    if (agenda.contato?.ds_email) {
        event.attendees = [
            { email: agenda.contato.ds_email, displayName: agenda.contato.ds_nome }
        ];
    }

    return event;
};

// Convert Google Calendar event to local agenda format
export const convertFromGoogleEvent = (event: any): any => {
    // Validar se o evento possui os campos mínimos necessários
    if (!event || !event.id || !event.summary) {
        console.error('Evento do Google Calendar inválido:', event);
        throw new Error('Evento do Google Calendar inválido para conversão');
    }

    return {
        id_agenda: 0, // Será atribuído pelo backend
        ds_titulo: event.summary || 'Sem título',
        ds_descricao: event.description || '',
        ds_tipo: 'agenda',
        ds_status: getStatusFromColorId(event.colorId),
        ds_prioridade: 'media', // Prioridade padrão
        dt_agendamento: event.start?.dateTime || event.start?.date || new Date().toISOString(),
        dt_inicio: event.start?.dateTime || event.start?.date || new Date().toISOString(),
        dt_fim: event.end?.dateTime || event.end?.date || new Date().toISOString(),
        google_event_id: event.id
    };
};

// Helper to determine status from Google Calendar color ID
const getStatusFromColorId = (colorId: string = '0'): string => {
    const colorMap: Record<string, string> = {
        '1': 'agendado',
        '5': 'em_andamento',
        '2': 'concluido',
        '4': 'cancelado',
    };

    return colorMap[colorId] || 'agendado';
};

// Browser-compatible Google Calendar service
class GoogleCalendarService {
    private accessToken: string | null = null;
    private gapiLoaded: boolean = false;

    setAccessToken(token: string) {
        if (!token || typeof token !== 'string') {
            console.error('Token inválido:', token);
            throw new Error('Token de acesso inválido');
        }
        this.accessToken = token;

        // Set auth token for GAPI if it's already loaded
        if (this.gapiLoaded && window.gapi?.client) {
            window.gapi.client.setToken({ access_token: token });
        }
    }

    isAuthenticated(): boolean {
        return !!this.accessToken;
    }

    async loadGapiClient() {
        if (this.gapiLoaded) return;

        if (!API_KEY) {
            throw new Error('Google API Key não configurada nas variáveis de ambiente');
        }

        return new Promise<void>((resolve, reject) => {
            // Only load if gapi is not already available
            if (typeof window !== 'undefined' && !window.gapi) {
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.async = true;
                script.defer = true;

                script.onload = () => {
                    window.gapi.load('client', async () => {
                        try {
                            await window.gapi.client.init({
                                apiKey: API_KEY,
                                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
                            });

                            // Set the token if we already have one
                            if (this.accessToken) {
                                window.gapi.client.setToken({ access_token: this.accessToken });
                            }

                            this.gapiLoaded = true;
                            resolve();
                        } catch (error) {
                            console.error('Erro ao inicializar o cliente da Google API:', error);
                            reject(error);
                        }
                    });
                };

                script.onerror = (error) => {
                    console.error('Erro ao carregar o script da Google API:', error);
                    reject(error);
                };
                document.body.appendChild(script);
            } else if (typeof window !== 'undefined' && window.gapi) {
                // If gapi is already loaded, just initialize the client
                window.gapi.load('client', async () => {
                    try {
                        await window.gapi.client.init({
                            apiKey: API_KEY,
                            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
                        });

                        // Set the token if we already have one
                        if (this.accessToken) {
                            window.gapi.client.setToken({ access_token: this.accessToken });
                        }

                        this.gapiLoaded = true;
                        resolve();
                    } catch (error) {
                        console.error('Erro ao inicializar o cliente da Google API:', error);
                        reject(error);
                    }
                });
            } else {
                // If we're in a server environment, resolve immediately
                resolve();
            }
        });
    }

    async listEvents(timeMin?: Date, timeMax?: Date) {
        if (!this.accessToken) {
            throw new Error('Não autenticado com o Google Calendar');
        }

        if (!API_KEY) {
            throw new Error('Google API Key não configurada nas variáveis de ambiente');
        }

        await this.ensureGapiLoaded();

        if (typeof window === 'undefined' || !window.gapi) {
            throw new Error('Google API não disponível no ambiente atual');
        }

        try {
            const now = new Date();
            const oneMonthFromNow = new Date(now);
            oneMonthFromNow.setMonth(now.getMonth() + 1);

            // Adicionar logs para debug
            console.log('Buscando eventos no Google Calendar com:');
            console.log('- Token:', this.accessToken ? 'Presente (não exibido por segurança)' : 'Ausente');
            console.log('- Período:', (timeMin || now).toISOString(), 'até', (timeMax || oneMonthFromNow).toISOString());

            const response = await window.gapi.client.calendar.events.list({
                calendarId: 'primary',
                timeMin: (timeMin || now).toISOString(),
                timeMax: (timeMax || oneMonthFromNow).toISOString(),
                maxResults: 100,
                singleEvents: true,
                orderBy: 'startTime',
                access_token: this.accessToken
            });

            // Verificando o status da resposta
            if (response.status !== 200) {
                console.error('Erro na resposta da API do Google Calendar:', response);
                throw new Error(`Erro ao listar eventos: status ${response.status}`);
            }

            // Garantir que temos eventos antes de retornar
            if (!response.result || !response.result.items) {
                console.warn('Resposta da API sem eventos:', response);
                return [];
            }

            return response.result.items || [];
        } catch (error) {
            console.error('Erro ao buscar eventos do Google Calendar:', error);
            throw error;
        }
    }

    async createEvent(event: GoogleCalendarEvent) {
        if (!this.accessToken) {
            throw new Error('Não autenticado com o Google Calendar');
        }

        if (!API_KEY) {
            throw new Error('Google API Key não configurada nas variáveis de ambiente');
        }

        await this.ensureGapiLoaded();

        if (typeof window === 'undefined' || !window.gapi) {
            throw new Error('Google API não disponível');
        }

        try {
            const response = await window.gapi.client.calendar.events.insert({
                calendarId: 'primary',
                resource: event,
                access_token: this.accessToken
            });
            return response.result;
        } catch (error) {
            console.error('Erro ao criar evento no Google Calendar:', error);
            throw error;
        }
    }

    async updateEvent(eventId: string, event: GoogleCalendarEvent) {
        if (!this.accessToken) {
            throw new Error('Não autenticado com o Google Calendar');
        }

        if (!eventId || typeof eventId !== 'string') {
            throw new Error('ID do evento inválido para atualização');
        }

        await this.ensureGapiLoaded();

        if (typeof window === 'undefined' || !window.gapi) {
            throw new Error('Google API não disponível');
        }

        try {
            const response = await window.gapi.client.calendar.events.update({
                calendarId: 'primary',
                eventId,
                resource: event,
                access_token: this.accessToken
            });
            return response.result;
        } catch (error) {
            console.error(`Erro ao atualizar evento ${eventId} no Google Calendar:`, error);
            throw error;
        }
    }

    async deleteEvent(eventId: string) {
        if (!this.accessToken) {
            throw new Error('Não autenticado com o Google Calendar');
        }

        if (!eventId || typeof eventId !== 'string') {
            throw new Error('ID do evento inválido para exclusão');
        }

        await this.ensureGapiLoaded();

        if (typeof window === 'undefined' || !window.gapi) {
            throw new Error('Google API não disponível');
        }

        try {
            await window.gapi.client.calendar.events.delete({
                calendarId: 'primary',
                eventId,
                access_token: this.accessToken
            });
            return true;
        } catch (error) {
            console.error(`Erro ao excluir evento ${eventId} do Google Calendar:`, error);
            throw error;
        }
    }

    async syncMultipleEvents(events: GoogleCalendarEvent[]) {
        if (!this.accessToken) {
            throw new Error('Não autenticado com o Google Calendar');
        }

        if (!Array.isArray(events) || events.length === 0) {
            console.warn('Nenhum evento para sincronizar');
            return [];
        }

        try {
            const results = await Promise.all(
                events.map(async (event) => {
                    try {
                        if (event.id) {
                            return await this.updateEvent(event.id, event);
                        } else {
                            return await this.createEvent(event);
                        }
                    } catch (err) {
                        console.error('Erro ao sincronizar evento individual:', err);
                        return null;
                    }
                })
            );
            return results.filter(Boolean);
        } catch (error) {
            console.error('Erro ao sincronizar múltiplos eventos com o Google Calendar:', error);
            throw error;
        }
    }

    private async ensureGapiLoaded() {
        if (!this.gapiLoaded) {
            await this.loadGapiClient();
        }

        // Ensure token is set in GAPI client
        if (this.accessToken && window.gapi?.client) {
            window.gapi.client.setToken({ access_token: this.accessToken });
        }
    }
}

// Add TypeScript interfaces for window.gapi
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

const googleCalendarService = new GoogleCalendarService();
export default googleCalendarService;