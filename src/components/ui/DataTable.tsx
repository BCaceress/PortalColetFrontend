import { motion } from 'framer-motion';
import { AlertCircle, UserPlus } from 'lucide-react';
import { ReactNode } from 'react';

export interface Column<T> {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    className?: string;
    cellRenderer?: (value: any, row: T) => ReactNode;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyField: keyof T;
    isLoading?: boolean;
    error?: string | null;
    emptyState?: {
        icon?: ReactNode;
        title: string;
        description?: string;
        primaryAction?: {
            label: string;
            icon?: ReactNode;
            onClick: () => void;
        };
        secondaryAction?: {
            label: string;
            onClick: () => void;
        };
    };
    rowActions?: (row: T) => ReactNode;
    onRowClick?: (row: T) => void;
    mobileCardRenderer?: (row: T) => ReactNode;
    animationEnabled?: boolean;
}

export function DataTable<T>({
    data,
    columns,
    keyField,
    isLoading = false,
    error = null,
    emptyState,
    rowActions,
    onRowClick,
    mobileCardRenderer,
    animationEnabled = true,
}: DataTableProps<T>) {
    if (isLoading) {
        return (
            <div className="p-10 sm:p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-t-2 border-b-2 border-[#09A08D] mx-auto"></div>
                <p className="mt-6 text-gray-600 font-medium">Carregando dados...</p>
            </div>
        );
    }

    if (error) {
        return (
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-10 sm:p-12 text-center flex flex-col items-center"
            >
                <AlertCircle size={44} className="text-red-500 mb-4" />
                <p className="text-red-500 font-medium">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium"
                >
                    Tentar novamente
                </button>
            </motion.div>
        );
    }

    if (data.length === 0 && emptyState) {
        return (
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-10 sm:p-12 text-center flex flex-col items-center"
            >
                {emptyState.icon || <UserPlus size={44} className="text-gray-400 mb-4" />}
                <p className="text-gray-600 font-medium">{emptyState.title}</p>
                {emptyState.description && (
                    <p className="text-gray-500 mt-2 text-sm">{emptyState.description}</p>
                )}
                {(emptyState.primaryAction || emptyState.secondaryAction) && (
                    <div className="mt-5 flex flex-col sm:flex-row gap-3">
                        {emptyState.primaryAction && (
                            <button
                                onClick={emptyState.primaryAction.onClick}
                                className="px-4 py-2 bg-[#09A08D] hover:bg-[#078275] text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
                            >
                                {emptyState.primaryAction.icon || <UserPlus size={16} />}
                                {emptyState.primaryAction.label}
                            </button>
                        )}
                        {emptyState.secondaryAction && (
                            <button
                                onClick={emptyState.secondaryAction.onClick}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                            >
                                {emptyState.secondaryAction.label}
                            </button>
                        )}
                    </div>
                )}
            </motion.div>
        );
    }

    return (
        <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    className={`px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                                >
                                    {column.header}
                                </th>
                            ))}
                            {rowActions && (
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data.map((row, rowIndex) => (
                            <motion.tr
                                key={String(row[keyField])}
                                initial={{ opacity: 0, y: 10 }}
                                animate={animationEnabled ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.2, delay: rowIndex * 0.05 }}
                                className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                onClick={() => onRowClick && onRowClick(row)}
                            >
                                {columns.map((column, colIndex) => {
                                    const cellValue = typeof column.accessor === 'function'
                                        ? column.accessor(row)
                                        : row[column.accessor];

                                    return (
                                        <td
                                            key={colIndex}
                                            className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}
                                            onClick={(e) => {
                                                // Prevent triggering row click when clicking cells with custom renderers
                                                if (column.cellRenderer) {
                                                    e.stopPropagation();
                                                }
                                            }}
                                        >
                                            {column.cellRenderer ? column.cellRenderer(cellValue, row) : cellValue as ReactNode}
                                        </td>
                                    );
                                })}

                                {rowActions && (
                                    <td
                                        className="px-6 py-4 whitespace-nowrap"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center gap-2">
                                            {rowActions(row)}
                                        </div>
                                    </td>
                                )}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-200">
                {data.map((row, index) => {
                    if (mobileCardRenderer) {
                        return (
                            <motion.div
                                key={String(row[keyField])}
                                initial={{ opacity: 0, y: 10 }}
                                animate={animationEnabled ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                onClick={() => onRowClick && onRowClick(row)}
                            >
                                {mobileCardRenderer(row)}
                            </motion.div>
                        );
                    }

                    // Default mobile rendering if no custom renderer provided
                    return (
                        <motion.div
                            key={String(row[keyField])}
                            initial={{ opacity: 0, y: 10 }}
                            animate={animationEnabled ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className={`p-4 ${onRowClick ? 'cursor-pointer' : ''}`}
                            onClick={() => onRowClick && onRowClick(row)}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium text-gray-900">
                                        {String(row[columns[0].accessor as keyof T])}
                                    </h3>
                                    {columns.length > 1 && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            {String(row[columns[1].accessor as keyof T] || "—")}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {columns.slice(2, 5).map((column, idx) => {
                                const value = typeof column.accessor === 'function'
                                    ? column.accessor(row)
                                    : row[column.accessor];

                                if (!value) return null;

                                return (
                                    <div key={idx} className="mt-3 text-sm">
                                        <strong className="text-gray-600">{column.header}:</strong>{' '}
                                        <span className="text-gray-800">
                                            {column.cellRenderer ? column.cellRenderer(value, row) : String(value)}
                                        </span>
                                    </div>
                                );
                            })}

                            {rowActions && (
                                <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end space-x-2">
                                    {rowActions(row)}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </>
    );
}