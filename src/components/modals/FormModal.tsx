'use client';

import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { Fragment, ReactNode } from 'react';

interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    showCloseButton?: boolean;
}

export function FormModal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    className = '',
    showCloseButton = true,
}: FormModalProps) {

    // Define width class based on size prop
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Overlay background with blur effect */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Dialog.Panel
                            className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl border border-gray-100 ${className}`}
                        >
                            <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-semibold leading-6 text-gray-800 tracking-tight"
                                >
                                    {title}
                                </Dialog.Title>

                                {showCloseButton && (
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200 rounded-full p-1 hover:bg-gray-100"
                                        onClick={onClose}
                                        aria-label="Fechar"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>

                            <div className="mt-2">
                                {children}
                            </div>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}