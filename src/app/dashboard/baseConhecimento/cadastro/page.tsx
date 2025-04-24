'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, File, FileVideo, Image, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Import common components
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/hooks/useAuth';

// Category options based on database schema
const CATEGORIES = [
    { value: 'Manual', label: 'Manual' },
    { value: 'Tutorial', label: 'Tutorial' },
    { value: 'Documento', label: 'Documento' },
    { value: 'Treinamento', label: 'Treinamento' },
];

// Type options based on database schema
const TYPES = [
    { value: 'Documento', label: 'Documento' },
    { value: 'Video', label: 'Vídeo' },
    { value: 'Imagem', label: 'Imagem' },
];

// Permission options based on database schema
const PERMISSIONS = [
    { value: 'Todos', label: 'Todos os usuários' },
    { value: 'Administrador', label: 'Apenas Administradores' },
    { value: 'Implantador', label: 'Apenas Implantadores' },
    { value: 'Suporte', label: 'Apenas Suporte' },
    { value: 'Analista', label: 'Apenas Analistas' },
    { value: 'Desenvolvedor', label: 'Apenas Desenvolvedores' },
];

// Interface for our form data
interface UploadForm {
    ds_titulo: string;
    ds_descricao: string;
    ds_categoria: 'Manual' | 'Tutorial' | 'Documento' | 'Treinamento';
    ds_tipo: 'Documento' | 'Video' | 'Imagem';
    ds_permissao: 'Todos' | 'Administrador' | 'Implantador' | 'Suporte' | 'Analista' | 'Desenvolvedor';
    ds_conteudo?: string;
    fl_ativo: boolean;
    arquivo?: File | null;
}

const initialFormState: UploadForm = {
    ds_titulo: '',
    ds_descricao: '',
    ds_categoria: 'Documento',
    ds_tipo: 'Documento',
    ds_permissao: 'Todos',
    ds_conteudo: '',
    fl_ativo: true,
    arquivo: null,
};

export default function CadastroBaseConhecimento() {
    const router = useRouter();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState<UploadForm>(initialFormState);
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof UploadForm, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fileDragging, setFileDragging] = useState(false);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Prevent navigation if not authenticated
    useEffect(() => {
        if (!user) {
            router.push('/');
        }
    }, [router, user]);

    // Handle file selection via input
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            handleFileSelected(file);
        }
    };

    // Handle drag and drop events
    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setFileDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setFileDragging(false);
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setFileDragging(false);

        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0];
            handleFileSelected(file);
        }
    };

    // Common file handling logic
    const handleFileSelected = (file: File) => {
        // Detect file type and update the form accordingly
        let fileType: 'Documento' | 'Video' | 'Imagem' = 'Documento';

        if (file.type.startsWith('image/')) {
            fileType = 'Imagem';
        } else if (file.type.startsWith('video/')) {
            fileType = 'Video';
        }

        // Clear any file error
        setFormErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.arquivo;
            return newErrors;
        });

        // Update form data with file and detected type
        setFormData(prev => ({
            ...prev,
            arquivo: file,
            ds_tipo: fileType
        }));

        // Create preview for images
        if (fileType === 'Imagem') {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    // Handle form field changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear validation error for this field if it exists
        if (formErrors[name as keyof UploadForm]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof UploadForm];
                return newErrors;
            });
        }
    };

    // Trigger file selection dialog
    const handleFileButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Clear selected file
    const handleRemoveFile = () => {
        setFormData(prev => ({
            ...prev,
            arquivo: null
        }));
        setFilePreview(null);

        // Reset file input so the same file can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Navigate back to the base de conhecimento listing
    const handleCancel = () => {
        router.push('/dashboard/baseConhecimento');
    };

    // Form validation
    const validateForm = (): boolean => {
        const errors: Partial<Record<keyof UploadForm, string>> = {};

        if (!formData.ds_titulo.trim()) {
            errors.ds_titulo = 'Título é obrigatório';
        }

        if (!formData.ds_descricao.trim()) {
            errors.ds_descricao = 'Descrição é obrigatória';
        }

        if (!formData.arquivo && !formData.ds_conteudo?.trim()) {
            errors.arquivo = 'É necessário fazer upload de um arquivo ou preencher o conteúdo';
            errors.ds_conteudo = 'É necessário fazer upload de um arquivo ou preencher o conteúdo';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Submit the form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // In a real implementation, you would send the file and form data to the server
            // using FormData or a separate file upload endpoint

            const formDataToSend = new FormData();

            // Add all text fields
            Object.entries(formData).forEach(([key, value]) => {
                if (key !== 'arquivo' && value !== null && value !== undefined) {
                    formDataToSend.append(key, String(value));
                }
            });

            // Add user ID from auth context
            if (user?.id) {
                formDataToSend.append('id_usuario', String(user.id));
            }

            // Add the file if present
            if (formData.arquivo) {
                formDataToSend.append('arquivo', formData.arquivo);
            }

            // Demo API call (commented out for now)
            // const response = await api.post('/base-conhecimento', formDataToSend);

            // Show success notification
            setNotification({
                message: 'Arquivo enviado com sucesso!',
                type: 'success'
            });

            // Auto-close notification after 5 seconds and redirect
            setTimeout(() => {
                router.push('/dashboard/baseConhecimento');
            }, 3000);

        } catch (error) {
            console.error('Erro ao enviar o arquivo:', error);
            setNotification({
                message: 'Ocorreu um erro ao enviar o arquivo. Tente novamente.',
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Input style helpers
    const getInputClasses = (fieldName: keyof UploadForm): string => {
        const baseClasses = "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200";

        if (isSubmitting) {
            return `${baseClasses} bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed`;
        } else if (formErrors[fieldName]) {
            return `${baseClasses} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`;
        } else {
            return `${baseClasses} border-gray-200 text-gray-700 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 bg-white`;
        }
    };

    const getSelectClasses = (fieldName: keyof UploadForm): string => {
        const baseClasses = "appearance-none w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200";

        if (isSubmitting) {
            return `${baseClasses} bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed`;
        } else if (formErrors[fieldName]) {
            return `${baseClasses} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`;
        } else {
            return `${baseClasses} border-gray-200 text-gray-700 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 bg-white`;
        }
    };

    // File drag area classes
    const getFileDragClasses = (): string => {
        let baseClasses = "border-2 border-dashed rounded-lg p-8 transition-all duration-200 flex flex-col items-center justify-center cursor-pointer";

        if (isSubmitting) {
            return `${baseClasses} bg-gray-50 border-gray-300 cursor-not-allowed`;
        } else if (formErrors.arquivo) {
            return `${baseClasses} bg-red-50 border-red-300`;
        } else if (fileDragging) {
            return `${baseClasses} bg-blue-50 border-blue-400`;
        } else {
            return `${baseClasses} bg-gray-50 border-gray-300 hover:bg-blue-50 hover:border-blue-300`;
        }
    };

    // File icon based on type
    const getFileTypeIcon = () => {
        const size = 40;
        const className = "mb-2 text-gray-400";

        if (!formData.arquivo) return <Upload size={size} className={className} />;

        switch (formData.ds_tipo) {
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

    return (
        <div className="p-1 sm:p-5 max-w-5xl mx-auto">
            {/* Page header */}
            <PageHeader
                title="Upload de Arquivo"
                description="Adicione um novo documento à Base de Conhecimento"
                actionButton={
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="bg-gray-100 text-gray-700 px-4 sm:px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-all w-full sm:w-auto justify-center font-medium"
                        onClick={handleCancel}
                    >
                        <ArrowLeft size={18} />
                        <span>Voltar</span>
                    </motion.button>
                }
            />

            {/* Notification */}
            {notification && (
                <div className={`mb-6 p-4 rounded-lg border flex items-center ${notification.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        {notification.type === 'success' ? (
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        ) : (
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        )}
                    </svg>
                    <span className="text-sm font-medium">{notification.message}</span>
                </div>
            )}

            {/* Form Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Basic Information Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                            Informações do Arquivo
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Título */}
                            <div className="relative md:col-span-2">
                                <label htmlFor="ds_titulo" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Título <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="ds_titulo"
                                    name="ds_titulo"
                                    value={formData.ds_titulo}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={getInputClasses('ds_titulo')}
                                    placeholder="Título do documento"
                                />
                                {formErrors.ds_titulo && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>{formErrors.ds_titulo}</span>
                                    </p>
                                )}
                            </div>

                            {/* Categoria */}
                            <div className="relative">
                                <label htmlFor="ds_categoria" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Categoria <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="ds_categoria"
                                        name="ds_categoria"
                                        value={formData.ds_categoria}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className={getSelectClasses('ds_categoria')}
                                    >
                                        {CATEGORIES.map(category => (
                                            <option key={category.value} value={category.value}>{category.label}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Permissão */}
                            <div className="relative">
                                <label htmlFor="ds_permissao" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Permissão <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="ds_permissao"
                                        name="ds_permissao"
                                        value={formData.ds_permissao}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className={getSelectClasses('ds_permissao')}
                                    >
                                        {PERMISSIONS.map(permission => (
                                            <option key={permission.value} value={permission.value}>{permission.label}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Descrição */}
                            <div className="relative md:col-span-2">
                                <label htmlFor="ds_descricao" className="text-sm font-medium text-gray-700 mb-1 block">
                                    Descrição <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="ds_descricao"
                                    name="ds_descricao"
                                    value={formData.ds_descricao}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className={`${getInputClasses('ds_descricao')} min-h-[100px]`}
                                    placeholder="Descreva o conteúdo deste arquivo"
                                    rows={4}
                                />
                                {formErrors.ds_descricao && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>{formErrors.ds_descricao}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                            Upload de Arquivo
                        </h2>

                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={isSubmitting}
                        />

                        {/* File Drop Area */}
                        <div className="mb-6">
                            {formData.arquivo ? (
                                <div className="border rounded-lg p-4 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            {filePreview ? (
                                                <div className="w-12 h-12 mr-3 rounded flex-shrink-0 overflow-hidden">
                                                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 mr-3 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    {getFileTypeIcon()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-800">{formData.arquivo.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {(formData.arquivo.size / (1024 * 1024)).toFixed(2)} MB · {formData.ds_tipo}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveFile}
                                            disabled={isSubmitting}
                                            className="p-1 text-gray-500 hover:text-red-500"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={handleFileButtonClick}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={getFileDragClasses()}
                                >
                                    {getFileTypeIcon()}
                                    <p className="font-medium text-gray-700 mb-1">Arraste e solte o arquivo ou clique para selecionar</p>
                                    <p className="text-sm text-gray-500">PDF, Word, Excel, PowerPoint, imagens, vídeos, até 50MB</p>
                                    {formErrors.arquivo && (
                                        <p className="mt-3 text-sm text-red-600 flex items-center">
                                            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <span>{formErrors.arquivo}</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Conteúdo (as alternative to file upload) */}
                        <div className="mb-6">
                            <label htmlFor="ds_conteudo" className="text-sm font-medium text-gray-700 mb-1 block">
                                Conteúdo <span className="text-xs text-gray-500">(alternativa ao upload de arquivo)</span>
                            </label>
                            <textarea
                                id="ds_conteudo"
                                name="ds_conteudo"
                                value={formData.ds_conteudo}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className={`${getInputClasses('ds_conteudo')} min-h-[150px]`}
                                placeholder="Ou insira diretamente o conteúdo do texto aqui, se não tiver um arquivo para fazer upload"
                                rows={6}
                            />
                            {formErrors.ds_conteudo && !formData.arquivo && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span>{formErrors.ds_conteudo}</span>
                                </p>
                            )}
                            <p className="mt-2 text-xs text-gray-500">
                                Nota: Se um arquivo for carregado, este conteúdo será ignorado.
                            </p>
                        </div>

                        {/* Status toggle */}
                        <div className="flex items-center mb-4">
                            <input
                                type="checkbox"
                                id="fl_ativo"
                                name="fl_ativo"
                                checked={formData.fl_ativo}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                            />
                            <label htmlFor="fl_ativo" className="ml-2 text-sm text-gray-700">
                                Ativo (disponível para visualização)
                            </label>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 border-t pt-6 mt-8">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 flex items-center space-x-2 ${isSubmitting
                                    ? 'bg-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <LoadingSpinner size="small" color="white" />
                                    <span>Enviando...</span>
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    <span>Publicar</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}