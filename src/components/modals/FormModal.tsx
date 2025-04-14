'use client';

import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: ModalSize;
    className?: string;
    showCloseButton?: boolean;
    mode?: 'create' | 'edit' | 'view';
    icon?: ReactNode;
}

export function FormModal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    className = '',
    showCloseButton = true,
    mode,
    icon,
}: FormModalProps) {
    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Handle modal size
    const getModalSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'max-w-sm';
            case 'md':
                return 'max-w-md';
            case 'lg':
                return 'max-w-lg';
            case 'xl':
                return 'max-w-xl';
            case '2xl':
                return 'max-w-2xl';
            case 'full':
                return 'max-w-[95%] w-full';
            default:
                return 'max-w-md';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                aria-hidden="true"
                onClick={(e) => {
                    // Evitar que o modal feche quando clicado fora (no backdrop)
                    e.stopPropagation();
                }}
            />

            {/* Modal container */}
            <div className="flex min-h-screen items-center justify-center p-4"
                onClick={(e) => {
                    e.stopPropagation();
                    // Permitir fechar o modal apenas quando não estiver na terceira etapa
                    // O indicador de modal sendo renderizado no terceiro passo seria pelo título
                    if (!title.includes('Contrato')) {
                        onClose();
                    }
                }}
            >
                {/* Modal content */}
                <div
                    className={`${getModalSizeClasses()} w-full bg-white rounded-xl shadow-xl transform transition-all ${className}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                            {icon && <div className="mr-3">{icon}</div>}
                            {title}
                        </h3>
                        {showCloseButton && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                aria-label="Fechar"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {/* Modal body */}
                    <div className="px-6 py-5">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}