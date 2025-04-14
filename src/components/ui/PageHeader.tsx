import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    actionButton?: ReactNode;
}

export function PageHeader({ title, description, actionButton }: PageHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
        >
            <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">{title}</h1>
                {description && <p className="text-sm sm:text-base text-gray-500 mt-1">{description}</p>}
            </div>

            {actionButton && actionButton}
        </motion.div>
    );
}