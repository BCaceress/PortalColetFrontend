import { TrelloCard as TrelloCardType, TrelloMember } from '@/services/trelloApi';

interface TrelloCardProps {
    card: TrelloCardType;
}

export function TrelloCard({ card }: TrelloCardProps) {
    // Função para exibir as iniciais de um membro quando não há avatar
    const getInitials = (fullName: string) => {
        return fullName
            .split(' ')
            .map(name => name.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Formatar a data de vencimento
    const formatDueDate = (dueDate: string | null) => {
        if (!dueDate) return null;

        const date = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const isToday = date.toDateString() === today.toDateString();
        const isTomorrow = date.toDateString() === tomorrow.toDateString();
        const isPastDue = date < today;

        if (isToday) {
            return { text: 'Hoje', className: 'bg-orange-100 text-orange-800' };
        } else if (isTomorrow) {
            return { text: 'Amanhã', className: 'bg-blue-100 text-blue-800' };
        } else if (isPastDue) {
            return { text: 'Atrasado', className: 'bg-red-100 text-red-800' };
        }

        return {
            text: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`,
            className: 'bg-gray-100 text-gray-800'
        };
    };

    // Renderizar o fundo do cartão baseado na cor da capa
    const getCardStyle = () => {
        if (card.cover?.color) {
            return { borderTop: `4px solid var(--trello-${card.cover.color})` };
        }
        return {};
    };

    const dueDate = formatDueDate(card.due);

    return (
        <div
            className="bg-white rounded-md shadow-sm p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow"
            style={getCardStyle()}
        >
            {/* Etiquetas */}
            {card.labels && card.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {card.labels.map(label => (
                        <span
                            key={label.id}
                            className="h-2 rounded-sm block"
                            style={{
                                backgroundColor: label.color ? `var(--trello-${label.color})` : '#dfe1e6',
                                width: label.name ? '2rem' : '1rem'
                            }}
                            title={label.name}
                        />
                    ))}
                </div>
            )}

            {/* Título do cartão */}
            <h4 className="text-sm font-medium text-gray-800 mb-2">{card.name}</h4>

            {/* Rodapé com membros e data */}
            <div className="flex justify-between items-center mt-2">
                {/* Membros */}
                <div className="flex -space-x-1">
                    {card.members && card.members.slice(0, 3).map((member: TrelloMember) => (
                        <div
                            key={member.id}
                            className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-xs font-medium border-2 border-white overflow-hidden"
                            title={member.fullName}
                        >
                            {member.avatarUrl ? (
                                <img
                                    src={member.avatarUrl}
                                    alt={member.fullName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                getInitials(member.fullName)
                            )}
                        </div>
                    ))}
                    {card.members && card.members.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-medium border-2 border-white">
                            +{card.members.length - 3}
                        </div>
                    )}
                </div>

                {/* Data de vencimento */}
                {dueDate && (
                    <span className={`text-xs px-2 py-1 rounded-sm ${dueDate.className}`}>
                        {dueDate.text}
                    </span>
                )}
            </div>
        </div>
    );
}