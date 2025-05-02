import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, Filter, Sliders, Tag, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface FilterOption {
    id: string | number;
    label: string;
    value: any;
    color?: string;
    icon?: React.ReactNode;
}

interface FilterConfig {
    name: string;
    type: 'toggle' | 'select' | 'multi-toggle' | 'chip';
    options: FilterOption[];
    currentValue: any;
    onChange: (value: any) => void;
    icon?: React.ReactNode;
}

interface FilterPanelProps {
    filters: FilterConfig[];
    onClearFilters: () => void;
    className?: string;
}

export function FilterPanel({ filters, onClearFilters, className = "" }: FilterPanelProps) {
    const [showFilters, setShowFilters] = useState(false);
    const [expandedContentMounted, setExpandedContentMounted] = useState(false);
    const filterButtonRef = useRef<HTMLButtonElement>(null);
    const filterPanelRef = useRef<HTMLDivElement>(null);

    // Calculate active filters count
    const activeFiltersCount = filters.reduce((count, filter) => {
        if (filter.name === 'Status' && filter.currentValue === 'ativo') {
            return count;
        }

        if (filter.type === 'toggle' || filter.type === 'multi-toggle') {
            const defaultOption = filter.options.find(opt => opt.value === filter.currentValue);
            return count + (defaultOption?.id === filter.options[0].id ? 0 : 1);
        } else if (filter.type === 'select') {
            return count + (filter.currentValue !== null ? 1 : 0);
        } else if (filter.type === 'chip' && Array.isArray(filter.currentValue)) {
            return count + (filter.currentValue.length > 0 ? 1 : 0);
        }
        return count;
    }, 0);

    // Get selected filter labels for display
    const selectedFilters = filters.flatMap(filter => {
        if (filter.type === 'chip' && Array.isArray(filter.currentValue) && filter.currentValue.length > 0) {
            return [{
                id: filter.name,
                label: `${filter.name} (${filter.currentValue.length})`,
                color: "bg-indigo-100 text-indigo-800 border border-indigo-200"
            }];
        }

        const selectedOption = filter.options.find(opt => opt.value === filter.currentValue);

        if (selectedOption && selectedOption.id !== filter.options[0]?.id) {
            return [{
                id: filter.name,
                label: selectedOption.label,
                color: getFilterColor(filter.type, selectedOption.id, filter.options)
            }];
        }
        return [];
    });

    // Set up portal for filter content
    useEffect(() => {
        const filterContentContainer = document.getElementById('filter-panel-content');
        if (filterContentContainer) {
            setExpandedContentMounted(true);
        }
    }, []);

    // Close filter panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                filterPanelRef.current &&
                filterButtonRef.current &&
                !filterPanelRef.current.contains(event.target as Node) &&
                !filterButtonRef.current.contains(event.target as Node)
            ) {
                // Check if the click was on a clearFilters button
                const target = event.target as HTMLElement;
                const isClearButton = target.closest('[data-clear-filters="true"]');

                if (!isClearButton) {
                    setShowFilters(false);
                }
            }
        };

        if (showFilters) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFilters]);

    // Helper function to get appropriate color class for filter badges
    function getFilterColor(filterType: string, optionId: string | number, options: FilterOption[]): string {
        if (filterType === 'toggle' || filterType === 'multi-toggle') {
            if (optionId === 1 || optionId === options[1]?.id) {
                return "bg-green-100 text-green-800 border-green-200";
            } else if (optionId === 2 || optionId === options[2]?.id) {
                return "bg-red-100 text-red-800 border-red-200";
            }
        }
        return "bg-blue-100 text-blue-800 border-blue-200";
    }

    // Function to determine if all filters are in their default state
    const areAllFiltersDefault = () => {
        return activeFiltersCount === 0;
    }

    // Function to handle clearing filters without closing the panel
    const handleClearFilters = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event bubbling
        onClearFilters();
    };

    // Helper for chip type filters
    const isChipSelected = (filter: FilterConfig, optionValue: any) => {
        if (!Array.isArray(filter.currentValue)) return false;
        return filter.currentValue.includes(optionValue);
    };

    const toggleChip = (filter: FilterConfig, optionValue: any) => {
        if (!Array.isArray(filter.currentValue)) {
            filter.onChange([optionValue]);
            return;
        }

        const newValues = [...filter.currentValue];
        const index = newValues.indexOf(optionValue);

        if (index >= 0) {
            newValues.splice(index, 1);
        } else {
            newValues.push(optionValue);
        }

        filter.onChange(newValues);
    };

    // Custom dropdown with better UI for dropdowns
    const CustomDropdown = ({ filter }: { filter: FilterConfig }) => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef<HTMLDivElement>(null);
        const listRef = useRef<HTMLDivElement>(null);
        const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');

        // Find current selected option
        const selectedOption = filter.options.find(opt => opt.value === filter.currentValue);

        // Verificar se este é o filtro de status para aplicar z-index específico
        const isStatusFilter = filter.name === 'Status';

        // Calculate best position for dropdown
        useEffect(() => {
            if (isOpen && dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceNeeded = Math.min(filter.options.length * 36, 250); // Estimate height

                if (spaceBelow < spaceNeeded && rect.top > spaceNeeded) {
                    setDropdownPosition('top');
                } else {
                    setDropdownPosition('bottom');
                }
            }
        }, [isOpen, filter.options.length]);

        // Close dropdown when clicking outside
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };

            if (isOpen) {
                document.addEventListener('mousedown', handleClickOutside);
            }

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [isOpen]);

        return (
            <div className={`relative w-full ${isStatusFilter ? 'z-[100]' : ''}`} ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between bg-white border ${isOpen ? 'border-[#09A08D] ring-2 ring-[#09A08D]/20' : 'border-gray-200'
                        } rounded-lg p-2.5 text-left text-sm transition-all duration-200`}
                >
                    <span className="flex items-center gap-2 text-gray-800">
                        {selectedOption?.icon}
                        {selectedOption?.label}
                    </span>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                    </motion.div>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            key="dropdown-menu"
                            ref={listRef}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            style={{ transformOrigin: dropdownPosition === 'top' ? 'bottom center' : 'top center' }}
                            className={`absolute ${isStatusFilter ? 'z-[10000]' : 'z-[9999]'} ${dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
                                } left-0 w-full rounded-lg bg-white shadow-lg border border-gray-200 py-1 max-h-[250px] overflow-y-auto`}
                        >
                            {filter.options.map(option => (
                                <div
                                    key={option.id}
                                    onClick={() => {
                                        filter.onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`flex items-center px-3 py-2 text-sm cursor-pointer transition-colors ${option.value === filter.currentValue
                                        ? 'bg-[#09A08D]/10 text-[#09A08D]'
                                        : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    <span className="w-5 h-5 mr-2 flex items-center justify-center">
                                        {option.value === filter.currentValue && (
                                            <CheckCircle2 size={16} className="text-[#09A08D]" />
                                        )}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {option.icon}
                                        <span>{option.label}</span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Indicador visual de filtro selecionado */}
                {filter.currentValue !== filter.options[0]?.value && (
                    <div className="absolute top-0 right-0 mt-0.5 mr-0.5">
                        <div className="h-2 w-2 rounded-full bg-[#09A08D]"></div>
                    </div>
                )}
            </div>
        );
    };

    const FilterContent = () => {
        return (
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden shadow-sm border-t border-gray-200"
                        ref={filterPanelRef}
                    >
                        <div className="p-4 space-y-4 bg-white">
                            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                <h3 className="font-medium text-gray-800 flex items-center">
                                    <Sliders size={16} className="mr-2 text-[#09A08D]" />
                                    Filtros Avançados
                                </h3>
                                {!areAllFiltersDefault() && (
                                    <button
                                        onClick={handleClearFilters}
                                        data-clear-filters="true"
                                        className="text-xs text-[#09A08D] hover:text-[#078275] hover:bg-[#09A08D]/5 py-1 px-2.5 rounded-md font-medium flex items-center transition-colors"
                                    >
                                        <X size={14} className="mr-1" />
                                        Limpar todos
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filters.map((filter) => (
                                    <div key={filter.name} className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                            {filter.icon && <span className="mr-2 text-gray-500">{filter.icon}</span>}
                                            {filter.name}
                                        </label>

                                        {(filter.type === 'multi-toggle' || filter.type === 'toggle' || filter.type === 'select') && (
                                            <CustomDropdown filter={filter} />
                                        )}

                                        {filter.type === 'chip' && (
                                            <div className="flex flex-wrap gap-2">
                                                {filter.options.map(option => (
                                                    <motion.button
                                                        key={option.id}
                                                        onClick={() => toggleChip(filter, option.value)}
                                                        whileHover={{ scale: 1.03 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border ${isChipSelected(filter, option.value)
                                                            ? 'bg-[#09A08D]/10 border-[#09A08D]/30 text-[#09A08D]'
                                                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                                            } transition-colors flex items-center gap-1.5`}
                                                    >
                                                        {option.icon}
                                                        {option.label}
                                                        {isChipSelected(filter, option.value) && (
                                                            <CheckCircle2 size={12} className="text-[#09A08D]" />
                                                        )}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {selectedFilters.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-4 mt-3 border-t border-gray-200">
                                    <span className="text-xs text-gray-500 mr-1 flex items-center">
                                        <Tag size={12} className="mr-1 stroke-2" />
                                        Filtros ativos:
                                    </span>
                                    {selectedFilters.map((filter) => (
                                        <div
                                            key={filter.id}
                                            className={`px-3 py-1 text-xs rounded-full inline-flex items-center ${filter.color} font-medium border`}
                                        >
                                            {filter.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    };

    return (
        <>
            {/* Filter Button */}
            <div className="w-auto">
                <motion.button
                    ref={filterButtonRef}
                    onClick={() => setShowFilters(!showFilters)}
                    whileTap={{ scale: 0.97 }}
                    className={`flex-shrink-0 flex items-center space-x-2 py-2.5 px-4 rounded-lg 
                        transition-all duration-200 justify-between h-[42px] shadow-sm
                        ${activeFiltersCount > 0
                            ? 'bg-gradient-to-r from-[#09A08D]/20 to-teal-500/20 border border-[#09A08D]/30 text-[#09A08D]'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'} ${className}`}
                    aria-expanded={showFilters}
                    aria-controls="filter-panel"
                >
                    <div className="flex items-center space-x-2">
                        <Filter size={16} className={activeFiltersCount > 0 ? "text-[#09A08D]" : "text-gray-500"} />
                        <span className="font-medium">Filtros</span>
                        {activeFiltersCount > 0 && (
                            <span className="bg-[#09A08D] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                    </div>
                    <motion.div
                        animate={{ rotate: showFilters ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="ml-2"
                    >
                        <ChevronDown size={16} />
                    </motion.div>
                </motion.button>
            </div>

            {/* Portal the filter content to the designated container */}
            {expandedContentMounted && createPortal(
                <FilterContent />,
                document.getElementById('filter-panel-content')!
            )}
        </>
    );
}