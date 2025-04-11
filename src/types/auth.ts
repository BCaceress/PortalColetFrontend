export interface User {
    id: number;
    nome: string;
    email: string;
    funcao: string;
}

export interface AuthResponse {
    access_token: string;
    usuario: User;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
}

export interface SignInCredentials {
    email: string;
    senha: string;  // Alterado de password para senha
}