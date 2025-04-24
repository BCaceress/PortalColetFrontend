'use client';

import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import googleCalendarService, { convertFromGoogleEvent, convertToGoogleEvent } from '@/services/googleCalendar';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Check, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

interface GoogleCalendarSyncProps {
    agendas: any[];
    onSyncComplete: (updatedAgendas: any[]) => void;
}

export function GoogleCalendarSync({ agendas, onSyncComplete }: GoogleCalendarSyncProps) {
    const { isAuthenticated, isLoading, user, signIn, signOut } = useGoogleAuth();
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{
        success: boolean;
        message: string;
        count?: number;
        details?: string;
    } | null>(null);

    const handleSignIn = async () => {
        try {
            setSyncResult(null);
            await signIn();
        } catch (error) {
            console.error('Failed to sign in:', error);
            setSyncResult({
                success: false,
                message: 'Falha ao autenticar com o Google.',
                details: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    };

    const handleSyncWithGoogle = async () => {
        if (!isAuthenticated) {
            setSyncResult({
                success: false,
                message: 'Por favor, faça login com o Google primeiro.'
            });
            return;
        }

        try {
            setSyncing(true);
            setSyncResult(null);

            // Validate token before proceeding
            const tokenValidation = await validateToken();
            if (!tokenValidation.valid) {
                setSyncResult({
                    success: false,
                    message: 'Sessão do Google expirada. Por favor, faça login novamente.',
                    details: tokenValidation.error
                });
                signOut();
                setSyncing(false);
                return;
            }

            // Verifique se existem agendas para sincronizar
            if (!agendas || agendas.length === 0) {
                setSyncResult({
                    success: true,
                    message: 'Não há agendamentos para sincronizar com o Google Agenda.',
                    count: 0
                });
                setSyncing(false);
                return;
            }

            // Convert local agendas to Google Calendar format
            const googleEvents = agendas.map(agenda => convertToGoogleEvent(agenda));

            // Push to Google Calendar
            const syncedEvents = await Promise.all(
                googleEvents.map(async (event) => {
                    try {
                        if (event.id) {
                            return await googleCalendarService.updateEvent(event.id, event);
                        } else {
                            return await googleCalendarService.createEvent(event);
                        }
                    } catch (err) {
                        console.error('Error syncing event:', err);
                        return null;
                    }
                })
            );

            // Filter out failed syncs
            const successfulEvents = syncedEvents.filter(Boolean);

            // Update local agendas with Google event IDs
            const updatedAgendas = agendas.map((agenda, index) => {
                if (syncedEvents[index]) {
                    return {
                        ...agenda,
                        google_event_id: syncedEvents[index].id
                    };
                }
                return agenda;
            });

            onSyncComplete(updatedAgendas);

            setSyncResult({
                success: true,
                message: `${successfulEvents.length} agendamentos sincronizados com sucesso!`,
                count: successfulEvents.length
            });
        } catch (error) {
            console.error('Error syncing with Google Calendar:', error);

            let errorMessage = 'Falha ao sincronizar com o Google Agenda.';
            let details = '';

            if (error && typeof error === 'object') {
                if ('error' in error) {
                    const googleError = (error as any).error;
                    if (googleError && googleError.message) {
                        details = `Erro: ${googleError.message}`;
                    } else if (googleError && googleError.status) {
                        details = `Status: ${googleError.status}`;
                    }
                } else if (error instanceof Error) {
                    details = error.message;
                }
            }

            setSyncResult({
                success: false,
                message: errorMessage,
                details
            });

            // If we received a 401, the token is invalid and we should sign out
            if (details.includes('401')) {
                signOut();
            }
        } finally {
            setSyncing(false);
        }
    };

    const handleImportFromGoogle = async () => {
        if (!isAuthenticated) {
            setSyncResult({
                success: false,
                message: 'Por favor, faça login com o Google primeiro.'
            });
            return;
        }

        try {
            setSyncing(true);
            setSyncResult(null);

            // Validate token before proceeding
            const tokenValidation = await validateToken();
            if (!tokenValidation.valid) {
                setSyncResult({
                    success: false,
                    message: 'Sessão do Google expirada. Por favor, faça login novamente.',
                    details: tokenValidation.error
                });
                signOut();
                setSyncing(false);
                return;
            }

            // Get events from Google Calendar
            const googleEvents = await googleCalendarService.listEvents();

            if (!googleEvents || googleEvents.length === 0) {
                setSyncResult({
                    success: true,
                    message: 'Não há eventos para importar do Google Agenda.',
                    count: 0
                });
                setSyncing(false);
                return;
            }

            console.log('Eventos encontrados no Google Calendar:', googleEvents.length);

            // Convert Google events to local format
            const importedAgendas = googleEvents.map(event => convertFromGoogleEvent(event));

            // Filter out events that already exist in our system
            const existingIds = new Set(agendas.map(a => a.google_event_id).filter(Boolean));
            const newAgendas = importedAgendas.filter(agenda =>
                agenda.google_event_id && !existingIds.has(agenda.google_event_id)
            );

            if (newAgendas.length > 0) {
                onSyncComplete([...agendas, ...newAgendas]);

                setSyncResult({
                    success: true,
                    message: `${newAgendas.length} novos eventos importados do Google Agenda!`,
                    count: newAgendas.length
                });
            } else {
                setSyncResult({
                    success: true,
                    message: 'Não há novos eventos para importar.',
                    count: 0
                });
            }
        } catch (error) {
            console.error('Error importing from Google Calendar:', error);

            // Mensagem de erro mais detalhada
            let errorMessage = 'Falha ao importar do Google Agenda.';
            let details = '';

            if (error && typeof error === 'object') {
                if ('error' in error) {
                    const googleError = (error as any).error;
                    if (googleError && googleError.message) {
                        details = `Erro: ${googleError.message}`;
                    } else if (googleError && googleError.status) {
                        details = `Status: ${googleError.status}`;
                    }
                } else if (error instanceof Error) {
                    details = error.message;
                }
            }

            setSyncResult({
                success: false,
                message: errorMessage,
                details
            });

            // If we received a 401, the token is invalid and we should sign out
            if (details.includes('401')) {
                signOut();
            }
        } finally {
            setSyncing(false);
        }
    };

    const validateToken = async (): Promise<{ valid: boolean; error?: string }> => {
        try {
            // Get token from storage
            const token = localStorage.getItem('googleAuthToken');
            if (!token) {
                return {
                    valid: false,
                    error: 'Token não encontrado'
                };
            }

            // Try to make a simple API call to verify token
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Update the token in the service to ensure it's the latest
                googleCalendarService.setAccessToken(token);
                return { valid: true };
            } else {
                return {
                    valid: false,
                    error: `API retornou status ${response.status}: ${response.statusText}`
                };
            }
        } catch (err) {
            console.error('Erro validando token:', err);
            return {
                valid: false,
                error: err instanceof Error ? err.message : 'Erro na validação do token'
            };
        }
    };

    return (
        <div className="flex flex-col gap-3">
            {isAuthenticated ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden">
                                <img
                                    src={user?.imageUrl || "https://via.placeholder.com/40"}
                                    alt={user?.name || "Usuário Google"}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={signOut}
                            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                        >
                            Desconectar
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                            onClick={handleSyncWithGoogle}
                            disabled={syncing}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {syncing ? (
                                <RefreshCw size={16} className="animate-spin" />
                            ) : (
                                <Calendar size={16} />
                            )}
                            <span>Enviar para Google Agenda</span>
                        </button>

                        <button
                            onClick={handleImportFromGoogle}
                            disabled={syncing}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 border border-teal-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {syncing ? (
                                <RefreshCw size={16} className="animate-spin" />
                            ) : (
                                <RefreshCw size={16} />
                            )}
                            <span>Importar do Google Agenda</span>
                        </button>
                    </div>

                    <AnimatePresence>
                        {syncResult && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`mt-3 p-2 rounded-md flex items-start flex-col gap-1 ${syncResult.success
                                    ? 'bg-green-50 border border-green-100 text-green-700'
                                    : 'bg-red-50 border border-red-100 text-red-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    {syncResult.success ? (
                                        <Check size={16} className="flex-shrink-0" />
                                    ) : (
                                        <X size={16} className="flex-shrink-0" />
                                    )}
                                    <p className="text-sm font-medium">{syncResult.message}</p>
                                </div>
                                {syncResult.details && (
                                    <p className="text-xs pl-6">
                                        {syncResult.details}
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <button
                    onClick={handleSignIn}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-700 rounded-xl hover:shadow-md hover:bg-gray-50 border border-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <img
                        src="https://www.gstatic.com/images/branding/product/1x/calendar_48dp.png"
                        alt="Google Calendar"
                        className="h-5 w-5"
                    />
                    <span className="font-medium">{isLoading ? 'Carregando...' : 'Conectar com Google Agenda'}</span>
                </button>
            )}

            {syncResult && !syncResult.success && (
                <p className="text-xs text-gray-500 mt-1">
                    Se o problema persistir, tente desconectar e conectar novamente à sua conta Google.
                </p>
            )}
        </div>
    );
}