'use client';

import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { Fragment, ReactNode } from 'react';

// Adicionando o tipo ModalMode
type ModalMode = 'create' | 'edit' | 'view' | undefined;

interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    showCloseButton?: boolean;
    mode?: ModalMode; // Prop para identificar o tipo do modal
    icon?: ReactNode; // Nova prop para o ícone
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

    // Define width class based on size prop
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    };

    // Define background color classes based on mode
    const getTitleBackgroundClass = () => {
        switch (mode) {
            case 'create':
                return 'bg-emerald-50 border-emerald-100';
            case 'edit':
                return 'bg-amber-50 border-amber-100';
            case 'view':
                return 'bg-blue-50 border-blue-100';
            default:
                return 'bg-white border-gray-100';
        }
    };

    // Define text color classes based on mode
    const getTitleTextClass = () => {
        switch (mode) {
            case 'create':
                return 'text-emerald-800';
            case 'edit':
                return 'text-amber-800';
            case 'view':
                return 'text-blue-800';
            default:
                return 'text-gray-800';
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 overflow-y-auto bg-black/10 backdrop-blur-sm">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Dialog.Panel
                            className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-xl bg-white p-0 text-left align-middle shadow-xl border border-gray-100 ${className}`}
                        >
                            <div className={`flex items-center justify-between px-6 py-4 border-b ${getTitleBackgroundClass()}`}>
                                <div className="flex items-center">
                                    {/* Ícone do modal */}
                                    {icon && <div className="mr-3">{icon}</div>}

                                    {/* Título do modal */}
                                    <Dialog.Title
                                        as="h3"
                                        className={`text-lg font-semibold leading-6 tracking-tight ${getTitleTextClass()}`}
                                    >
                                        {title}
                                    </Dialog.Title>
                                </div>

                                {showCloseButton && (
                                    <button
                                        type="button"
                                        className={`hover:text-gray-600 focus:outline-none transition-colors duration-200 rounded-full p-1 hover:bg-white/30 ${getTitleTextClass()}`}
                                        onClick={onClose}
                                        aria-label="Fechar"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>

                            <div className="p-6">
                                {children}
                            </div>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}