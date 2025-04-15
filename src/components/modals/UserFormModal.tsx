'use client';

import api from '@/services/api';
import { SHA256 } from 'crypto-js'; // Importando a função de hash SHA256 para criptografar senhas
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
    funcao: '',
    fl_ativo: true
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Loading state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom onClose handler that resets form data and errors
  const handleClose = () => {
    // Reset to initial state if in create mode
    if (modalMode === 'create') {
      setFormData({
        nome: '',
        email: '',
        funcao: '',
        senha: '',
        fl_ativo: true
      });
    }
    // Reset validation errors
    setFormErrors({});
    // Call original onClose
    onClose();
  };

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
        funcao: '',
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

    if (!formData.funcao) {
      errors.funcao = 'Função é obrigatória';
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
      // Copiar dados do formulário para não modificar o state diretamente
      const dataToSubmit = { ...formData };

      // Criptografar a senha se ela existir
      if (dataToSubmit.senha) {
        dataToSubmit.senha = SHA256(dataToSubmit.senha).toString();
      }

      if (modalMode === 'create') {
        // Create new user - sempre com fl_ativo como true
        await api.post('/usuarios', dataToSubmit);
        onSuccess?.('Usuário criado com sucesso!');
      } else {
        // Update existing user
        const { senha, ...updateData } = dataToSubmit;
        await api.patch(`/usuarios/${currentUser?.id_usuario}`,
          senha ? dataToSubmit : updateData
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
      onClose={handleClose}
      title={getModalTitle()}
      size="xl" // Changed from "md" to "lg" to make the modal wider
      mode={modalMode}
      icon={getModalIcon()}
    >
      {modalMode === 'view' ? (
        <div className="space-y-6">
          {/* User profile card with elegant design */}
          <div className="relative bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            {/* Background pattern */}
            <div
              className="absolute top-0 right-0 w-full h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
              style={{
                backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.2) 2px, transparent 0), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.2) 2px, transparent 0)',
                backgroundSize: '100px 100px'
              }}
            />

            {/* User avatar and name */}
            <div className="relative pt-8 px-6 pb-6 flex flex-col items-center border-b border-gray-100">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-medium shadow-lg mb-4">
                {formData.nome.slice(0, 1).toUpperCase()}
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-1 text-center">{formData.nome}</h3>
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formData.funcao === 'Administrador' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                  formData.funcao === 'Analista' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                    formData.funcao === 'Desenvolvedor' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                      formData.funcao === 'Implantador' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}>
                  {formData.funcao || 'Sem função definida'}
                </span>

                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formData.fl_ativo
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                  <span className={`mr-1.5 w-2 h-2 rounded-full ${formData.fl_ativo ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                  {formData.fl_ativo ? 'Ativo' : 'Inativo'}
                </div>
              </div>
            </div>

            {/* User details with icons */}
            <div className="p-6 space-y-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">E-mail</p>
                  <p className="text-sm text-gray-900 font-semibold">{formData.email}</p>
                </div>
              </div>
            </div>
          </div>


        </div>
      ) : (
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
                disabled={isSubmitting}
                className={`${getInputClasses('funcao')} appearance-none pr-10`}
              >
                <option value="" disabled>Escolher função</option>
                <option value="Administrador">Administrador</option>
                <option value="Analista">Analista</option>
                <option value="Desenvolvedor">Desenvolvedor</option>
                <option value="Implantador">Implantador</option>
                <option value="Suporte">Suporte</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Status (ativo/inativo) - apenas para edição */}
          {modalMode === 'edit' && (
            <div className="flex items-center">
              <input
                id="fl_ativo"
                name="fl_ativo"
                type="checkbox"
                checked={formData.fl_ativo}
                onChange={handleCheckboxChange}
                disabled={isSubmitting}
                className="h-4 w-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="fl_ativo" className="ml-2 block text-sm text-gray-700">
                Usuário ativo
              </label>
            </div>
          )}

          {/* Senha - apenas para criação ou edição */}
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

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-gray-100">
            {/* Cancel button */}
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
            >
              Cancelar
            </button>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
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
            </button>
          </div>
        </form>
      )}
    </FormModal>
  );
}