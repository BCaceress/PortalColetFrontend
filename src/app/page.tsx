'use client';

import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { FormEvent, useState } from "react";

export default function Home() {
  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* Painel Esquerdo - Informativo com design moderno, gradientes e elementos visuais */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#09A08D] to-[#078275] text-white flex-col justify-center px-8 py-6 relative overflow-hidden">
        {/* Elementos decorativos para design moderno */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-white/5 translate-y-1/3 -translate-x-1/3"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-[25%] left-[15%] w-16 h-16 rounded-full bg-white/10"></div>
          <div className="absolute bottom-[15%] right-[20%] w-24 h-24 rounded-full bg-white/5"></div>
        </div>

        <div className="relative z-10 max-w-md mx-auto">
          <Image
            src="/images/logo-colet.png"
            alt="Colet Sistemas Logo"
            width={180}
            height={40}
            className="mb-8"
            priority
          />

          <h1 className="text-3xl font-bold mb-4 tracking-tight">Portal Interno</h1>
          <p className="text-lg mb-8 text-white/90 leading-relaxed">
            Plataforma integrada para gestão completa das atividades da Colet Sistemas.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm rounded-xl transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-3 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h2 className="font-semibold text-lg mb-1">Suporte</h2>
              <p className="text-sm text-white/80">Gestão completa de tickets para helpdesk</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm rounded-xl transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-3 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <h2 className="font-semibold text-lg mb-1">Dev</h2>
              <p className="text-sm text-white/80">Acompanhamento de demandas técnicas</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm rounded-xl transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-3 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h2 className="font-semibold text-lg mb-1">RAT</h2>
              <p className="text-sm text-white/80">Registros de atendimento técnico</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm rounded-xl transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mb-3 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h2 className="font-semibold text-lg mb-1">Analistas</h2>
              <p className="text-sm text-white/80">Fluxo e análise de demandas</p>
            </div>
          </div>

          <div className="mt-10 text-sm text-white/70 border-t border-white/10 pt-5">
            <p>© {new Date().getFullYear()} Colet Sistemas • Todos os direitos reservados</p>
          </div>
        </div>
      </div>

      {/* Painel Direito - Formulário de Login com design modernizado */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-4 sm:p-5 md:p-0">
        <div className="w-full max-w-md p-6 sm:p-8 md:p-10">
          <div className="md:hidden mb-8 flex justify-center">
            <Image
              src="/images/logo-colet.png"
              alt="Colet Sistemas Logo"
              width={160}
              height={35}
              priority
            />
          </div>

          <h2 className="text-[#3A3A3A] text-2xl sm:text-3xl font-bold mb-2">Bem-vindo(a) de volta</h2>
          <p className="text-gray-500 mb-8">Acesse sua conta para continuar</p>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}

// Componente de formulário de login com design aprimorado
function LoginForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      setError('Email ou senha incorretos. Por favor, verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md animate-in slide-in-from-right duration-300">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#3A3A3A] mb-2">
            Endereço de email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-[#3A3A3A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#09A08D] focus:border-transparent transition-all duration-200"
              placeholder="seu.email@colet.com.br"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#3A3A3A] mb-2">
            Senha
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 text-[#3A3A3A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#09A08D] focus:border-transparent transition-all duration-200"
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-[#09A08D] focus:ring-[#09A08D] transition-colors"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
            Lembrar-me neste dispositivo
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#09A08D] to-[#078275] text-white py-3 rounded-lg font-medium hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#09A08D] disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Entrando...
            </span>
          ) : (
            'Entrar'
          )}
        </button>
      </form>
    </>
  );
}
