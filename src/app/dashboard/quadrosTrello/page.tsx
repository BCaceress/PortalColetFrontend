"use client";

import { TrelloList } from '@/components/ui/TrelloList';
import {
    getBoardLists,
    getBoards,
    getListCards,
    TrelloBoard,
    TrelloCard as TrelloCardType,
    TrelloList as TrelloListType
} from '@/services/trelloApi';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function QuadrosTrelloPage() {
    const [boards, setBoards] = useState<TrelloBoard[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<TrelloBoard | null>(null);
    const [lists, setLists] = useState<TrelloListType[]>([]);
    const [cardsByList, setCardsByList] = useState<Record<string, TrelloCardType[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConfigured, setIsConfigured] = useState(true);
    const [refreshTimestamp, setRefreshTimestamp] = useState<string>(new Date().toLocaleString());

    // Verificar se as credenciais do Trello estão configuradas
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY;
        const token = process.env.NEXT_PUBLIC_TRELLO_TOKEN;

        if (!apiKey || !token) {
            setIsConfigured(false);
            setError('Credenciais da API do Trello não configuradas. Configure as variáveis de ambiente NEXT_PUBLIC_TRELLO_API_KEY e NEXT_PUBLIC_TRELLO_TOKEN.');
        }
    }, []);

    // Carregar quadros
    useEffect(() => {
        if (!isConfigured) return;

        const fetchBoards = async () => {
            setLoading(true);
            try {
                const boardsData = await getBoards();
                setBoards(boardsData);

                // Seleciona o primeiro quadro por padrão se houver quadros
                if (boardsData.length > 0) {
                    setSelectedBoard(boardsData[0]);
                }
            } catch (err) {
                console.error('Erro ao carregar quadros:', err);
                setError('Não foi possível carregar os quadros. Verifique suas credenciais do Trello.');
            } finally {
                setLoading(false);
            }
        };

        fetchBoards();
    }, [isConfigured]);

    // Carregar listas do quadro selecionado
    useEffect(() => {
        if (!selectedBoard) return;

        const fetchLists = async () => {
            setLoading(true);
            try {
                const listsData = await getBoardLists(selectedBoard.id);
                setLists(listsData);

                // Inicializa o objeto de cartões por lista
                const newCardsByList: Record<string, TrelloCardType[]> = {};
                await Promise.all(
                    listsData.map(async (list) => {
                        const cards = await getListCards(list.id);
                        newCardsByList[list.id] = cards;
                    })
                );

                setCardsByList(newCardsByList);
                setRefreshTimestamp(new Date().toLocaleString());
            } catch (err) {
                console.error('Erro ao carregar listas:', err);
                setError('Não foi possível carregar as listas deste quadro.');
            } finally {
                setLoading(false);
            }
        };

        fetchLists();
    }, [selectedBoard]);

    // Função para mudar o quadro selecionado
    const handleBoardSelect = (boardId: string) => {
        const board = boards.find(b => b.id === boardId);
        if (board) {
            setLists([]);
            setCardsByList({});
            setSelectedBoard(board);
        }
    };

    // Função para atualizar manualmente os dados
    const handleRefresh = () => {
        if (selectedBoard) {
            setLoading(true);
            setLists([]);
            setCardsByList({});

            const fetchLists = async () => {
                try {
                    const listsData = await getBoardLists(selectedBoard.id);
                    setLists(listsData);

                    // Inicializa o objeto de cartões por lista
                    const newCardsByList: Record<string, TrelloCardType[]> = {};
                    await Promise.all(
                        listsData.map(async (list) => {
                            const cards = await getListCards(list.id);
                            newCardsByList[list.id] = cards;
                        })
                    );

                    setCardsByList(newCardsByList);
                    setRefreshTimestamp(new Date().toLocaleString());
                } catch (err) {
                    console.error('Erro ao carregar listas:', err);
                    setError('Não foi possível carregar as listas deste quadro.');
                } finally {
                    setLoading(false);
                }
            };

            fetchLists();
        }
    };

    // Componente de mensagem de configuração
    const ConfigurationMessage = () => (
        <div className="w-full bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-8 text-center mt-6 shadow-sm">
            <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Configuração necessária</h3>
                <p className="text-gray-600 mb-6 max-w-lg">
                    Para acessar os quadros do Trello, você precisa configurar as variáveis de ambiente com suas credenciais da API:
                </p>
                <div className="bg-gray-800 text-white p-4 rounded-lg text-sm font-mono text-left mb-6 shadow-inner max-w-lg mx-auto">
                    <p>NEXT_PUBLIC_TRELLO_API_KEY=sua_api_key</p>
                    <p>NEXT_PUBLIC_TRELLO_TOKEN=seu_token</p>
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                    <Link
                        href="https://trello.com/app-key"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path>
                            <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon>
                        </svg>
                        Obter API Key
                    </Link>
                    <Link
                        href="https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=Portal%20Colet&key=YOUR_API_KEY_HERE"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        Gerar Token
                    </Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col p-4">

            {!isConfigured ? (
                <ConfigurationMessage />
            ) : error ? (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-8 text-center mt-3 shadow-sm"
                >
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">Erro ao carregar dados</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 2v6h-6"></path>
                            <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                            <path d="M3 12a9 9 0 0 0 6 8.5l2-5.5"></path>
                        </svg>
                        Tentar novamente
                    </button>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 gap-4 ">
                    {/* Visualizador do quadro com seletor dropdown */}
                    {boards.length > 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                        >
                            <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-center">
                                        <div className="p-2 rounded-md bg-indigo-100 text-indigo-600 mr-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                                                <rect width="3" height="9" x="7" y="7"></rect>
                                                <rect width="3" height="5" x="14" y="7"></rect>
                                            </svg>
                                        </div>
                                        <h2 className="text-xl font-semibold text-gray-800">Quadro</h2>
                                    </div>
                                    <div className="flex flex-1 sm:max-w-md gap-3 items-center">
                                        <div className="flex-1">
                                            <select
                                                value={selectedBoard?.id || ''}
                                                onChange={(e) => handleBoardSelect(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                                                disabled={loading}
                                            >
                                                {loading && !selectedBoard ? (
                                                    <option value="">Carregando...</option>
                                                ) : (
                                                    boards.map(board => (
                                                        <option key={board.id} value={board.id}>
                                                            {board.name}
                                                            {board.prefs.starred ? ' ★' : ''}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                        {selectedBoard && (
                                            <a
                                                href={selectedBoard.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                    <polyline points="15 3 21 3 21 9"></polyline>
                                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                                </svg>
                                                Abrir no Trello
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {selectedBoard && (
                                    <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                            </svg>
                                            {lists.length} listas
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                            </svg>
                                            {Object.values(cardsByList).reduce((sum, cards) => sum + cards.length, 0)} cartões
                                        </span>
                                        <span className="flex items-center gap-1 ml-auto text-xs font-medium text-gray-400">
                                            Atualizado em: {refreshTimestamp}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div
                                className="h-[calc(100vh-300px)] min-h-[600px] overflow-x-auto p-5 bg-gradient-to-br from-gray-50 to-white"
                                style={{
                                    backgroundImage: selectedBoard?.prefs.backgroundImage
                                        ? `url(${selectedBoard.prefs.backgroundImage})`
                                        : undefined,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="flex flex-col items-center bg-white bg-opacity-90 p-8 rounded-lg shadow-sm">
                                            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                                                <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            </div>
                                            <p className="text-gray-600">Carregando listas e cartões...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-5 h-full">
                                        {lists.length > 0 ? (
                                            lists.map((list) => (
                                                <TrelloList key={list.id} list={list} cards={cardsByList[list.id] || []} />
                                            ))
                                        ) : (
                                            <div className="w-full flex items-center justify-center">
                                                <div className="text-center p-8 bg-white bg-opacity-90 rounded-xl shadow-sm">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-gray-600">Este quadro não possui listas ou cartões.</p>
                                                    <p className="text-gray-500 text-sm mt-2">Acesse o Trello para adicionar conteúdo.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center bg-white rounded-xl p-8 shadow-sm">
                                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                                    <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                                <p className="text-gray-600">Carregando quadros do Trello...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center bg-white p-8 rounded-xl shadow-sm">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                </div>
                                <p className="text-gray-600">Nenhum quadro do Trello encontrado</p>
                                <p className="text-gray-500 text-sm mt-2">Verifique suas permissões ou crie um novo quadro no Trello</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}