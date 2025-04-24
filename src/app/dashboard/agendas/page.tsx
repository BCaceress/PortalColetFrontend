"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { motion } from "framer-motion";
import { useState } from "react";

// List of available calendars (can be expanded later)
const calendars = [
    {
        id: "brunocaceres8",
        name: "Bruno Caceres",
        url: "https://calendar.google.com/calendar/embed?src=brunocaceres8%40gmail.com&ctz=America%2FSao_Paulo&mode=WEEK",
        color: "#4285F4", // Google blue
        role: "Desenvolvedor",
        description: "Calendário de planejamento e coordenação de desenvolvimento"
    },
    {
        id: "dannbrazil",
        name: "Dann Brazil",
        url: "https://calendar.google.com/calendar/embed?src=dannbrazil%40gmail.com&ctz=America%2FSao_Paulo&mode=WEEK",
        color: "#0F9D58", // Google green
        role: "Analista",
        description: "Calendário de desenvolvimento e implementação de features"
    },
    {
        id: "regioduarte",
        name: "Regio Duarte",
        url: "https://calendar.google.com/calendar/embed?src=regio.duarte%40gmail.com&ctz=America%2FSao_Paulo&mode=WEEK",
        color: "#DB4437", // Google red
        role: "Gerente de Projetos",
        description: "Calendário de gerenciamento e coordenação de projetos"
    }
];

export default function DesenvolvimentosPage() {
    const [selectedCalendarId, setSelectedCalendarId] = useState(calendars[0].id);

    const selectedCalendar = calendars.find(calendar => calendar.id === selectedCalendarId) || calendars[0];

    const handleCreateTask = () => {
        // URL para criação de um novo evento no Google Calendar do usuário selecionado
        const calendarEmail = selectedCalendar.url.split('src=')[1].split('&')[0];
        const decodedEmail = decodeURIComponent(calendarEmail);

        // Formato da URL para criar evento no Google Calendar
        const createEventUrl = `https://calendar.google.com/calendar/r/eventedit?text=Nova+Tarefa&details=Detalhes+da+tarefa&add=${decodedEmail}`;

        // Abre em uma nova aba
        window.open(createEventUrl, '_blank');
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 px-2 py-2 sm:px-3">
            {/* Cabeçalho mais compacto e com visual melhorado */}
            <div className="mb-3">
                <PageHeader
                    title="Desenvolvimentos"
                    description="Visualize e gerencie agendas de desenvolvimento"
                />
            </div>

            <div className="flex flex-col mb-3">
                <h3 className="text-base font-medium text-gray-700 mb-2 ml-1">Calendários disponíveis</h3>

                {/* Cards sempre em grid, mais compactos e em tela cheia */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {calendars.map((calendar) => (
                        <motion.div
                            key={calendar.id}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            <button
                                className={`w-full h-full text-left p-3 rounded-lg transition-all duration-150 ${selectedCalendarId === calendar.id
                                    ? "bg-white ring-2 ring-blue-400 shadow-sm"
                                    : "bg-white hover:bg-blue-50 border border-gray-100"
                                    }`}
                                onClick={() => setSelectedCalendarId(calendar.id)}
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm mb-2"
                                        style={{ backgroundColor: calendar.color }}
                                    >
                                        {calendar.name.substring(0, 1)}
                                    </div>
                                    <div className="w-full">
                                        <div className="font-medium text-gray-900 text-sm truncate">{calendar.name}</div>
                                        <div className="text-xs text-gray-500 truncate">{calendar.role}</div>
                                    </div>
                                </div>
                                {selectedCalendarId === calendar.id && (
                                    <div className="mt-2 text-xs text-blue-600 font-medium text-center">
                                        • Selecionado
                                    </div>
                                )}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Container do calendário com padding reduzido */}
            <div className="flex-grow bg-white rounded-md shadow-sm overflow-hidden border border-gray-200">
                {/* Cabeçalho do calendário mais simples e elegante */}
                <div className="border-b border-gray-200 bg-white py-2 px-3 flex justify-between items-center">
                    <div className="flex items-center">
                        <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm mr-2"
                            style={{ backgroundColor: selectedCalendar.color }}
                        >
                            {selectedCalendar.name.substring(0, 1)}
                        </div>
                        <h4 className="font-medium text-sm text-gray-900">{selectedCalendar.name}</h4>
                    </div>
                    <a
                        href={selectedCalendar.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                        <span>Ver no Google</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </div>

                {/* Iframe mais alto para ocupar toda a tela disponível */}
                <motion.div
                    key={selectedCalendarId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-[calc(100vh-200px)]"
                >
                    <iframe
                        src={selectedCalendar.url}
                        style={{ border: 0 }}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        title={`Agenda de ${selectedCalendar.name}`}
                        className="bg-white"
                    ></iframe>
                </motion.div>
            </div>

            {/* Botão de criação de tarefas estilo Google Agenda */}
            <div className="group relative">
                <motion.button
                    className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-10"
                    onClick={handleCreateTask}
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)" }}
                    whileTap={{ scale: 0.95 }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </motion.button>

                {/* Tooltip explicativo */}
                <div className="fixed bottom-[68px] right-4 bg-gray-900 text-white text-xs rounded-md py-1 px-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md whitespace-nowrap">
                    Criar tarefa
                </div>
            </div>
        </div>
    );
}