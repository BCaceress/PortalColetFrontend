'use client';

import api from '@/services/api';
import { motion } from 'framer-motion';
import { BookOpen, File, FileVideo, FolderOpen, Image, Plus, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Import our reusable components
import { ActiveFilters } from '@/components/ui/ActiveFilters';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchBar } from '@/components/ui/SearchBar';

// Define knowledge base item types based on the API response format
interface BaseConhecimento {
    id_base_conhecimento: number;
    ds_categoria: 'Manual' | 'Tutorial' | 'Documento' | 'Treinamento';
    ds_tipo: 'Documento' | 'Video' | 'Imagem';
    ds_permissao: 'Todos' | 'Administrador' | 'Implantador' | 'Suporte' | 'Analista' | 'Desenvolvedor';
    ds_titulo: string;
    ds_descricao?: string;
    ds_url?: string;
    ds_conteudo?: string;
    fl_ativo: boolean;
    id_usuario: number;
    dt_data_upload?: string;
    nr_visualizacoes?: number;
    ds_extensao?: string;
    nr_tamanho_arquivo?: number;
    usuario?: {
        nome: string;
    };
}

export default function BaseConhecimento() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [recursos, setRecursos] = useState<BaseConhecimento[]>([]);
    const [filteredRecursos, setFilteredRecursos] = useState<BaseConhecimento[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('todos');
    const [typeFilter, setTypeFilter] = useState<'todos' | 'Documento' | 'Video' | 'Imagem'>('todos');
    const [permissionFilter, setPermissionFilter] = useState<string>('todos');
    const [animateItems, setAnimateItems] = useState(false);

    // Fetch knowledge base items from API
    useEffect(() => {
        const fetchResources = async () => {
            try {
                setLoading(true);

                // Fetch data from the actual API endpoint
                const response = await api.get('/base-conhecimento');
                const data = response.data;

                setRecursos(data);
                setFilteredRecursos(data);

                // Trigger animation after data loads
                setTimeout(() => setAnimateItems(true), 100);
            } catch (err) {
                console.error('Erro ao buscar recursos da base de conhecimento:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
    }, []);

    // Handle search
    const handleSearch = (term: string) => {
        setSearchTerm(term);
        filterResources(term, categoryFilter, typeFilter, permissionFilter);
    };

    // Handle category filter
    const handleCategoryFilter = (category: string) => {
        setCategoryFilter(category);
        filterResources(searchTerm, category, typeFilter, permissionFilter);
    };

    // Handle type filter
    const handleTypeFilter = (type: 'todos' | 'Documento' | 'Video' | 'Imagem') => {
        setTypeFilter(type);
        filterResources(searchTerm, categoryFilter, type, permissionFilter);
    };

    // Handle permission filter
    const handlePermissionFilter = (permission: string) => {
        setPermissionFilter(permission);
        filterResources(searchTerm, categoryFilter, typeFilter, permission);
    };

    // Clear all filters
    const clearFilters = () => {
        setCategoryFilter('todos');
        setTypeFilter('todos');
        setPermissionFilter('todos');
        filterResources(searchTerm, 'todos', 'todos', 'todos');
    };

    // Filter resources based on search term and filters
    const filterResources = (
        term: string,
        category: string,
        type: 'todos' | 'Documento' | 'Video' | 'Imagem',
        permission: string
    ) => {
        // Trigger fade-out animation
        setAnimateItems(false);

        setTimeout(() => {
            let filtered = recursos;

            // Apply search term filter
            if (term) {
                filtered = filtered.filter(resource =>
                    resource.ds_titulo.toLowerCase().includes(term.toLowerCase()) ||
                    (resource.ds_descricao && resource.ds_descricao.toLowerCase().includes(term.toLowerCase()))
                );
            }

            // Apply category filter
            if (category !== 'todos') {
                filtered = filtered.filter(resource => resource.ds_categoria === category);
            }

            // Apply type filter
            if (type !== 'todos') {
                filtered = filtered.filter(resource => resource.ds_tipo === type);
            }

            // Apply permission filter
            if (permission !== 'todos') {
                filtered = filtered.filter(resource => resource.ds_permissao === permission);
            }

            setFilteredRecursos(filtered);
            // Trigger fade-in animation
            setTimeout(() => setAnimateItems(true), 100);
        }, 200);
    };

    // Handle opening resource
    const handleOpenResource = (resource: BaseConhecimento) => {
        try {
            // Track the view if there's a view counter
            if (typeof resource.nr_visualizacoes !== 'undefined') {
                // Increment view count in the background
                api.post(`/base-conhecimento/${resource.id_base_conhecimento}/view`)
                    .catch(err => console.error('Erro ao registrar visualização:', err));
            }

            // Open the document based on the URL
            if (resource.ds_url) {
                // For network shares or local files
                if (resource.ds_url.startsWith('\\')) {
                    try {
                        // Extract the directory path from the file path
                        const pathParts = resource.ds_url.split('\\');
                        const fileName = pathParts[pathParts.length - 1];
                        const dirPath = resource.ds_url.substring(0, resource.ds_url.length - fileName.length);

                        // Ask the user if they want to open the file or the directory
                        const userChoice = confirm(
                            `Documento: ${resource.ds_titulo}\n\n` +
                            `Você deseja:\n` +
                            `- OK: Tentar abrir o arquivo diretamente\n` +
                            `- Cancelar: Copiar o caminho da pasta para navegação manual\n\n` +
                            `Arquivo: ${resource.ds_url}`
                        );

                        if (userChoice) {
                            // Try to open the file directly
                            const fileUrl = 'file://' + resource.ds_url.replace(/\\/g, '/');
                            const windowRef = window.open(fileUrl, '_blank');

                            // If window.open returned null, it might be due to popup blockers or security restrictions
                            if (!windowRef) {
                                alert(
                                    `Não foi possível abrir o arquivo diretamente devido a restrições do navegador.\n\n` +
                                    `O caminho do arquivo será copiado para a área de transferência.`
                                );

                                // Copy the file path
                                navigator.clipboard.writeText(resource.ds_url).then(
                                    () => alert('O caminho do arquivo foi copiado para a área de transferência.'),
                                    () => {
                                        // Fallback if clipboard API fails
                                        const tempInput = document.createElement('input');
                                        tempInput.value = resource.ds_url;
                                        document.body.appendChild(tempInput);
                                        tempInput.select();
                                        document.execCommand('copy');
                                        document.body.removeChild(tempInput);
                                        alert('O caminho do arquivo foi copiado para a área de transferência.');
                                    }
                                );
                            }
                        } else {
                            // User wants to open directory
                            // Copy the directory path to clipboard
                            navigator.clipboard.writeText(dirPath).then(
                                () => {
                                    alert(
                                        `O caminho da pasta foi copiado para a área de transferência.\n\n` +
                                        `Cole este caminho no Explorador de Arquivos do Windows para navegar até o documento.\n\n` +
                                        `Caminho da pasta: ${dirPath}`
                                    );
                                },
                                () => {
                                    // Fallback if clipboard API fails
                                    const tempInput = document.createElement('input');
                                    tempInput.value = dirPath;
                                    document.body.appendChild(tempInput);
                                    tempInput.select();
                                    document.execCommand('copy');
                                    document.body.removeChild(tempInput);
                                    alert(
                                        `O caminho da pasta foi copiado para a área de transferência.\n\n` +
                                        `Cole este caminho no Explorador de Arquivos do Windows para navegar até o documento.\n\n` +
                                        `Caminho da pasta: ${dirPath}`
                                    );
                                }
                            );

                            // Also try to open directory directly as a fallback option
                            // This might work on some systems/browsers
                            const dirUrl = 'file://' + dirPath.replace(/\\/g, '/');
                            window.open(dirUrl, '_blank');
                        }
                    } catch (err) {
                        console.error('Erro ao processar caminho de rede:', err);
                        // Fallback - just copy full file path
                        navigator.clipboard.writeText(resource.ds_url).catch(() => {
                            // Fallback if clipboard API fails
                            const tempInput = document.createElement('input');
                            tempInput.value = resource.ds_url;
                            document.body.appendChild(tempInput);
                            tempInput.select();
                            document.execCommand('copy');
                            document.body.removeChild(tempInput);
                        });

                        alert(
                            `Ocorreu um erro ao processar o caminho.\n\n` +
                            `O caminho completo do arquivo foi copiado para a área de transferência.\n\n` +
                            `Caminho: ${resource.ds_url}`
                        );
                    }
                } else if (resource.ds_url.startsWith('http')) {
                    // For HTTP URLs, open directly
                    window.open(resource.ds_url, '_blank');
                } else {
                    // For relative URLs or other formats
                    window.open(resource.ds_url, '_blank');
                }
            } else if (resource.ds_conteudo) {
                // If there's direct content but no URL, show it in a simple viewer
                const newWindow = window.open('', '_blank');
                if (newWindow) {
                    newWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>${resource.ds_titulo}</title>
                            <meta charset="utf-8">
                            <style>
                                body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
                                h1 { color: #09A08D; }
                                pre { background: #f5f5f5; padding: 10px; border-radius: 5px; white-space: pre-wrap; }
                            </style>
                        </head>
                        <body>
                            <h1>${resource.ds_titulo}</h1>
                            <p><strong>Categoria:</strong> ${resource.ds_categoria}</p>
                            ${resource.ds_descricao ? `<p>${resource.ds_descricao}</p>` : ''}
                            <pre>${resource.ds_conteudo}</pre>
                        </body>
                        </html>
                    `);
                    newWindow.document.close();
                } else {
                    alert('Não foi possível abrir uma nova janela. Verifique se o bloqueador de pop-ups está ativado.');
                }
            } else {
                // If no URL or content is available
                alert('Este documento não possui conteúdo ou URL para visualização.');
            }
        } catch (error) {
            console.error('Erro ao abrir o recurso:', error);
            alert('Ocorreu um erro ao abrir o documento. Verifique se você tem acesso ao caminho especificado.');
        }
    };

    // Handle uploading new resource
    const handleUploadResource = () => {
        router.push('/dashboard/baseConhecimento/cadastro');
    };

    // Format file size
    const formatFileSize = (bytes?: number): string => {
        if (bytes === undefined) return '';

        if (bytes < 1024) return `${bytes} B`;
        else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        else if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        else return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    // Create active filters array
    const activeFilters = [
        ...(categoryFilter !== 'todos' ? [{
            id: 'category',
            label: categoryFilter,
            type: 'category' as const,
            onRemove: () => handleCategoryFilter('todos')
        }] : []),
        ...(typeFilter !== 'todos' ? [{
            id: 'type',
            label: typeFilter,
            type: 'type' as const,
            onRemove: () => handleTypeFilter('todos')
        }] : []),
        ...(permissionFilter !== 'todos' ? [{
            id: 'permission',
            label: permissionFilter,
            type: 'permission' as const,
            onRemove: () => handlePermissionFilter('todos')
        }] : [])
    ];

    // Get list of categories from the data
    const getUniqueCategories = () => {
        const categories = new Set<string>(recursos.map(resource => resource.ds_categoria));
        return Array.from(categories);
    };

    // Create filter configurations
    const filterConfig = [
        {
            name: 'Categoria',
            type: 'multi-toggle' as const,
            options: [
                { id: 'todos', label: 'Todos', value: 'todos' },
                ...getUniqueCategories().map(category => ({
                    id: category,
                    label: category,
                    value: category
                }))
            ],
            currentValue: categoryFilter,
            onChange: handleCategoryFilter
        },
        {
            name: 'Tipo',
            type: 'toggle' as const,
            options: [
                { id: 'todos', label: 'Todos', value: 'todos' },
                { id: 'Documento', label: 'Documento', value: 'Documento' },
                { id: 'Video', label: 'Vídeo', value: 'Video' },
                { id: 'Imagem', label: 'Imagem', value: 'Imagem' }
            ],
            currentValue: typeFilter,
            onChange: handleTypeFilter
        },
        {
            name: 'Permissão',
            type: 'select' as const,
            options: [
                { id: 'todos', label: 'Todos', value: 'todos' },
                { id: 'Todos', label: 'Todos usuários', value: 'Todos' },
                { id: 'Administrador', label: 'Administrador', value: 'Administrador' },
                { id: 'Implantador', label: 'Implantador', value: 'Implantador' },
                { id: 'Suporte', label: 'Suporte', value: 'Suporte' },
                { id: 'Analista', label: 'Analista', value: 'Analista' },
                { id: 'Desenvolvedor', label: 'Desenvolvedor', value: 'Desenvolvedor' },
            ],
            currentValue: permissionFilter,
            onChange: handlePermissionFilter
        }
    ];

    // Display loading spinner while data is being loaded initially
    if (loading && recursos.length === 0) {
        return <LoadingSpinner fullScreen text="Carregando base de conhecimento..." />;
    }

    // Helper function to get icon based on file type and extension
    const getIconForType = (tipo: string, extensao?: string): JSX.Element => {
        const size = 28;
        const className = "text-[#09A08D]";

        switch (tipo) {
            case 'Documento':
                return <File size={size} className={className} />;
            case 'Video':
                return <FileVideo size={size} className={className} />;
            case 'Imagem':
                return <Image size={size} className={className} />;
            default:
                return <File size={size} className={className} />;
        }
    };

    // Helper function to determine badge color by type
    const getBadgeColorForType = (type: string) => {
        switch (type) {
            case 'Documento':
                return 'bg-blue-100 text-blue-800';
            case 'Video':
                return 'bg-purple-100 text-purple-800';
            case 'Imagem':
                return 'bg-amber-100 text-amber-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-1 sm:p-5 max-w-7xl mx-auto">
            {/* Page header with title and action button */}
            <PageHeader
                title="Base de Conhecimento"
                description="Acesse documentos, vídeos e imagens sobre nossos sistemas e processos"
                actionButton={
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="bg-gradient-to-r from-[#09A08D] to-teal-500 text-white px-4 sm:px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-all w-full sm:w-auto justify-center font-medium"
                        onClick={handleUploadResource}
                    >
                        <Upload size={18} />
                        <span>Novo Arquivo</span>
                    </motion.button>
                }
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
                            placeholder="Buscar por título ou descrição"
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

            {/* Resources grid */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-4 sm:p-5"
            >
                {filteredRecursos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRecursos.map((resource, index) => (
                            <motion.div
                                key={resource.id_base_conhecimento}
                                initial={{ opacity: 0 }}
                                animate={animateItems ? { opacity: 1 } : { opacity: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                onClick={() => handleOpenResource(resource)}
                                className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all"
                            >
                                {/* Icon representation for the file type */}
                                <div className="relative h-40 bg-gray-100 flex items-center justify-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-2">
                                            {getIconForType(resource.ds_tipo, resource.ds_extensao)}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {resource.ds_extensao ? resource.ds_extensao.toUpperCase() : ''} {formatFileSize(resource.nr_tamanho_arquivo)}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <div className="flex items-center flex-wrap gap-2 mb-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeColorForType(resource.ds_tipo)}`}>
                                            {resource.ds_tipo === 'Video' ? 'Vídeo' : resource.ds_tipo}
                                        </span>

                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {resource.ds_categoria}
                                        </span>

                                        {resource.ds_permissao !== 'Todos' && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-100">
                                                {resource.ds_permissao}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-gray-900 font-medium text-lg mb-1 line-clamp-2">{resource.ds_titulo}</h3>
                                    {resource.ds_descricao && (
                                        <p className="text-gray-500 text-sm line-clamp-2 mb-3">{resource.ds_descricao}</p>
                                    )}

                                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                        <div className="flex items-center">
                                            <FolderOpen size={14} className="mr-1" />
                                            {resource.dt_data_upload ? new Date(resource.dt_data_upload).toLocaleDateString('pt-BR') : 'Data desconhecida'}
                                        </div>

                                        <div className="flex items-center text-xs text-gray-500">
                                            {resource.usuario?.nome || 'Usuário desconhecido'}
                                        </div>
                                    </div>

                                    {/* Views count if available */}
                                    {typeof resource.nr_visualizacoes !== 'undefined' && (
                                        <div className="mt-2 flex items-center text-xs text-gray-500">
                                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            {resource.nr_visualizacoes} visualizações
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <BookOpen size={28} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum recurso encontrado</h3>
                        <p className="text-gray-500 mb-4">Ajuste os filtros ou faça uma nova busca</p>
                        <button
                            onClick={clearFilters}
                            className="text-[#09A08D] font-medium hover:text-teal-700"
                        >
                            Limpar filtros
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Floating action button for mobile */}
            <FloatingActionButton
                icon={<Plus size={24} />}
                onClick={handleUploadResource}
            />
        </div>
    );
}