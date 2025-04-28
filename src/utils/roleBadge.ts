/**
 * Utilitário para gerenciar cores e estilos de badges de função de usuário
 * Este arquivo centraliza as configurações de estilo para badges de função
 */

/**
 * Obtém a classe CSS para o badge de função baseado no tipo de função
 * @param role A função/cargo do usuário
 * @returns Uma string com as classes CSS para estilizar o badge
 */
export function getRoleBadgeClass(role: string | undefined): string {
    switch (role) {
        case 'Administrador':
            return 'bg-purple-100 text-purple-800 border border-purple-200';
        case 'Analista':
            return 'bg-blue-100 text-blue-800 border border-blue-200';
        case 'Desenvolvedor':
            return 'bg-teal-100 text-teal-800 border border-teal-200';
        case 'Implantador':
            return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        case 'Suporte':
            return 'bg-red-100 text-red-800 border border-red-200';
        default:
            return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
}

/**
 * Mapeamento de funções para suas cores
 */
export const roleBadgeColors = {
    Administrador: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        border: 'border-purple-200',
        hover: 'hover:bg-purple-200',
    },
    Analista: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-200',
    },
    Desenvolvedor: {
        bg: 'bg-teal-100',
        text: 'text-teal-800',
        border: 'border-teal-200',
        hover: 'hover:bg-teal-200',
    },
    Implantador: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        hover: 'hover:bg-yellow-200',
    },
    Suporte: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        hover: 'hover:bg-red-200',
    },
    default: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200',
        hover: 'hover:bg-gray-200',
    },
};