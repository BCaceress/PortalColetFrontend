import { AnimatePresence, motion } from 'framer-motion';
import { Tag, X } from 'lucide-react';

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

    // Variants para animações staggered (efeito cascata)
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { scale: 0.8, opacity: 0 },
        show: { scale: 1, opacity: 1 }
    };

    // Função para limpar filtros e evitar o bubbling de evento
    const handleClearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClearAll();
    };

    return (
        <motion.div
            key="active-filters-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-wrap items-center gap-2 p-3 sm:p-4 border-t border-gray-200 bg-gray-50/80 relative z-10"
        >
            <div className="text-xs text-gray-600 mr-1 flex items-center font-medium">
                <Tag size={12} className="mr-1.5 stroke-2 text-[#09A08D]" />
                Filtros ativos:
            </div>

            <motion.div
                className="flex flex-wrap gap-2"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                <AnimatePresence mode="popLayout">
                    {filters.map((filter) => {
                        // Determina a cor e ícone baseado no tipo de filtro
                        let badgeClasses = "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all";

                        if (filter.type === 'status') {
                            if (filter.label.toLowerCase().includes('ativ') ||
                                filter.label.toLowerCase().includes('sim') ||
                                filter.label.toLowerCase().includes('on') ||
                                filter.label.toLowerCase().includes('todos')) {
                                badgeClasses += ' bg-gradient-to-r from-green-50 to-green-100 text-green-800 border border-green-200 shadow-sm';
                            } else {
                                badgeClasses += ' bg-gradient-to-r from-red-50 to-red-100 text-red-800 border border-red-200 shadow-sm';
                            }
                        } else if (filter.type === 'feature') {
                            badgeClasses += ' bg-gradient-to-r from-orange-50 to-orange-100 text-orange-800 border border-orange-200 shadow-sm';
                        } else {
                            badgeClasses += ' bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border border-blue-200 shadow-sm';
                        }

                        return (
                            <motion.div
                                key={filter.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                layout
                                className={badgeClasses}
                                whileHover={{ scale: 1.03, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
                            >
                                {filter.label}
                                <motion.button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        filter.onRemove();
                                    }}
                                    className="ml-1.5 hover:bg-white/40 rounded-full p-0.5 transition-colors"
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <X size={12} className="stroke-[2.5]" />
                                </motion.button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            <motion.button
                onClick={handleClearAll}
                data-clear-filters="true"
                className="text-xs bg-white text-[#09A08D] hover:text-white hover:bg-[#09A08D] px-3 py-1.5 rounded-lg border border-[#09A08D]/30 
                    font-medium ml-auto flex items-center shadow-sm transition-all duration-200"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
            >
                <X size={14} className="mr-1" />
                Limpar todos
            </motion.button>
        </motion.div>
    );
}