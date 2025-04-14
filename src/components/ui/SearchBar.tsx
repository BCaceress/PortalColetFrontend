import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SearchBarProps {
    onSearch: (term: string) => void;
    placeholder?: string;
    initialValue?: string;
}

export function SearchBar({ onSearch, placeholder = "Buscar...", initialValue = "" }: SearchBarProps) {
    const [searchTerm, setSearchTerm] = useState(initialValue);

    useEffect(() => {
        setSearchTerm(initialValue);
    }, [initialValue]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        onSearch(value);
    };

    const clearSearch = () => {
        setSearchTerm("");
        onSearch("");
    };

    return (
        <div className="relative flex-grow w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-9 py-2.5 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#09A08D]/30 focus:border-[#09A08D] transition-all outline-none text-gray-800 bg-gray-50/70 focus:bg-white"
            />
            {searchTerm && (
                <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                    <X size={16} className="text-gray-400 hover:text-gray-600" />
                </button>
            )}
        </div>
    );
}