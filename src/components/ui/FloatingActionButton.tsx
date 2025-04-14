import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FloatingActionButtonProps {
    icon: ReactNode;
    onClick: () => void;
    className?: string;
}

export function FloatingActionButton({
    icon,
    onClick,
    className = ''
}: FloatingActionButtonProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-10 bg-gradient-to-r from-[#09A08D] to-teal-500 text-white p-3 rounded-full shadow-lg sm:hidden ${className}`}
            onClick={onClick}
        >
            {icon}
        </motion.button>
    );
}