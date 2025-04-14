'use client';

import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { FormEvent, useState } from "react";

export default function Home() {
  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* Painel Esquerdo - Informativo com design moderno e elegante */}
      <div className="hidden md:flex md:w-1/2 bg-[#09A08D] text-white flex-col justify-center px-8 py-6 relative overflow-hidden">
        {/* Elementos decorativos para design moderno */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative z-10 max-w-md mx-auto">
          <Image
            src="/images/logo-colet.png"
            alt="Colet Sistemas Logo"
            width={160}
            height={35}
            className="mb-6"
            priority
          />

          <h1 className="text-2xl font-bold mb-3">Portal Interno</h1>
          <p className="text-base mb-6 text-white/90">
            Plataforma integrada para gerenciamento de atividades da Colet Sistemas.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h2 className="font-semibold text-lg mb-0.5">Suporte</h2>
              <p className="text-xs text-white/80">Gestão de tickets para helpdesk</p>
            </div>

            <div className="p-3 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <h2 className="font-semibold text-lg mb-0.5">Dev</h2>
              <p className="text-xs text-white/80">Acompanhamento de demandas</p>
            </div>

            <div className="p-3 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h2 className="font-semibold text-lg mb-0.5">RAT</h2>
              <p className="text-xs text-white/80">Registros de atendimento</p>
            </div>

            <div className="p-3 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h2 className="font-semibold text-lg mb-0.5">Analistas</h2>
              <p className="text-xs text-white/80">Fluxo de demandas</p>
            </div>
          </div>

          <div className="mt-6 text-xs text-white/70">
            <p>© {new Date().getFullYear()} Colet Sistemas</p>
          </div>
        </div>
      </div>

      {/* Painel Direito - Formulário de Login */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center">
        <div className="w-full max-w-md p-8">
          <div className="md:hidden mb-8">
            <Image
              src="/images/logo-colet.png"
              alt="Colet Sistemas Logo"
              width={140}
              height={32}
              priority
            />
          </div>

          <h2 className="text-black text-2xl font-bold mb-2">Bem-vindo(a)</h2>
          <p className="text-[#3A3A3A] mb-8">Acesse sua conta para continuar</p>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}

// Componente de formulário de login integrado na mesma página
function LoginForm() {
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
