// src/components/admin/QuickCategoryModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, FolderTree } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuickCategoryModalProps {
  onClose: () => void;
  onCreated: (newCategory: {
    _id: string;
    name: string;
    level: number;
    parent?: string;
  }) => void;
  initialName?: string;
  /** Se passado, a categoria criada será subcategoria deste parent */
  parentId?: string | null;
  /** Nome do parent (só para exibir no header) */
  parentName?: string;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function QuickCategoryModal({
  onClose,
  onCreated,
  initialName = '',
  parentId = null,
  parentName = '',
}: QuickCategoryModalProps) {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);

  const isSubcategory = !!parentId;

  // ESC fecha modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [loading, onClose]);

  const canSubmit = name.trim().length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        slug: generateSlug(name),
        description: '',
        image: '',
        parent: parentId || null,
        level: isSubcategory ? 1 : 0,
        order: 0,
        isActive: true,
        isFeatured: false,
      };

      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success && data.category) {
        toast.success(
          isSubcategory
            ? `Subcategoria "${name}" criada!`
            : `Categoria "${name}" criada!`,
        );
        onCreated({
          _id: data.category._id,
          name: data.category.name,
          level: data.category.level,
          parent: data.category.parent,
        });
      } else {
        toast.error(data.error || 'Erro ao criar categoria');
      }
    } catch {
      toast.error('Erro de rede');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4'>
      <div className='bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
        {/* HEADER */}
        <div className='flex items-center justify-between p-4 border-b'>
          <div className='flex items-center gap-2'>
            <FolderTree size={20} className='text-[#FF6600]' />
            <div>
              <h2 className='text-lg font-bold'>
                {isSubcategory ? 'Nova Subcategoria' : 'Nova Categoria'}
              </h2>
              <p className='text-xs text-gray-500'>
                {isSubcategory
                  ? `Subcategoria de "${parentName}"`
                  : 'Cria uma categoria principal sem sair do produto'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className='text-gray-400 hover:text-gray-600 disabled:opacity-50'
            type='button'
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-4 space-y-4'>
          {/* NOME */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Nome da {isSubcategory ? 'Subcategoria' : 'Categoria'} *
            </label>
            <input
              type='text'
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              placeholder={
                isSubcategory ? 'Ex: Sistema Captain Fin' : 'Ex: Pranchas Novas'
              }
              className='w-full px-3 py-2.5 border-2 border-gray-300 rounded-md focus:outline-none focus:border-[#FF6600]'
            />
            {name.trim().length > 0 && (
              <p className='text-xs text-gray-400 mt-1'>
                Slug:{' '}
                <span className='font-mono'>{generateSlug(name) || '—'}</span>
              </p>
            )}
          </div>

          {/* INFO ESTRUTURA */}
          {isSubcategory && (
            <div className='bg-orange-50 border border-orange-200 rounded-md p-2.5 text-xs text-orange-800'>
              <p>
                <strong>Estrutura:</strong> {parentName} →{' '}
                <strong>{name || '...'}</strong>
              </p>
            </div>
          )}

          {/* AVISO */}
          <div className='bg-blue-50 border border-blue-200 rounded-md p-2.5 text-xs text-blue-800'>
            <p>
              <strong>Dica:</strong> Podes editar descrição, imagem e ordem
              depois em{' '}
              <code className='bg-blue-100 px-1 rounded'>
                /admin/categorias
              </code>
              .
            </p>
          </div>

          {/* BOTÕES */}
          <div className='flex gap-2 pt-2'>
            <button
              type='button'
              onClick={onClose}
              disabled={loading}
              className='px-4 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 text-sm'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={!canSubmit || loading}
              className='flex-1 px-4 py-2.5 bg-[#FF6600] text-white font-bold rounded-md hover:bg-[#e55b00] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {loading ? (
                <>
                  <Loader2 size={16} className='animate-spin' />
                  Criando...
                </>
              ) : (
                <>
                  <FolderTree size={16} />
                  Criar e Usar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
