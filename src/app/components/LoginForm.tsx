'use client';

import { useAuth } from "@/hooks/useAuth";
import { FormEvent, useState } from "react";

export function LoginForm() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await signIn({
                email,
                senha: password
            });
        } catch (err) {
            setError('Email ou senha incorretos. Verifique suas credenciais.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-black placeholder-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#09A08D] focus:border-transparent"
                        placeholder="seu.email@colet.com.br"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                        Senha
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-black placeholder-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#09A08D] focus:border-transparent"
                        placeholder="••••••••"
                    />
                </div>

                <div className="flex items-center">
                    <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-[#09A08D] border-gray-300 rounded focus:ring-[#09A08D]"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-black">
                        Lembrar-me
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#09A08D] text-white py-3 rounded-lg font-medium hover:bg-[#078275] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#09A08D] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
        </>
    );
}