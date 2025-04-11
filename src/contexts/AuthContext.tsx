'use client';

import api from '@/services/api';
import { AuthResponse, AuthState, SignInCredentials, User } from '@/types/auth';
import { useRouter } from 'next/navigation';
import { ReactNode, createContext, useEffect, useState } from 'react';

interface AuthContextData {
    user: User | null;
    isAuthenticated: boolean;
    signIn: (credentials: SignInCredentials) => Promise<void>;
    signOut: () => void;
}

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
    const [authState, setAuthState] = useState<AuthState>({
        token: null,
        user: null,
        isAuthenticated: false,
    });

    const router = useRouter();

    useEffect(() => {
        // Load auth state from localStorage on component mount
        const token = localStorage.getItem('@ColetPortal:token');
        const user = localStorage.getItem('@ColetPortal:user');

        if (token && user) {
            api.defaults.headers.Authorization = `Bearer ${token}`;

            setAuthState({
                token,
                user: JSON.parse(user),
                isAuthenticated: true,
            });
        }
    }, []);

    async function signIn({ email, senha }: SignInCredentials) {
        try {
            const response = await api.post<AuthResponse>('/auth/login', {
                email,
                senha,
            });

            const { access_token, usuario } = response.data;

            localStorage.setItem('@ColetPortal:token', access_token);
            localStorage.setItem('@ColetPortal:user', JSON.stringify(usuario));

            api.defaults.headers.Authorization = `Bearer ${access_token}`;

            setAuthState({
                token: access_token,
                user: usuario,
                isAuthenticated: true,
            });

            // Redirect to dashboard or home page after login
            router.push('/dashboard');
        } catch (error) {
            console.error('Authentication error:', error);
            throw error;
        }
    }

    function signOut() {
        localStorage.removeItem('@ColetPortal:token');
        localStorage.removeItem('@ColetPortal:user');

        setAuthState({
            token: null,
            user: null,
            isAuthenticated: false,
        });

        router.push('/');
    }

    return (
        <AuthContext.Provider
            value={{
                user: authState.user,
                isAuthenticated: authState.isAuthenticated,
                signIn,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}