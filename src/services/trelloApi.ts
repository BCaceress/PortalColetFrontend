// API do Trello para acesso a quadros privados
// Documentação: https://developer.atlassian.com/cloud/trello/rest/api-group-boards/

interface TrelloBoard {
    id: string;
    name: string;
    desc: string;
    url: string;
    shortUrl: string;
    prefs: {
        backgroundColor: string;
        backgroundImage?: string;
    };
}

interface TrelloList {
    id: string;
    name: string;
    idBoard: string;
    pos: number;
}

interface TrelloCard {
    id: string;
    name: string;
    desc: string;
    idBoard: string;
    idList: string;
    pos: number;
    due: string | null;
    labels: TrelloLabel[];
    members: TrelloMember[];
    cover: {
        color?: string;
        idAttachment?: string;
    };
}

interface TrelloLabel {
    id: string;
    name: string;
    color: string;
}

interface TrelloMember {
    id: string;
    fullName: string;
    username: string;
    avatarUrl: string | null;
}

// Configuração da API do Trello
// Nota: As chaves devem estar em variáveis de ambiente no projeto real
const TRELLO_API_KEY = process.env.NEXT_PUBLIC_TRELLO_API_KEY || '';
const TRELLO_TOKEN = process.env.NEXT_PUBLIC_TRELLO_TOKEN || '';
const API_BASE_URL = 'https://api.trello.com/1';

/**
 * Obtém todos os quadros aos quais o usuário tem acesso
 */
export const getBoards = async (): Promise<TrelloBoard[]> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/members/me/boards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}&fields=name,desc,url,shortUrl,prefs`
        );

        if (!response.ok) {
            throw new Error('Falha ao obter quadros do Trello');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar quadros:', error);
        return [];
    }
};

/**
 * Obtém um quadro específico por ID
 */
export const getBoardById = async (boardId: string): Promise<TrelloBoard | null> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/boards/${boardId}?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}&fields=name,desc,url,shortUrl,prefs`
        );

        if (!response.ok) {
            throw new Error(`Falha ao obter quadro ${boardId}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Erro ao buscar quadro ${boardId}:`, error);
        return null;
    }
};

/**
 * Obtém todas as listas de um quadro
 */
export const getBoardLists = async (boardId: string): Promise<TrelloList[]> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/boards/${boardId}/lists?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`
        );

        if (!response.ok) {
            throw new Error(`Falha ao obter listas do quadro ${boardId}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Erro ao buscar listas do quadro ${boardId}:`, error);
        return [];
    }
};

/**
 * Obtém todos os cartões de uma lista
 */
export const getListCards = async (listId: string): Promise<TrelloCard[]> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/lists/${listId}/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}&members=true&member_fields=fullName,username,avatarHash`
        );

        if (!response.ok) {
            throw new Error(`Falha ao obter cartões da lista ${listId}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Erro ao buscar cartões da lista ${listId}:`, error);
        return [];
    }
};

export type { TrelloBoard, TrelloCard, TrelloLabel, TrelloList, TrelloMember };
