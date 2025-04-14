import { motion } from 'framer-motion';
import { Filter, Sliders, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface FilterOption {
    id: string | number;
    label: string;
    value: any;
}

interface FilterConfig {
    name: string;
    type: 'toggle' | 'select' | 'multi-toggle';
    options: FilterOption[];
    currentValue: any;
    onChange: (value: any) => void;
}

interface FilterPanelProps {
    filters: FilterConfig[];
    onClearFilters: () => void;
}

export function FilterPanel({ filters, onClearFilters }: FilterPanelProps) {
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const filterMenuRef = useRef<HTMLDivElement>(null);
    const filterButtonRef = useRef<HTMLButtonElement>(null);

    // Calculate active filters count
    const activeFiltersCount = filters.reduce((count, filter) => {
        // For toggle filters like 'todos' | 'ativos' | 'inativos', check if not default
        if (filter.type === 'toggle' || filter.type === 'multi-toggle') {
            const defaultOption = filter.options.find(opt => opt.value === filter.currentValue);
            return count + (defaultOption?.id === filter.options[0].id ? 0 : 1);
        }
        // For select filters, null/undefined means no filter applied
        else if (filter.type === 'select') {
            return count + (filter.currentValue !== null ? 1 : 0);
        }
        return count;
    }, 0);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                filterMenuRef.current &&
                filterButtonRef.current &&
                !filterMenuRef.current.contains(event.target as Node) &&
                !filterButtonRef.current.contains(event.target as Node)
            ) {
                setShowFilterMenu(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Desktop filter button */}
                <button
                    ref={filterButtonRef}
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className={`hidden sm:flex items-center space-x-2 py-2.5 px-4 rounded-lg border transition-all duration-200 flex-shrink-0 
            ${activeFiltersCount > 0
                            ? 'bg-[#09A08D]/10 border-[#09A08D]/30 text-[#09A08D]'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                >
                    <Sliders size={16} className={activeFiltersCount > 0 ? "text-[#09A08D]" : "text-gray-500"} />
                    <span className="font-medium">Filtrar</span>
                    {activeFiltersCount > 0 && (
                        <span className="bg-[#09A08D] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>

                {/* Mobile filter button */}
                <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className={`sm:hidden flex items-center justify-center py-2.5 px-4 rounded-lg border transition-all duration-200 w-full
            ${activeFiltersCount > 0
                            ? 'bg-[#09A08D]/10 border-[#09A08D]/30 text-[#09A08D]'
                            : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                >
                    <Filter size={16} className="mr-2" />
                    <span className="font-medium">Filtros</span>
                    {activeFiltersCount > 0 && (
                        <span className="bg-[#09A08D] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ml-2">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Mobile filters panel */}
            {showMobileFilters && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-100 p-3 space-y-3 bg-gray-50/70 sm:hidden"
                >
                    {filters.map((filter) => (
                        <div key={filter.name}>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">{filter.name}</label>

                            {filter.type === 'multi-toggle' && (
                                <div className="flex space-x-2">
                                    {filter.options.map(option => (
                                        <button
                                            key={option.id}
                                            onClick={() => filter.onChange(option.value)}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex-1 transition-colors ${filter.currentValue === option.value
                                                    ? option.id === filter.options[0].id
                                                        ? 'bg-gray-200 text-gray-800' // Default option style
                                                        : option.id === filter.options[1].id
                                                            ? 'bg-green-100 text-green-800 border border-green-200' // First non-default option
                                                            : 'bg-red-100 text-red-800 border border-red-200' // Second non-default option
                                                    : 'bg-white text-gray-600 border border-gray-200'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {filter.type === 'toggle' && (
                                <div className="flex space-x-2">
                                    {filter.options.map(option => (
                                        <button
                                            key={option.id}
                                            onClick={() => filter.onChange(option.value)}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex-1 transition-colors ${filter.currentValue === option.value
                                                    ? option.id === filter.options[0].id
                                                        ? 'bg-gray-200 text-gray-800' // Default option
                                                        : option.id === filter.options[1].id
                                                            ? 'bg-green-100 text-green-800 border border-green-200' // First non-default option
                                                            : 'bg-orange-100 text-orange-800 border border-orange-200' // Second non-default option
                                                    : 'bg-white text-gray-600 border border-gray-200'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {filter.type === 'select' && (
                                <select
                                    value={filter.currentValue === null ? '' : filter.currentValue}
                                    onChange={(e) => filter.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                    className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#09A08D]/30 focus:border-[#09A08D] transition-all outline-none text-gray-700"
                                >
                                    {filter.options.map(option => (
                                        <option key={option.id} value={option.value === null ? '' : option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    ))}

                    <div className="pt-2 flex justify-end">
                        <button
                            onClick={onClearFilters}
                            className="text-xs text-[#09A08D] hover:underline font-medium flex items-center"
                        >
                            <X size={14} className="mr-1" />
                            Limpar filtros
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Desktop filter dropdown */}
            {showFilterMenu && (
                <div
                    ref={filterMenuRef}
                    className="hidden sm:block absolute right-6 mt-1 w-72 bg-white rounded-xl shadow-lg py-3 z-20 border border-gray-100 animate-in slide-in-from-top-5 fade-in duration-200"
                >
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-medium text-gray-800">Filtros Avançados</h3>
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={onClearFilters}
                                className="text-xs text-[#09A08D] hover:underline font-medium"
                            >
                                Limpar todos
                            </button>
                        )}
                    </div>

                    <div className="p-3 space-y-4">
                        {filters.map((filter) => (
                            <div key={filter.name}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{filter.name}</label>

                                {filter.type === 'multi-toggle' && (
                                    <div className="flex space-x-2">
                                        {filter.options.map(option => (
                                            <button
                                                key={option.id}
                                                onClick={() => filter.onChange(option.value)}
                                                className={`px-3 py-1.5 rounded-md text-sm font-medium flex-1 transition-colors ${filter.currentValue === option.value
                                                        ? option.id === filter.options[0].id
                                                            ? 'bg-gray-200 text-gray-800'
                                                            : option.id === filter.options[1].id
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {filter.type === 'toggle' && (
                                    <div className="flex space-x-2">
                                        {filter.options.map(option => (
                                            <button
                                                key={option.id}
                                                onClick={() => filter.onChange(option.value)}
                                                className={`px-3 py-1.5 rounded-md text-sm font-medium flex-1 transition-colors ${filter.currentValue === option.value
                                                        ? option.id === filter.options[0].id
                                                            ? 'bg-gray-200 text-gray-800'
                                                            : option.id === filter.options[1].id
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-orange-100 text-orange-800'
                                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {filter.type === 'select' && (
                                    <select
                                        value={filter.currentValue === null ? '' : filter.currentValue}
                                        onChange={(e) => filter.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#09A08D]/30 focus:border-[#09A08D] transition-all outline-none text-gray-700"
                                    >
                                        {filter.options.map(option => (
                                            <option key={option.id} value={option.value === null ? '' : option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}