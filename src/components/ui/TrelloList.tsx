import { TrelloCard as TrelloCardType, TrelloList as TrelloListType } from '@/services/trelloApi';
import { TrelloCard } from './TrelloCard';

interface TrelloListProps {
    list: TrelloListType;
    cards: TrelloCardType[];
}

export function TrelloList({ list, cards }: TrelloListProps) {
    return (
        <div className="min-w-[272px] w-[272px] bg-gray-100 rounded-lg shadow-sm">
            <div className="px-3 py-2.5 font-medium text-gray-700">
                <h3 className="text-sm">{list.name}</h3>
                <div className="text-xs text-gray-500 mt-1">{cards.length} cartões</div>
            </div>

            <div className="px-2 py-1 max-h-[calc(100vh-220px)] overflow-y-auto">
                {cards.length > 0 ? (
                    cards.map((card) => (
                        <TrelloCard key={card.id} card={card} />
                    ))
                ) : (
                    <div className="py-4 text-center text-gray-500 text-sm italic">
                        Nenhum cartão nesta lista
                    </div>
                )}
            </div>
        </div>
    );
}