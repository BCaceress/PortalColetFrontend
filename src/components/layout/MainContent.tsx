'use client';

import { useAuth } from '@/hooks/useAuth';
import { BarChart2, Bell, BookOpen, Briefcase, Calendar, CheckCircle, Clock, Users } from 'lucide-react';

export default function MainContent() {
  const { user } = useAuth();

  // Obter data e hora atuais
  const now = new Date();
  const formattedDate = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <main className="flex-1 pl-1 pr-4 py-2 md:pl-1 md:pr-4 md:py-6 bg-gray-50 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight capitalize">
              Bem-vindo, {user?.nome?.split(' ')[0] || 'Usuário'}!
            </h1>
            <p className="text-gray-500 mt-1">{formattedDate}</p>
          </div>

          <div className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm">
            <Clock size={18} className="text-gray-500" />
            <span className="text-gray-700 font-medium">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Cartões de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Projetos Ativos</h3>
              <p className="text-3xl font-bold text-gray-800">12</p>
              <p className="text-xs text-green-600 mt-2 font-medium">+2.5% desde o último mês</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Tarefas Pendentes</h3>
              <p className="text-3xl font-bold text-gray-800">24</p>
              <p className="text-xs text-red-600 mt-2 font-medium">+4% desde ontem</p>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg">
              <CheckCircle size={24} className="text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Clientes</h3>
              <p className="text-3xl font-bold text-gray-800">8</p>
              <p className="text-xs text-green-600 mt-2 font-medium">+12.5% desde o último mês</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Users size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Notificações</h3>
              <p className="text-3xl font-bold text-gray-800">5</p>
              <p className="text-xs text-gray-600 mt-2 font-medium">3 novas hoje</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <Bell size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico simplificado */}
        <div className="bg-white rounded-xl shadow-md lg:col-span-2">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart2 size={20} className="text-[#09A08D]" />
              Desempenho Semanal
            </h2>
            <div>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#09A08D]">
                <option>Esta Semana</option>
                <option>Semana Passada</option>
                <option>Este Mês</option>
              </select>
            </div>
          </div>
          <div className="p-5 h-64 flex items-center justify-center">
            {/* Aqui você pode integrar um gráfico real, por enquanto vamos simular */}
            <div className="w-full h-full flex items-end justify-around gap-2 px-4">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, i) => (
                <div key={day} className="flex flex-col items-center w-full">
                  <div
                    className={`w-full ${[65, 80, 45, 90, 60, 30, 70][i]}% bg-gradient-to-t from-[#09A08D] to-teal-400 rounded-t-lg`}
                    style={{ height: `${[65, 80, 45, 90, 60, 30, 70][i]}%` }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Atividades Recentes */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={20} className="text-[#09A08D]" />
              Atividades Recentes
            </h2>
          </div>
          <div className="p-5">
            <ul className="space-y-4">
              {[
                { title: 'Novo cliente cadastrado', time: 'Há 3 horas', type: 'cliente', icon: <Users size={16} className="text-blue-600" /> },
                { title: 'Projeto atualizado', time: 'Há 5 horas', type: 'projeto', icon: <Briefcase size={16} className="text-amber-600" /> },
                { title: 'Tarefa concluída', time: 'Há 8 horas', type: 'tarefa', icon: <CheckCircle size={16} className="text-green-600" /> },
                { title: 'Reunião agendada', time: 'Há 1 dia', type: 'agenda', icon: <Calendar size={16} className="text-purple-600" /> },
              ].map((activity, index) => (
                <li key={index} className="flex items-start gap-3 pb-4 last:pb-0 border-b last:border-0 border-gray-100">
                  <div className="rounded-full bg-gray-100 p-2 flex-shrink-0">
                    {activity.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Próximos Eventos */}
      <div className="mt-8 bg-white rounded-xl shadow-md">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar size={20} className="text-[#09A08D]" />
            Próximos Eventos
          </h2>
          <button className="text-sm text-[#09A08D] hover:underline font-medium">
            Ver todos
          </button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Reunião com Cliente',
                date: 'Hoje, 14:00',
                type: 'reuniao',
                description: 'Discussão sobre o novo projeto de implementação.',
                location: 'Sala de reuniões - 2º andar',
                icon: <Users size={18} className="text-blue-600" />
              },
              {
                title: 'Entrega do Projeto X',
                date: 'Amanhã, 12:00',
                type: 'projeto',
                description: 'Prazo final para a entrega do projeto X.',
                location: 'Online - Microsoft Teams',
                icon: <Briefcase size={18} className="text-amber-600" />
              },
              {
                title: 'Treinamento da Equipe',
                date: '15/04/2025, 09:00',
                type: 'treinamento',
                description: 'Treinamento sobre as novas ferramentas.',
                location: 'Auditório principal',
                icon: <BookOpen size={18} className="text-purple-600" />
              },
            ].map((event, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow hover:bg-gray-100/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-full bg-white p-2 shadow-sm">
                    {event.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{event.title}</h3>
                    <p className="text-xs text-gray-500">{event.date}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">{event.description}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{event.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}