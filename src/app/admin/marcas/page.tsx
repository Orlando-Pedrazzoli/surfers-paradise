'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';

interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo: string;
  isFeatured: boolean;
  order: number;
  isActive: boolean;
  productCount: number;
}

export default function AdminMarcasPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    logo: '',
    description: '',
    website: '',
    isFeatured: false,
    order: 0,
    isActive: true,
  });

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      if (data.success) setBrands(data.brands);
    } catch {
      toast.error('Erro ao carregar marcas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : generateSlug(name),
    }));
  };

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
        setForm(prev => ({ ...prev, logo: data.url }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId ? `/api/brands/${editingId}` : '/api/brands';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingId ? 'Marca atualizada!' : 'Marca criada!');
        resetForm();
        fetchBrands();
      } else {
        toast.error(data.error || 'Erro ao salvar');
      }
    } catch {
      toast.error('Erro ao salvar marca');
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingId(brand._id);
    setForm({
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      description: '',
      website: '',
      isFeatured: brand.isFeatured,
      order: brand.order,
      isActive: brand.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remover a marca "${name}"?`)) return;

    try {
      const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        toast.success('Marca removida!');
        fetchBrands();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setForm({
      name: '',
      slug: '',
      logo: '',
      description: '',
      website: '',
      isFeatured: false,
      order: 0,
      isActive: true,
    });
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600' />
      </div>
    );
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold'>Marcas</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
        >
          <Plus size={18} />
          Nova Marca
        </button>
      </div>

      {showForm && (
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <h2 className='text-lg font-semibold mb-4'>
            {editingId ? 'Editar Marca' : 'Nova Marca'}
          </h2>
          <form
            onSubmit={handleSubmit}
            className='grid grid-cols-1 md:grid-cols-2 gap-4'
          >
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Nome *
              </label>
              <input
                type='text'
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Slug
              </label>
              <input
                type='text'
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Logo
              </label>
              <input
                type='file'
                accept='image/*'
                onChange={handleLogoUpload}
                className='w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
              />
              {uploading && (
                <p className='text-sm text-blue-600 mt-1'>Enviando...</p>
              )}
              {form.logo && (
                <div className='mt-2'>
                  <Image
                    src={form.logo}
                    alt='Logo preview'
                    width={80}
                    height={40}
                    className='object-contain'
                  />
                </div>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Ordem
              </label>
              <input
                type='number'
                value={form.order}
                onChange={e =>
                  setForm({ ...form, order: parseInt(e.target.value) || 0 })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div className='flex items-center gap-4 md:col-span-2'>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='isActive'
                  checked={form.isActive}
                  onChange={e =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                <label htmlFor='isActive' className='text-sm text-gray-700'>
                  Ativa
                </label>
              </div>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='isFeatured'
                  checked={form.isFeatured}
                  onChange={e =>
                    setForm({ ...form, isFeatured: e.target.checked })
                  }
                />
                <label htmlFor='isFeatured' className='text-sm text-gray-700'>
                  Destaque (carousel)
                </label>
              </div>
            </div>

            <div className='flex gap-3 md:col-span-2'>
              <button
                type='submit'
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
              >
                {editingId ? 'Atualizar' : 'Criar'}
              </button>
              <button
                type='button'
                onClick={resetForm}
                className='px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors'
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className='bg-white rounded-lg shadow-sm'>
        {brands.length === 0 ? (
          <div className='p-12 text-center text-gray-500'>
            <Tags size={48} className='mx-auto mb-3 opacity-50' />
            <p>Nenhuma marca criada</p>
          </div>
        ) : (
          <div className='divide-y'>
            {brands.map(brand => (
              <div
                key={brand._id}
                className='flex items-center justify-between p-4 hover:bg-gray-50'
              >
                <div className='flex items-center gap-4'>
                  {brand.logo ? (
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      width={48}
                      height={28}
                      className='object-contain'
                    />
                  ) : (
                    <div className='w-12 h-7 bg-gray-100 rounded flex items-center justify-center'>
                      <Tags size={14} className='text-gray-400' />
                    </div>
                  )}
                  <div>
                    <span className='font-medium'>{brand.name}</span>
                    <span className='text-xs text-gray-400 ml-2'>
                      /{brand.slug}
                    </span>
                  </div>
                  {brand.isFeatured && (
                    <span className='text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded'>
                      Destaque
                    </span>
                  )}
                  {!brand.isActive && (
                    <span className='text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded'>
                      Inativa
                    </span>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => handleEdit(brand)}
                    className='p-2 text-gray-400 hover:text-blue-600 transition-colors'
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(brand._id, brand.name)}
                    className='p-2 text-gray-400 hover:text-red-600 transition-colors'
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
