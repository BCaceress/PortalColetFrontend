"use client";

import { PageHeader } from '@/components/ui/PageHeader';
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

// Lista de quadros públicos disponíveis via iframe
const publicBoards = [
    { id: '5FldI0TK', name: 'Desenvolvimento Principal', url: 'https://trello.com/b/5FldI0TK.html' },
    { id: '271tECAo', name: 'Planejamento de Projetos', url: 'https://trello.com/b/271tECAo.html' },
];

type ViewMode = 'api' | 'iframe';

export default function DesenvolvimentosPage() {
    // Estado para controlar o modo de visualização (API ou iFrame)
    const [viewMode, setViewMode] = useState<ViewMode>('api');
    const [selectedPublicBoard, setSelectedPublicBoard] = useState(publicBoards[0]);

    const [boards, setBoards] = useState<TrelloBoard[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<TrelloBoard | null>(null);
    const [lists, setLists] = useState<TrelloListType[]>([]);
    const [cardsByList, setCardsByList] = useState<Record<string, TrelloCardType[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConfigured, setIsConfigured] = useState(true);

    // Verificar se as credenciais do Trello estão configuradas
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY;
        const token = process.env.NEXT_PUBLIC_TRELLO_TOKEN;

        if (!apiKey || !token) {
            setIsConfigured(false);
            setError('Credenciais da API do Trello não configuradas. Configure as variáveis de ambiente NEXT_PUBLIC_TRELLO_API_KEY e NEXT_PUBLIC_TRELLO_TOKEN.');
            // Mudar para visualização via iframe quando as credenciais não estão configuradas
            setViewMode('iframe');
        }
    }, []);

    // Carregar quadros
    useEffect(() => {
        if (!isConfigured || viewMode === 'iframe') return;

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
    }, [isConfigured, viewMode]);

    // Carregar listas do quadro selecionado
    useEffect(() => {
        if (!selectedBoard || viewMode === 'iframe') return;

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
            } catch (err) {
                console.error('Erro ao carregar listas:', err);
                setError('Não foi possível carregar as listas deste quadro.');
            } finally {
                setLoading(false);
            }
        };

        fetchLists();
    }, [selectedBoard, viewMode]);

    // Função para mudar o quadro selecionado (API)
    const handleBoardSelect = (board: TrelloBoard) => {
        setLists([]);
        setCardsByList({});
        setSelectedBoard(board);
    };

    // Função para mudar o modo de visualização
    const toggleViewMode = (mode: ViewMode) => {
        setViewMode(mode);
        setError(null); // Limpar erros ao trocar o modo

        // Se mudar para modo iframe, limpe os dados da API
        if (mode === 'iframe') {
            setBoards([]);
            setSelectedBoard(null);
            setLists([]);
            setCardsByList({});
        } else if (!isConfigured) {
            // Se tentar mudar para API mas não está configurada, mostrar erro
            setError('Credenciais da API do Trello não configuradas. Configure as variáveis de ambiente ou use o modo de visualização pública.');
        }
    };

    // Componente de mensagem de configuração
    const ConfigurationMessage = () => (
        <div className="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center mt-6">
            <div className="flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Configuração necessária</h3>
                <p className="text-gray-600 mb-4 max-w-lg">
                    Para acessar os quadros privados do Trello, você precisa configurar as variáveis de ambiente com suas credenciais da API do Trello:
                </p>
                <div className="bg-gray-800 text-white p-3 rounded-md text-sm font-mono text-left mb-4">
                    <p>NEXT_PUBLIC_TRELLO_API_KEY=sua_api_key</p>
                    <p>NEXT_PUBLIC_TRELLO_TOKEN=seu_token</p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                    <Link
                        href="https://trello.com/app-key"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                        Obter API Key
                    </Link>
                    <Link
                        href="https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=Portal%20Colet&key=YOUR_API_KEY_HERE"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                        Gerar Token
                    </Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col">
            <PageHeader
                title="Desenvolvimentos"
                description="Visualização e acompanhamento dos quadros de desenvolvimento"
                actionButton={
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Última atualização: {new Date().toLocaleString()}</span>
                        {viewMode === 'api' ? (
                            <button
                                onClick={() => {
                                    if (selectedBoard) {
                                        setLoading(true);
                                        handleBoardSelect(selectedBoard);
                                    }
                                }}
                                disabled={loading || !selectedBoard}
                                className={`px-3 py-1.5 border rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${loading
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Atualizando...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 2v6h-6"></path>
                                            <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                                            <path d="M3 12a9 9 0 0 0 6 8.5l2-5.5"></path>
                                        </svg>
                                        Atualizar
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={() => window.location.reload()}
                                className="px-3 py-1.5 bg-white text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50 transition-colors text-sm font-medium flex items-center gap-1.5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 2v6h-6"></path>
                                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                                    <path d="M3 12a9 9 0 0 0 6 8.5l2-5.5"></path>
                                </svg>
                                Atualizar
                            </button>
                        )}
                    </div>
                }
            />

            {/* Seletor de modo de visualização */}
            <div className="flex justify-center mt-6 mb-2">
                <div className="inline-flex rounded-md shadow-sm bg-gray-100 p-1">
                    <button
                        onClick={() => toggleViewMode('api')}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${viewMode === 'api'
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M7 10v4h10v-4" />
                                <path d="M7 2h10" />
                                <path d="M17 22H7" />
                                <path d="M17 6H7" />
                                <path d="M17 18H7" />
                                <circle cx="17" cy="14" r="3" />
                                <circle cx="7" cy="14" r="3" />
                            </svg>
                            Quadros Privados (API)
                        </div>
                    </button>
                    <button
                        onClick={() => toggleViewMode('iframe')}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${viewMode === 'iframe'
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="3" rx="2" />
                                <path d="M9 3v18" />
                                <path d="M14 15l3-3-3-3" />
                            </svg>
                            Quadros Públicos (Embed)
                        </div>
                    </button>
                </div>
            </div>

            {/* Modo de API do Trello */}
            {viewMode === 'api' ? (
                <>
                    {!isConfigured ? (
                        <ConfigurationMessage />
                    ) : error ? (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full bg-red-50 border border-red-200 rounded-xl p-6 text-center mt-6"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Erro ao carregar dados</h3>
                            <p className="text-gray-600">{error}</p>
                            <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                                >
                                    Tentar novamente
                                </button>
                                <button
                                    onClick={() => toggleViewMode('iframe')}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
                                >
                                    Alternar para quadros públicos
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 mt-2">
                            {/* Seletor de quadros */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="w-full bg-white rounded-xl shadow-sm p-5 border border-gray-100"
                            >
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Escolha um quadro para visualizar</h2>

                                {loading && boards.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="flex flex-col items-center">
                                            <svg className="animate-spin h-8 w-8 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <p className="text-gray-500">Carregando quadros do Trello...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {boards.map((board) => (
                                            <div
                                                key={board.id}
                                                onClick={() => handleBoardSelect(board)}
                                                className={`cursor-pointer rounded-lg p-4 border-2 transition-all duration-200 ${selectedBoard?.id === board.id
                                                        ? 'border-indigo-500 bg-indigo-50'
                                                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="p-2 rounded-md"
                                                        style={{
                                                            backgroundColor: board.prefs.backgroundColor
                                                                ? `#${board.prefs.backgroundColor}`
                                                                : 'rgba(79, 70, 229, 0.1)',
                                                            color: board.prefs.backgroundColor
                                                                ? '#fff'
                                                                : 'rgb(79, 70, 229)',
                                                        }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                                                            <rect width="3" height="9" x="7" y="7"></rect>
                                                            <rect width="3" height="5" x="14" y="7"></rect>
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-gray-800">{board.name}</h3>
                                                        <p className="text-xs text-gray-500 truncate max-w-[200px]" title={board.desc || ''}>
                                                            {board.desc || 'Sem descrição'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            {/* Visualizador do quadro */}
                            {selectedBoard && (
                                <motion.div
                                    key={selectedBoard.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.4 }}
                                    className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                                >
                                    <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-800">{selectedBoard.name}</h2>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {lists.length} listas • {Object.values(cardsByList).reduce((sum, cards) => sum + cards.length, 0)} cartões
                                            </p>
                                        </div>
                                        <a
                                            href={selectedBoard.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                                        >
                                            Abrir no Trello
                                        </a>
                                    </div>

                                    <div
                                        className="h-[calc(100vh-350px)] min-h-[600px] overflow-x-auto p-4 bg-gray-50"
                                        style={{
                                            backgroundImage: selectedBoard.prefs.backgroundImage
                                                ? `url(${selectedBoard.prefs.backgroundImage})`
                                                : undefined,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        }}
                                    >
                                        {loading ? (
                                            <div className="flex items-center justify-center h-full">
                                                <div className="flex flex-col items-center">
                                                    <svg className="animate-spin h-8 w-8 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <p className="text-gray-500">Carregando listas e cartões...</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-4 h-full">
                                                {lists.length > 0 ? (
                                                    lists.map((list) => (
                                                        <TrelloList key={list.id} list={list} cards={cardsByList[list.id] || []} />
                                                    ))
                                                ) : (
                                                    <div className="w-full flex items-center justify-center">
                                                        <div className="text-center p-6 bg-white bg-opacity-80 rounded-lg shadow-sm">
                                                            <p className="text-gray-600">Este quadro não possui listas ou cartões.</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                /* Modo iframe para quadros públicos */
                <div className="grid grid-cols-1 gap-6 mt-2">
                    {/* Seletor de quadros públicos */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full bg-white rounded-xl shadow-sm p-5 border border-gray-100"
                    >
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Escolha um quadro público para visualizar</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {publicBoards.map((board) => (
                                <div
                                    key={board.id}
                                    onClick={() => setSelectedPublicBoard(board)}
                                    className={`cursor-pointer rounded-lg p-4 border-2 transition-all duration-200 ${selectedPublicBoard?.id === board.id
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-md bg-indigo-100 text-indigo-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                                                <rect width="3" height="9" x="7" y="7"></rect>
                                                <rect width="3" height="5" x="14" y="7"></rect>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-800">{board.name}</h3>
                                            <p className="text-xs text-gray-500">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Público</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Visualizador iframe do quadro */}
                    <motion.div
                        key={selectedPublicBoard.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">{selectedPublicBoard.name}</h2>
                                <p className="text-sm text-gray-500 mt-1">Visualizando quadro público do Trello via embed</p>
                            </div>
                            <a
                                href={selectedPublicBoard.url.replace('.html', '')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                            >
                                Abrir no Trello
                            </a>
                        </div>

                        <div className="w-full h-[calc(100vh-350px)] min-h-[600px] bg-gray-50">
                            <iframe
                                src={selectedPublicBoard.url}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                title={`Quadro Trello - ${selectedPublicBoard.name}`}
                                className="w-full h-full"
                                sandbox="allow-same-origin allow-scripts"
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}