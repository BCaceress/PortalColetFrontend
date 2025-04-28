'use client';

import { motion } from 'framer-motion';
import { BarChart3, Calendar, Download, FileBarChart, Filter, Printer, Search } from 'lucide-react';
import { useState } from 'react';

// Import our reusable components
import { ActiveFilters } from '@/components/ui/ActiveFilters';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';

// Define report types and interface
interface Report {
    id: number;
    title: string;
    description: string;
    category: string;
    icon: JSX.Element;
    lastGenerated?: string;
    availableFormats: ('pdf' | 'excel' | 'csv')[];
    requiresDateRange: boolean;
    requiresFilters: string[];
}

export default function ReportPage() {
    const [loading, setLoading] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('todos');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    // Available reports
    const reports: Report[] = [
        {
            id: 1,
            title: 'Relatório de Clientes',
            description: 'Dados cadastrais e estatísticas de todos os clientes',
            category: 'clientes',
            icon: <FileBarChart size={24} className="text-blue-500" />,
            lastGenerated: '15/04/2025',
            availableFormats: ['pdf', 'excel', 'csv'],
            requiresDateRange: false,
            requiresFilters: [],
        },
        {
            id: 2,
            title: 'Relatório de Atendimentos',
            description: 'Histórico de atendimentos por período e cliente',
            category: 'atendimentos',
            icon: <BarChart3 size={24} className="text-green-500" />,
            lastGenerated: '10/04/2025',
            availableFormats: ['pdf', 'excel'],
            requiresDateRange: true,
            requiresFilters: ['cliente', 'tipo'],
        },
        {
            id: 3,
            title: 'Relatório de Faturamento',
            description: 'Resumo de faturamento por período, cliente e serviço',
            category: 'financeiro',
            icon: <BarChart3 size={24} className="text-purple-500" />,
            availableFormats: ['pdf', 'excel', 'csv'],
            requiresDateRange: true,
            requiresFilters: ['cliente'],
        },
        {
            id: 4,
            title: 'Relatório de Desempenho',
            description: 'Métricas de desempenho da equipe de atendimento',
            category: 'desempenho',
            icon: <FileBarChart size={24} className="text-orange-500" />,
            lastGenerated: '01/04/2025',
            availableFormats: ['pdf'],
            requiresDateRange: true,
            requiresFilters: ['operador'],
        },
        {
            id: 5,
            title: 'Relatório de SLA',
            description: 'Análise de cumprimento de acordos de nível de serviço',
            category: 'qualidade',
            icon: <FileBarChart size={24} className="text-red-500" />,
            availableFormats: ['pdf', 'excel'],
            requiresDateRange: true,
            requiresFilters: ['cliente', 'contrato'],
        },
        {
            id: 6,
            title: 'Relatório de Feedbacks',
            description: 'Resumo de avaliações e feedbacks dos clientes',
            category: 'qualidade',
            icon: <FileBarChart size={24} className="text-yellow-500" />,
            availableFormats: ['pdf', 'excel'],
            requiresDateRange: true,
            requiresFilters: [],
        },
        {
            id: 7,
            title: 'Relatório de Deslocamento',
            description: 'Histórico de deslocamentos registrados nas RATs por usuário e período',
            category: 'atendimentos',
            icon: <FileBarChart size={24} className="text-indigo-500" />,
            availableFormats: ['pdf', 'excel', 'csv'],
            requiresDateRange: true,
            requiresFilters: ['usuario'],
        },
    ];

    // Filtered reports based on search and category
    const filteredReports = reports.filter(report => {
        const matchesSearch = searchTerm === '' ||
            report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = categoryFilter === 'todos' || report.category === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    // Handle search
    const handleSearch = (term: string) => {
        setSearchTerm(term);
    };

    // Handle category filter
    const handleCategoryFilter = (category: string) => {
        setCategoryFilter(category);
    };

    // Clear all filters
    const clearFilters = () => {
        setCategoryFilter('todos');
        setSearchTerm('');
    };

    // Handle report selection
    const handleSelectReport = (report: Report) => {
        setSelectedReport(report);
        setIsExpanded(false);
    };

    // Toggle expanded view
    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    // Handle generate report
    const handleGenerateReport = async (format: 'pdf' | 'excel' | 'csv') => {
        if (!selectedReport) return;

        try {
            setIsGenerating(true);

            // Validation for required date range
            if (selectedReport.requiresDateRange && (!startDate || !endDate)) {
                alert('Por favor, selecione um período para gerar este relatório.');
                setIsGenerating(false);
                return;
            }

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Simulate successful generation
            alert(`Relatório ${selectedReport.title} gerado com sucesso em formato ${format.toUpperCase()}`);

        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            alert('Ocorreu um erro ao gerar o relatório. Por favor, tente novamente.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Reset selection
    const handleCloseReport = () => {
        setSelectedReport(null);
        setIsExpanded(true);
    };

    // Create active filters array
    const activeFilters = [
        ...(categoryFilter !== 'todos' ? [{
            id: 'category',
            label: categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1),
            type: 'category' as const,
            onRemove: () => handleCategoryFilter('todos')
        }] : []),
        ...(startDate && endDate ? [{
            id: 'dateRange',
            label: `Período: ${startDate} - ${endDate}`,
            type: 'date' as const,
            onRemove: () => {
                setStartDate('');
                setEndDate('');
            }
        }] : [])
    ];

    // Create filter configurations
    const filterConfig = [
        {
            name: 'Categoria',
            type: 'multi-toggle' as const,
            options: [
                { id: 'todos', label: 'Todos', value: 'todos' },
                { id: 'clientes', label: 'Clientes', value: 'clientes' },
                { id: 'atendimentos', label: 'Atendimentos', value: 'atendimentos' },
                { id: 'financeiro', label: 'Financeiro', value: 'financeiro' },
                { id: 'desempenho', label: 'Desempenho', value: 'desempenho' },
                { id: 'qualidade', label: 'Qualidade', value: 'qualidade' },
            ],
            currentValue: categoryFilter,
            onChange: handleCategoryFilter
        }
    ];

    return (
        <div className="p-1 sm:p-5 max-w-7xl mx-auto">
            {/* Page header with title and description */}
            <PageHeader
                title="Relatórios"
                description="Gere e exporte relatórios personalizados"
            />

            {/* Search and filter container */}
            <div className="mb-6">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                    {/* Search and filter row */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 p-3 sm:p-4">
                        <SearchBar
                            onSearch={handleSearch}
                            placeholder="Buscar relatórios"
                            initialValue={searchTerm}
                        />

                        <FilterPanel
                            filters={filterConfig}
                            onClearFilters={clearFilters}
                        />
                    </div>

                    {/* Active filters */}
                    <ActiveFilters
                        filters={activeFilters}
                        onClearAll={clearFilters}
                    />
                </motion.div>
            </div>

            {/* Main content - Animated report list and filter container */}
            <div className="flex flex-col gap-5">
                {/* Reports list - Minimize when report is selected */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        height: isExpanded ? 'auto' : 'min-content'
                    }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                    <div className={`p-4 sm:p-5 ${isExpanded ? '' : 'cursor-pointer'}`} onClick={isExpanded ? undefined : toggleExpanded}>
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl text-gray-800 font-semibold">
                                {selectedReport && !isExpanded
                                    ? `Relatório Selecionado: ${selectedReport.title}`
                                    : 'Relatórios Disponíveis'}
                            </h2>
                            {selectedReport && (
                                <button
                                    onClick={toggleExpanded}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    {isExpanded ? 'Minimizar' : 'Expandir'}
                                </button>
                            )}
                        </div>

                        {isExpanded && (
                            <div className="mt-4">
                                {filteredReports.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredReports.map((report) => (
                                            <motion.div
                                                key={report.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                                onClick={() => handleSelectReport(report)}
                                                className={`bg-white border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md
                                                    ${selectedReport?.id === report.id ? 'border-[#09A08D] ring-2 ring-[#09A08D] ring-opacity-30' : 'border-gray-200'}`}
                                            >
                                                <div className="flex items-start">
                                                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                                                        {report.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-gray-900">{report.title}</h3>
                                                        <p className="text-sm text-gray-500 mt-1">{report.description}</p>

                                                        <div className="mt-3 flex flex-wrap items-center text-xs text-gray-500 gap-x-3 gap-y-1">
                                                            <span className="inline-flex items-center">
                                                                <Calendar size={12} className="mr-1" />
                                                                {report.lastGenerated ? `Último: ${report.lastGenerated}` : 'Nunca gerado'}
                                                            </span>

                                                            <div className="inline-flex items-center gap-1">
                                                                {report.availableFormats.map(format => (
                                                                    <span key={format} className="bg-gray-100 rounded px-1.5 py-0.5 uppercase">
                                                                        {format}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <Search size={28} className="text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum relatório encontrado</h3>
                                        <p className="text-gray-500 mb-4">Ajuste os filtros ou faça uma nova busca</p>
                                        <button
                                            onClick={clearFilters}
                                            className="text-[#09A08D] font-medium hover:text-teal-700"
                                        >
                                            Limpar filtros
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Report configuration panel - Only visible when a report is selected */}
                {selectedReport && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                        <div className="p-4 sm:p-5">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold">Configuração do Relatório</h2>
                                <button
                                    className="text-gray-400 hover:text-gray-600"
                                    onClick={handleCloseReport}
                                >
                                    Fechar
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Date range selection */}
                                {selectedReport.requiresDateRange && (
                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-3">Período</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">Data inicial</label>
                                                <input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#09A08D] focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">Data final</label>
                                                <input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#09A08D] focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Additional filters would be added here based on report.requiresFilters */}
                                {selectedReport.requiresFilters.length > 0 && (
                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-3">Filtros Adicionais</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Filter size={16} />
                                            <span>
                                                {selectedReport.requiresFilters.map(filter =>
                                                    filter.charAt(0).toUpperCase() + filter.slice(1)
                                                ).join(', ')}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500">
                                            Opções de filtro serão implementadas nas próximas versões.
                                        </p>
                                    </div>
                                )}

                                {/* Format selection and generate buttons */}
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-3">Formato e Geração</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedReport.availableFormats.map((format) => (
                                            <button
                                                key={format}
                                                onClick={() => handleGenerateReport(format)}
                                                disabled={isGenerating}
                                                className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#09A08D] focus:ring-opacity-50"
                                            >
                                                {format === 'pdf' && <Printer size={16} />}
                                                {format === 'excel' && <Download size={16} />}
                                                {format === 'csv' && <Download size={16} />}
                                                Gerar {format.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Preview section - This would show a preview of the report */}
                                <div className="mt-6">
                                    <h3 className="font-medium text-gray-900 mb-3">Pré-visualização</h3>
                                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                        <p className="text-gray-500">
                                            Selecione um período e clique em "Gerar" para ver a pré-visualização do relatório
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isGenerating && (
                            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                                <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                                    <LoadingSpinner size={50} />
                                    <p className="mt-4 font-medium">Gerando relatório...</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}