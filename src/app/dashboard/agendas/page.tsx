"use client";

import { motion } from "framer-motion";
import { ChangeEvent, useEffect, useState } from "react";

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
    const [iframeKey, setIframeKey] = useState(0); // Changed from Date.now() to avoid hydration mismatch
    const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null); // Initialize as null to avoid hydration mismatch

    // Set the initial update time after component mounts on client side
    useEffect(() => {
        setLastUpdateTime(new Date());
        setIframeKey(Date.now()); // Set initial key after component mounts
    }, []);

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

    // Function to refresh the calendar iframe
    const handleRefresh = () => {
        setIframeKey(Date.now()); // Update the key to force a re-render of the iframe
        setLastUpdateTime(new Date()); // Atualiza o horário de atualização
    };

    // Handler for select change
    const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setSelectedCalendarId(e.target.value);
        setLastUpdateTime(new Date()); // Atualiza o horário quando o calendário é alterado
    };

    // Formatar a data e hora para exibição - check if date is null first
    const formatDateTime = (date: Date | null) => {
        if (!date) return "..."; // Return placeholder if date isn't set yet

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 px-2 py-2 sm:px-3">
            {/* Container do calendário com padding reduzido */}
            <div className="flex-grow bg-white rounded-md shadow-sm overflow-hidden border border-gray-200">
                {/* Cabeçalho do calendário redesenhado - mais alto e profissional */}
                <div className="border-b border-gray-200 bg-white py-4 px-4 flex justify-between items-center shadow-sm">
                    <div className="flex items-center">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm mr-3"
                            style={{ backgroundColor: selectedCalendar.color }}
                        >
                            {selectedCalendar.name.substring(0, 1)}
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">{selectedCalendar.name}</h4>
                            <div className="flex items-center">
                                <p className="text-xs text-gray-500 mr-2">{selectedCalendar.role || "Calendário"}</p>
                                <span className="text-xs text-gray-400">• Atualizado em: {formatDateTime(lastUpdateTime)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Área de ações */}
                        <div className="flex items-center gap-3">
                            {/* Botão de criar tarefas (movido do rodapé) */}
                            <button
                                onClick={handleCreateTask}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-md flex items-center transition-colors duration-200 shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span>Criar Tarefa</span>
                            </button>

                            {/* Select para escolher calendários */}
                            <div className="flex items-center border-l border-gray-200 pl-3">
                                <label htmlFor="calendar-select" className="text-xs text-gray-500 mr-2">Calendário:</label>
                                <select
                                    id="calendar-select"
                                    className="text-sm border border-gray-300 rounded py-1.5 pl-3 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    value={selectedCalendarId}
                                    onChange={handleSelectChange}
                                    aria-label="Selecionar calendário"
                                >
                                    {calendars.map((cal) => (
                                        <option key={cal.id} value={cal.id}>
                                            {cal.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleRefresh}
                                className="text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center py-1.5 px-2.5 rounded-md hover:bg-gray-50 transition-colors duration-200"
                                title="Atualizar agenda"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Atualizar</span>
                            </button>

                            <a
                                href={selectedCalendar.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center py-1.5 px-2.5 rounded-md hover:bg-gray-50 transition-colors duration-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                <span>Ver no Google</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Iframe with client-side rendering */}
                {lastUpdateTime && ( // Only render iframe after client-side initialization
                    <motion.div
                        key={selectedCalendarId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-[calc(100vh-140px)]"
                    >
                        <iframe
                            key={iframeKey} // Add key prop to force re-render when refresh is clicked
                            src={selectedCalendar.url}
                            style={{ border: 0 }}
                            width="100%"
                            height="600"
                            frameBorder="0"
                            scrolling="no"
                            title={`Agenda de ${selectedCalendar.name}`}
                            className="bg-white"
                        ></iframe>
                    </motion.div>
                )}
            </div>
        </div>
    );
}