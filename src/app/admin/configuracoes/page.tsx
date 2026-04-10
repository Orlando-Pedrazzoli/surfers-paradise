'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Image as ImageIcon, Upload } from 'lucide-react';

interface BannerItem {
  _id: string;
  title: string;
  image: string;
  mobileImage: string;
  link: string;
  position: string;
  order: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

const POSITIONS = [
  { value: 'hero', label: 'Hero Carousel (topo)' },
  {
    value: 'mid_promo',
    label: 'Promo (meio da página — 2 banners lado a lado)',
  },
  { value: 'category', label: 'Categoria (3 banners — Deck, Leash, Capa)' },
  { value: 'brand', label: 'Marca' },
];

export default function AdminConfiguracoesPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  const [form, setForm] = useState({
    title: '',
    image: '',
    mobileImage: '',
    link: '',
    position: 'hero' as string,
    order: 0,
    isActive: true,
    startDate: '',
    endDate: '',
  });

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/banners');
      const data = await res.json();
      if (data.success) setBanners(data.banners);
    } catch {
      toast.error('Erro ao carregar banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'image' | 'mobileImage',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading =
      field === 'image' ? setUploadingDesktop : setUploadingMobile;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'surfers-paradise/banners');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setForm(prev => ({ ...prev, [field]: data.url }));
        toast.success('Imagem enviada!');
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

    if (!form.title || !form.image) {
      toast.error('Título e imagem são obrigatórios');
      return;
    }

    const payload = {
      ...form,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    };

    try {
      const url = editingId ? `/api/banners/${editingId}` : '/api/banners';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingId ? 'Banner atualizado!' : 'Banner criado!');
        resetForm();
        fetchBanners();
      } else {
        toast.error(data.error || 'Erro ao salvar');
      }
    } catch {
      toast.error('Erro ao salvar banner');
    }
  };

  const handleEdit = (banner: BannerItem) => {
    setEditingId(banner._id);
    setForm({
      title: banner.title,
      image: banner.image,
      mobileImage: banner.mobileImage || '',
      link: banner.link || '',
      position: banner.position,
      order: banner.order,
      isActive: banner.isActive,
      startDate: banner.startDate
        ? new Date(banner.startDate).toISOString().split('T')[0]
        : '',
      endDate: banner.endDate
        ? new Date(banner.endDate).toISOString().split('T')[0]
        : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Remover o banner "${title}"?`)) return;

    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        toast.success('Banner removido!');
        fetchBanners();
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
      title: '',
      image: '',
      mobileImage: '',
      link: '',
      position: 'hero',
      order: 0,
      isActive: true,
      startDate: '',
      endDate: '',
    });
  };

  const getPositionLabel = (pos: string) =>
    POSITIONS.find(p => p.value === pos)?.label || pos;

  const groupedBanners = POSITIONS.map(pos => ({
    ...pos,
    banners: banners.filter(b => b.position === pos.value),
  }));

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
        <h1 className='text-2xl font-bold'>Banners & Configurações</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
        >
          <Plus size={18} />
          Novo Banner
        </button>
      </div>

      {showForm && (
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <h2 className='text-lg font-semibold mb-4'>
            {editingId ? 'Editar Banner' : 'Novo Banner'}
          </h2>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Título *
                </label>
                <input
                  type='text'
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder='Ex: Quilhas FCS II Gabriel Medina'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Posição *
                </label>
                <select
                  value={form.position}
                  onChange={e => setForm({ ...form, position: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  {POSITIONS.map(pos => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Link (URL ao clicar)
                </label>
                <input
                  type='text'
                  value={form.link}
                  onChange={e => setForm({ ...form, link: e.target.value })}
                  placeholder='/categoria/quilhas ou URL externa'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Ordem
                </label>
                <input
                  type='number'
                  value={form.order}
                  onChange={e =>
                    setForm({
                      ...form,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            </div>

            {/* Desktop Image */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Imagem Desktop * (1920×600 recomendado)
              </label>
              <div className='flex items-start gap-4'>
                <label className='flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors'>
                  <Upload size={18} className='text-gray-400' />
                  <span className='text-sm text-gray-500'>
                    {uploadingDesktop ? 'Enviando...' : 'Upload Desktop'}
                  </span>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={e => handleImageUpload(e, 'image')}
                    disabled={uploadingDesktop}
                    className='hidden'
                  />
                </label>
                {form.image && (
                  <div className='relative'>
                    <Image
                      src={form.image}
                      alt='Desktop preview'
                      width={320}
                      height={100}
                      className='rounded-lg object-cover border'
                    />
                    <button
                      type='button'
                      onClick={() => setForm({ ...form, image: '' })}
                      className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600'
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Image */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Imagem Mobile (opcional — 768×400 recomendado)
              </label>
              <div className='flex items-start gap-4'>
                <label className='flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors'>
                  <Upload size={18} className='text-gray-400' />
                  <span className='text-sm text-gray-500'>
                    {uploadingMobile ? 'Enviando...' : 'Upload Mobile'}
                  </span>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={e => handleImageUpload(e, 'mobileImage')}
                    disabled={uploadingMobile}
                    className='hidden'
                  />
                </label>
                {form.mobileImage && (
                  <div className='relative'>
                    <Image
                      src={form.mobileImage}
                      alt='Mobile preview'
                      width={160}
                      height={100}
                      className='rounded-lg object-cover border'
                    />
                    <button
                      type='button'
                      onClick={() => setForm({ ...form, mobileImage: '' })}
                      className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600'
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Dates & Flags */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Data Início (opcional)
                </label>
                <input
                  type='date'
                  value={form.startDate}
                  onChange={e =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Data Fim (opcional)
                </label>
                <input
                  type='date'
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div className='flex items-end pb-2'>
                <label className='flex items-center gap-2 text-sm'>
                  <input
                    type='checkbox'
                    checked={form.isActive}
                    onChange={e =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                  />
                  Ativo
                </label>
              </div>
            </div>

            <div className='flex gap-3'>
              <button
                type='submit'
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
              >
                {editingId ? 'Atualizar' : 'Criar Banner'}
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

      {/* Banners grouped by position */}
      {groupedBanners.map(group => (
        <div key={group.value} className='mb-6'>
          <h2 className='text-lg font-semibold mb-3 text-gray-700'>
            {group.label}
          </h2>

          <div className='bg-white rounded-lg shadow-sm'>
            {group.banners.length === 0 ? (
              <div className='p-8 text-center text-gray-400'>
                <ImageIcon size={32} className='mx-auto mb-2 opacity-50' />
                <p className='text-sm'>Nenhum banner nesta posição</p>
              </div>
            ) : (
              <div className='divide-y'>
                {group.banners.map(banner => (
                  <div
                    key={banner._id}
                    className='flex items-center justify-between p-4 hover:bg-gray-50'
                  >
                    <div className='flex items-center gap-4'>
                      {banner.image ? (
                        <Image
                          src={banner.image}
                          alt={banner.title}
                          width={160}
                          height={50}
                          className='rounded object-cover border'
                        />
                      ) : (
                        <div className='w-40 h-12 bg-gray-100 rounded flex items-center justify-center'>
                          <ImageIcon size={16} className='text-gray-400' />
                        </div>
                      )}
                      <div>
                        <p className='font-medium'>{banner.title}</p>
                        <div className='flex items-center gap-2 mt-1'>
                          <span className='text-xs text-gray-400'>
                            Ordem: {banner.order}
                          </span>
                          {banner.link && (
                            <span className='text-xs text-gray-400'>
                              → {banner.link}
                            </span>
                          )}
                        </div>
                      </div>
                      {!banner.isActive && (
                        <span className='text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded'>
                          Inativo
                        </span>
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => handleEdit(banner)}
                        className='p-2 text-gray-400 hover:text-blue-600 transition-colors'
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(banner._id, banner.title)}
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
      ))}
    </div>
  );
}
