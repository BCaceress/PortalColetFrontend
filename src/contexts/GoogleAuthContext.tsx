'use client';

import googleCalendarService from '@/services/googleCalendar';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Google Calendar API constants
const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
];

// Carregando de variáveis de ambiente
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

interface GoogleAuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    user: any;
    signIn: () => Promise<void>;
    signOut: () => void;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    // Load Google Auth APIs
    useEffect(() => {
        const loadGoogleAuth = async () => {
            try {
                if (!CLIENT_ID) {
                    console.error('Google CLIENT_ID não configurado nas variáveis de ambiente');
                    setError('Configuração do Google Calendar incompleta. Entre em contato com o suporte.');
                    setIsLoading(false);
                    return;
                }

                // Load Google Authentication
                const loadAuth = new Promise<void>((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://accounts.google.com/gsi/client';
                    script.async = true;
                    script.defer = true;
                    script.onload = () => resolve();
                    script.onerror = (e) => reject(e);
                    document.body.appendChild(script);
                });

                await loadAuth;

                // Also initialize the Google API client for calendar operations
                await googleCalendarService.loadGapiClient();

                // Try to check current auth status
                checkExistingAuth();

                setIsLoading(false);
            } catch (e) {
                console.error('Erro ao inicializar cliente da Google API', e);
                setError('Falha ao inicializar API do Google. Por favor, tente novamente mais tarde.');
                setIsLoading(false);
            }
        };

        loadGoogleAuth();
    }, []);

    // Check if user is already authenticated (e.g., from a previous session)
    const checkExistingAuth = () => {
        const token = localStorage.getItem('googleAuthToken');
        if (token) {
            try {
                // Validate token and set auth state
                handleAuthSuccess(token);
            } catch (error) {
                console.error('Erro ao validar token armazenado:', error);
                localStorage.removeItem('googleAuthToken');
            }
        }
    };

    const handleAuthSuccess = (token: string, userInfo?: any) => {
        // Validar token
        if (!token) {
            throw new Error('Token de autenticação inválido');
        }

        // Set the authenticated state
        setIsAuthenticated(true);

        // Store token for persistence
        localStorage.setItem('googleAuthToken', token);

        // Set the token in our service
        googleCalendarService.setAccessToken(token);

        // If we have user info, store it
        if (userInfo) {
            setUser(userInfo);
        } else {
            // Definir informações de usuário mínimas
            setUser({
                name: 'Usuário Google',
                email: 'Carregando...',
                imageUrl: ''
            });

            // Buscar informações do usuário
            fetchUserInfo(token);
        }
    };

    // Função para buscar informações do usuário usando o token
    const fetchUserInfo = async (token: string) => {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar informações do usuário: ${response.status}`);
            }

            const data = await response.json();

            const userInfo = {
                id: data.sub,
                name: data.name,
                email: data.email,
                imageUrl: data.picture
            };

            setUser(userInfo);
        } catch (err) {
            console.error('Erro ao buscar informações do usuário:', err);
        }
    };

    const signIn = async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            if (!CLIENT_ID) {
                setError('Google CLIENT_ID não configurado nas variáveis de ambiente');
                setIsLoading(false);
                return;
            }

            if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
                setError('Biblioteca de autenticação do Google não carregada corretamente');
                setIsLoading(false);
                return;
            }

            // We'll use Google's OAuth 2.0 flow to authorize the user
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES.join(' '),
                callback: (response: any) => {
                    if (response.error) {
                        console.error('Erro de autenticação Google:', response.error);
                        setError(response.error_description || response.error);
                        setIsLoading(false);
                        return;
                    }

                    // Handle successful auth
                    const token = response.access_token;

                    // Get user info
                    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                        .then(res => {
                            if (!res.ok) {
                                throw new Error(`Erro ao buscar informações do usuário: ${res.status}`);
                            }
                            return res.json();
                        })
                        .then(data => {
                            const userInfo = {
                                id: data.sub,
                                name: data.name,
                                email: data.email,
                                imageUrl: data.picture
                            };

                            handleAuthSuccess(token, userInfo);
                            setIsLoading(false);
                        })
                        .catch(err => {
                            console.error('Erro ao buscar informações do usuário', err);
                            // Still authenticate even if we can't get user info
                            handleAuthSuccess(token);
                            setIsLoading(false);
                        });
                }
            });

            tokenClient.requestAccessToken();

        } catch (e) {
            console.error('Erro ao autenticar com Google', e);
            setError('Falha ao autenticar com o Google. Por favor, tente novamente.');
            setIsLoading(false);
        }
    };

    const signOut = (): void => {
        try {
            setIsLoading(true);

            // Clear local token
            localStorage.removeItem('googleAuthToken');

            // Reset auth state
            setIsAuthenticated(false);
            setUser(null);

            // Google's client might have revoke functionality too
            if (window.google?.accounts?.oauth2 && isAuthenticated) {
                const token = localStorage.getItem('googleAuthToken');
                if (token) {
                    window.google.accounts.oauth2.revoke(token, () => {
                        console.log('Token revogado');
                    });
                }
            }

            setIsLoading(false);
        } catch (e) {
            console.error('Erro ao fazer logout do Google', e);
            setError('Falha ao desconectar. Por favor, tente novamente.');
            setIsLoading(false);
        }
    };

    return (
        <GoogleAuthContext.Provider
            value={{
                isAuthenticated,
                isLoading,
                error,
                user,
                signIn,
                signOut,
            }}
        >
            {children}
        </GoogleAuthContext.Provider>
    );
}

export function useGoogleAuth() {
    const context = useContext(GoogleAuthContext);
    if (context === undefined) {
        throw new Error('useGoogleAuth deve ser usado dentro de um GoogleAuthProvider');
    }
    return context;
}