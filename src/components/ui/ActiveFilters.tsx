import { motion } from 'framer-motion';
import { Filter, X } from 'lucide-react';

interface ActiveFilter {
    id: string;
    label: string;
    type: 'status' | 'feature' | 'relation';
    onRemove: () => void;
}

interface ActiveFiltersProps {
    filters: ActiveFilter[];
    onClearAll: () => void;
}

export function ActiveFilters({ filters, onClearAll }: ActiveFiltersProps) {
    if (filters.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 p-3 sm:p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="text-xs text-gray-500 mr-1 flex items-center">
                <Filter size={12} className="mr-1" />
                Filtros:
            </div>

            {filters.map((filter) => (
                <motion.span
                    key={filter.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${filter.type === 'status'
                            ? filter.label.toLowerCase().includes('ativ') || filter.label.toLowerCase().includes('sim')
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            : filter.type === 'feature'
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                >
                    {filter.label}
                    <button
                        onClick={filter.onRemove}
                        className="ml-1.5 hover:bg-white/20 rounded-full p-0.5"
                    >
                        <X size={12} />
                    </button>
                </motion.span>
            ))}

            <button
                onClick={onClearAll}
                className="text-xs text-[#09A08D] hover:text-[#078275] font-medium ml-auto flex items-center"
            >
                <X size={14} className="mr-1" />
                Limpar todos
            </button>
        </div>
    );
}