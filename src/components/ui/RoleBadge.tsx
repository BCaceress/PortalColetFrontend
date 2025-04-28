import { getRoleBadgeClass } from '@/utils/roleBadge';

type RoleBadgeProps = {
    role: string | undefined;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
};

/**
 * Componente para exibir badges de função/cargo de usuário com estilo consistente
 */
export function RoleBadge({ role, className = '', size = 'md' }: RoleBadgeProps) {
    // Se nenhuma função for fornecida, não renderiza nada
    if (!role) return null;

    const sizeClasses = {
        sm: 'px-1.5 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm'
    };

    const baseClasses = 'inline-flex items-center rounded-full font-medium';
    const roleBadgeClasses = getRoleBadgeClass(role);

    return (
        <div className={`${baseClasses} ${roleBadgeClasses} ${sizeClasses[size]} ${className}`}>
            {role}
        </div>
    );
}