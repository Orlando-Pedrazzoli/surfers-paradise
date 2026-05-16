// src/components/admin/QuickBrandModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Tag, Upload } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface QuickBrandModalProps {
  onClose: () => void;
  onCreated: (newBrand: { _id: string; name: string }) => void;
  initialName?: string;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function QuickBrandModal({
  onClose,
  onCreated,
  initialName = '',
}: QuickBrandModalProps) {
  const [name, setName] = useState(initialName);
  const [logo, setLogo] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ESC fecha modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading && !uploading) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [loading, uploading, onClose]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'surfers-paradise/brands');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setLogo(data.url);
        toast.success('Logo enviado!');
      } else {
        toast.error('Erro no upload');
      }
    } catch {
      toast.error('Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = name.trim().length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        slug: generateSlug(name),
        logo,
        description: '',
        website: '',
        isFeatured: false,
        order: 0,
        isActive: true,
      };

      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success && data.brand) {
        toast.success(`Marca "${name}" criada!`);
        onCreated({ _id: data.brand._id, name: data.brand.name });
      } else {
        toast.error(data.error || 'Erro ao criar marca');
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
            <Tag size={20} className='text-[#FF6600]' />
            <div>
              <h2 className='text-lg font-bold'>Nova Marca</h2>
              <p className='text-xs text-gray-500'>
                Cadastra uma nova marca sem sair do produto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading || uploading}
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
              Nome da Marca *
            </label>
            <input
              type='text'
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              placeholder='Ex: Captain Fin'
              className='w-full px-3 py-2.5 border-2 border-gray-300 rounded-md focus:outline-none focus:border-[#FF6600]'
            />
            {name.trim().length > 0 && (
              <p className='text-xs text-gray-400 mt-1'>
                Slug:{' '}
                <span className='font-mono'>{generateSlug(name) || '—'}</span>
              </p>
            )}
          </div>

          {/* LOGO (opcional) */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Logo{' '}
              <span className='text-xs text-gray-400 font-normal'>
                (opcional, podes adicionar depois)
              </span>
            </label>
            <label className='flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#FF6600] hover:bg-orange-50 transition-colors'>
              <Upload size={18} className='text-gray-400' />
              <span className='text-sm text-gray-500'>
                {uploading ? 'Enviando...' : 'Escolher arquivo'}
              </span>
              <input
                type='file'
                accept='image/*'
                onChange={handleLogoUpload}
                disabled={uploading}
                className='hidden'
              />
            </label>
            {logo && (
              <div className='mt-3 flex items-center gap-3 p-2 bg-gray-50 rounded'>
                <Image
                  src={logo}
                  alt='Logo'
                  width={80}
                  height={40}
                  className='object-contain'
                />
                <button
                  type='button'
                  onClick={() => setLogo('')}
                  className='text-xs text-red-600 hover:underline'
                >
                  Remover
                </button>
              </div>
            )}
          </div>

          {/* AVISO */}
          <div className='bg-blue-50 border border-blue-200 rounded-md p-2.5 text-xs text-blue-800'>
            <p>
              <strong>Dica:</strong> Esta marca ficará disponível para todos os
              produtos. Podes editar logo, descrição e website depois em{' '}
              <code className='bg-blue-100 px-1 rounded'>/admin/marcas</code>.
            </p>
          </div>

          {/* BOTÕES */}
          <div className='flex gap-2 pt-2'>
            <button
              type='button'
              onClick={onClose}
              disabled={loading || uploading}
              className='px-4 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 text-sm'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={!canSubmit || loading || uploading}
              className='flex-1 px-4 py-2.5 bg-[#FF6600] text-white font-bold rounded-md hover:bg-[#e55b00] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {loading ? (
                <>
                  <Loader2 size={16} className='animate-spin' />
                  Criando...
                </>
              ) : (
                <>
                  <Tag size={16} />
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
