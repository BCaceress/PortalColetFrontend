'use client';

import api from '@/services/api';
import { motion } from 'framer-motion';
import { FileEdit, Info, Loader2, Save, ShieldAlert, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormModal } from './FormModal';

// Types
interface Usuario {
  id_usuario?: number;
  nome: string;
  email: string;
  funcao: string;
  fl_ativo: boolean;
}

interface UsuarioPayload {
  nome: string;
  email: string;
  funcao: string;
  senha?: string;
  fl_ativo: boolean;
}

type ModalMode = 'create' | 'edit' | 'view';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalMode: ModalMode;
  currentUser?: Usuario | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function UserFormModal({
  isOpen,
  onClose,
  modalMode,
  currentUser,
  onSuccess,
  onError
}: UserFormModalProps) {
  // Form state
  const [formData, setFormData] = useState<UsuarioPayload>({
    nome: '',
    email: '',
    funcao: 'operador',
    fl_ativo: true
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Loading state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when modal opens or user changes
  useEffect(() => {
    if (currentUser && (modalMode === 'edit' || modalMode === 'view')) {
      setFormData({
        nome: currentUser.nome,
        email: currentUser.email,
        funcao: currentUser.funcao,
        fl_ativo: currentUser.fl_ativo
      });
    } else {
      // Reset form for create mode - sempre com fl_ativo como true
      setFormData({
        nome: '',
        email: '',
        funcao: 'operador',
        senha: '',
        fl_ativo: true
      });
    }

    // Clear any previous errors
    setFormErrors({});
  }, [currentUser, modalMode, isOpen]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear validation error when user types
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      errors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'E-mail inválido';
    }

    if (modalMode === 'create' && (!formData.senha || formData.senha.length < 6)) {
      errors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Don't submit if in view mode
    if (modalMode === 'view') {
      onClose();
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (modalMode === 'create') {
        // Create new user - sempre com fl_ativo como true
        await api.post('/usuarios', formData);
        onSuccess?.('Usuário criado com sucesso!');
      } else {
        // Update existing user
        const { senha, ...updateData } = formData;
        await api.put(`/usuarios/${currentUser?.id_usuario}`,
          senha ? formData : updateData
        );
        onSuccess?.('Usuário atualizado com sucesso!');
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      onError?.(
        modalMode === 'create'
          ? 'Erro ao criar usuário. Tente novamente.'
          : 'Erro ao atualizar usuário. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal title based on mode
  const getModalTitle = (): string => {
    switch (modalMode) {
      case 'create':
        return 'Adicionar Novo Usuário';
      case 'edit':
        return 'Editar Usuário';
      case 'view':
        return 'Detalhes do Usuário';
      default:
        return 'Usuário';
    }
  };

  // Modal icon based on mode
  const getModalIcon = () => {
    switch (modalMode) {
      case 'create':
        return <UserPlus size={20} className="mr-2 text-emerald-500" />;
      case 'edit':
        return <FileEdit size={20} className="mr-2 text-amber-500" />;
      case 'view':
        return <Info size={20} className="mr-2 text-blue-500" />;
      default:
        return null;
    }
  };

  // Field style classes - different for each mode
  const getInputClasses = (fieldName: string): string => {
    const baseClasses = "w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200";

    if (formErrors[fieldName]) {
      return `${baseClasses} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`;
    } else if (modalMode === 'view') {
      return `${baseClasses} border-blue-200 bg-blue-50 text-gray-700`;
    } else if (modalMode === 'edit') {
      return `${baseClasses} border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-amber-500 focus:border-amber-500`;
    } else {
      return `${baseClasses} border-gray-300 text-gray-700 placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500`;
    }
  };

  // Color scheme based on mode for buttons
  const getPrimaryButtonStyles = (): string => {
    const baseClasses = "inline-flex items-center px-5 py-2.5 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200";

    if (isSubmitting) {
      return `${baseClasses} bg-gray-500`;
    } else if (modalMode === 'edit') {
      return `${baseClasses} bg-gradient-to-r from-amber-600 to-amber-500 hover:shadow-md focus:ring-amber-500`;
    } else {
      return `${baseClasses} bg-gradient-to-r from-emerald-600 to-emerald-500 hover:shadow-md focus:ring-emerald-500`;
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      size="md"
      mode={modalMode}
    >
      <div className="mb-6">
        <div className={`flex items-center p-4 rounded-lg mb-5 ${modalMode === 'create' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
          modalMode === 'edit' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
            'bg-blue-50 text-blue-800 border border-blue-100'
          }`}>
          {getModalIcon()}
          <p className="text-sm">
            {modalMode === 'create' && 'Preencha os campos abaixo para adicionar um novo usuário ao sistema.'}
            {modalMode === 'edit' && 'Edite as informações do usuário conforme necessário.'}
            {modalMode === 'view' && 'Visualize as informações detalhadas do usuário.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nome */}
        <div className="relative">
          <label htmlFor="nome" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
            Nome
            {modalMode === 'edit' && currentUser?.nome && formData.nome !== currentUser.nome && (
              <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Modificado</span>
            )}
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            disabled={modalMode === 'view' || isSubmitting}
            className={getInputClasses('nome')}
            placeholder="Nome completo"
          />
          {formErrors.nome && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center">
              <ShieldAlert size={16} className="mr-1" />
              {formErrors.nome}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="relative">
          <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
            E-mail
            {modalMode === 'edit' && currentUser?.email && formData.email !== currentUser.email && (
              <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Modificado</span>
            )}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={modalMode === 'view' || isSubmitting}
            className={getInputClasses('email')}
            placeholder="email@exemplo.com.br"
          />
          {formErrors.email && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center">
              <ShieldAlert size={16} className="mr-1" />
              {formErrors.email}
            </p>
          )}
        </div>

        {/* Função */}
        <div className="relative">
          <label htmlFor="funcao" className="flex items-center text-sm font-medium text-gray-700 mb-1.5">
            Função
            {modalMode === 'edit' && currentUser?.funcao && formData.funcao !== currentUser.funcao && (
              <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Modificado</span>
            )}
          </label>
          <div className="relative">
            <select
              id="funcao"
              name="funcao"
              value={formData.funcao}
              onChange={handleChange}
              disabled={modalMode === 'view' || isSubmitting}
              className={`${getInputClasses('funcao')} appearance-none pr-10`}
            >
              <option value="admin">Administrador</option>
              <option value="operador">Operador</option>
              <option value="consultor">Consultor</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Status (ativo/inativo) - apenas para edição e visualização */}
        {modalMode !== 'create' && (
          <div className="flex items-center">
            <input
              id="fl_ativo"
              name="fl_ativo"
              type="checkbox"
              checked={formData.fl_ativo}
              onChange={handleCheckboxChange}
              disabled={modalMode === 'view' || isSubmitting}
              className="h-4 w-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="fl_ativo" className="ml-2 block text-sm text-gray-700">
              Usuário ativo
            </label>
            {modalMode === 'view' && (
              <div className={`ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formData.fl_ativo
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                {formData.fl_ativo ? 'Ativo' : 'Inativo'}
              </div>
            )}
          </div>
        )}

        {/* Senha - apenas para criação ou edição */}
        {modalMode !== 'view' && (
          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1.5">
              {modalMode === 'create' ? 'Senha' : 'Nova senha (opcional)'}
            </label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={formData.senha || ''}
              onChange={handleChange}
              disabled={isSubmitting}
              className={getInputClasses('senha')}
              placeholder={modalMode === 'create' ? 'Mínimo 6 caracteres' : '••••••'}
            />
            {formErrors.senha && (
              <p className="mt-1.5 text-sm text-red-600 flex items-center">
                <ShieldAlert size={16} className="mr-1" />
                {formErrors.senha}
              </p>
            )}
            {modalMode === 'edit' && (
              <p className="mt-1.5 text-xs text-gray-500 flex items-center">
                <Info size={14} className="mr-1" />
                Deixe em branco para manter a senha atual
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-gray-100">
          {/* Cancel button */}
          <motion.button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
          >
            {modalMode === 'view' ? 'Fechar' : 'Cancelar'}
          </motion.button>

          {/* Submit button - not shown in view mode */}
          {modalMode !== 'view' && (
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={getPrimaryButtonStyles()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : modalMode === 'create' ? (
                <>
                  <UserPlus size={18} className="mr-2" />
                  <span>Adicionar</span>
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  <span>Salvar</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </form>
    </FormModal>
  );
}