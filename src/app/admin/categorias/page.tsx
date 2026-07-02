'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Trash2,
  FolderTree,
  Upload,
  X,
  ImagePlus,
} from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  megaImage?: string;
  parent?: { _id: string; name: string } | string | null;
  level: number;
  order: number;
  isActive: boolean;
  productCount: number;
}

// ───── Miniatura usada na listagem ─────
function CategoryThumb({ image, name }: { image?: string; name: string }) {
  if (image) {
    return (
      <span className='relative inline-block w-8 h-8 rounded-full overflow-hidden border border-gray-200 shrink-0'>
        <Image
          src={image}
          alt={name}
          fill
          sizes='32px'
          className='object-cover'
        />
      </span>
    );
  }
  return (
    <span className='flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-[11px] font-bold text-gray-400 shrink-0'>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingMega, setUploadingMega] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    megaImage: '',
    parent: '',
    level: 0,
    order: 0,
    isActive: true,
  });

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) setCategories(data.categories);
    } catch {
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
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

  // ───── Upload da imagem (single) — mesmo padrão do ProductForm ─────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'surfers-paradise/categorias');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setForm(prev => ({ ...prev, image: data.url }));
        toast.success('Imagem enviada!');
      } else {
        toast.error(data.error || 'Erro ao enviar imagem');
      }
    } catch {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
      e.target.value = ''; // permite reenviar o mesmo ficheiro
    }
  };

  const removeImage = () => setForm(prev => ({ ...prev, image: '' }));

  // ───── Upload da imagem do MEGA-MENU (só raízes) ─────
  const handleMegaImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMega(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'surfers-paradise/categorias-mega');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setForm(prev => ({ ...prev, megaImage: data.url }));
        toast.success('Imagem do mega-menu enviada!');
      } else {
        toast.error(data.error || 'Erro ao enviar imagem');
      }
    } catch {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingMega(false);
      e.target.value = '';
    }
  };

  const removeMegaImage = () => setForm(prev => ({ ...prev, megaImage: '' }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      parent: form.parent || null,
      level: form.parent
        ? (categories.find(c => c._id === form.parent)?.level ?? 0) + 1
        : 0,
    };

    try {
      const url = editingId
        ? `/api/categories/${editingId}`
        : '/api/categories';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          editingId ? 'Categoria atualizada!' : 'Categoria criada!',
        );
        resetForm();
        fetchCategories();
      } else {
        toast.error(data.error || 'Erro ao salvar');
      }
    } catch {
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat._id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: '',
      image: cat.image || '',
      megaImage: cat.megaImage || '',
      parent:
        typeof cat.parent === 'object' && cat.parent
          ? cat.parent._id
          : (cat.parent as string) || '',
      level: cat.level,
      order: cat.order,
      isActive: cat.isActive,
    });
    setShowForm(true);
    // Leva o admin ao formulário (que está no topo) para perceber que
    // o modo de edição foi ativado.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remover a categoria "${name}"?`)) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        toast.success('Categoria removida!');
        fetchCategories();
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
      description: '',
      image: '',
      megaImage: '',
      parent: '',
      level: 0,
      order: 0,
      isActive: true,
    });
  };

  const rootCategories = categories.filter(c => c.level === 0);
  const getChildren = (parentId: string) =>
    categories.filter(
      c =>
        (typeof c.parent === 'object' && c.parent?._id === parentId) ||
        c.parent === parentId,
    );

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
        <h1 className='text-2xl font-bold'>Categorias</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className='flex items-center gap-2 px-4 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] transition-colors'
        >
          <Plus size={18} />
          Nova Categoria
        </button>
      </div>

      {showForm && (
        <div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
          <h2 className='text-lg font-semibold mb-4'>
            {editingId ? 'Editar Categoria' : 'Nova Categoria'}
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
                Categoria Pai
              </label>
              <select
                value={form.parent}
                onChange={e => setForm({ ...form, parent: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>Nenhuma (raiz)</option>
                {categories
                  .filter(c => c.level < 2)
                  .map(c => (
                    <option key={c._id} value={c._id}>
                      {'—'.repeat(c.level)} {c.name}
                    </option>
                  ))}
              </select>
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

            {/* ═══ IMAGEM DA CATEGORIA ═══ */}
            <div className='md:col-span-2'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Imagem da categoria
              </label>
              <p className='text-xs text-gray-400 mb-2'>
                Aparece nos círculos da secção &quot;Compre por categoria&quot;
                na home (subcategorias). Use uma imagem quadrada (mín.
                224×224px) para ficar nítida.
              </p>
              <div className='flex items-center gap-4'>
                {form.image ? (
                  <div className='relative w-24 h-24 rounded-full overflow-hidden border-2 border-[#FF6600] shrink-0'>
                    <Image
                      src={form.image}
                      alt='Pré-visualização'
                      fill
                      sizes='96px'
                      className='object-cover'
                    />
                  </div>
                ) : (
                  <div className='flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 text-gray-400 shrink-0'>
                    <ImagePlus size={28} />
                  </div>
                )}

                <div className='flex flex-col gap-2'>
                  <label className='inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#FF6600] hover:bg-orange-50 transition-colors text-sm text-gray-600'>
                    <Upload size={16} />
                    {uploading
                      ? 'Enviando...'
                      : form.image
                        ? 'Trocar imagem'
                        : 'Enviar imagem'}
                    <input
                      type='file'
                      accept='image/*'
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className='hidden'
                    />
                  </label>
                  {form.image && (
                    <button
                      type='button'
                      onClick={removeImage}
                      className='inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700'
                    >
                      <X size={14} />
                      Remover imagem
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ IMAGEM DO MEGA-MENU (só categorias-raiz) ═══ */}
            {!form.parent && (
              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Imagem do Mega-Menu
                  <span className='ml-2 text-xs font-normal text-gray-400'>
                    (só para categorias principais)
                  </span>
                </label>
                <p className='text-xs text-gray-400 mb-2'>
                  Aparece no painel do mega-menu da navbar, ao lado dos links.
                  Use uma imagem horizontal (~800×600px, proporção 4:3).
                </p>
                <div className='flex items-center gap-4'>
                  {form.megaImage ? (
                    <div className='relative w-40 h-28 rounded-lg overflow-hidden border-2 border-[#FF6600] shrink-0'>
                      <Image
                        src={form.megaImage}
                        alt='Pré-visualização do mega-menu'
                        fill
                        sizes='160px'
                        className='object-cover'
                      />
                    </div>
                  ) : (
                    <div className='flex items-center justify-center w-40 h-28 rounded-lg bg-gray-100 text-gray-400 shrink-0'>
                      <ImagePlus size={28} />
                    </div>
                  )}

                  <div className='flex flex-col gap-2'>
                    <label className='inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#FF6600] hover:bg-orange-50 transition-colors text-sm text-gray-600'>
                      <Upload size={16} />
                      {uploadingMega
                        ? 'Enviando...'
                        : form.megaImage
                          ? 'Trocar imagem'
                          : 'Enviar imagem'}
                      <input
                        type='file'
                        accept='image/*'
                        onChange={handleMegaImageUpload}
                        disabled={uploadingMega}
                        className='hidden'
                      />
                    </label>
                    {form.megaImage && (
                      <button
                        type='button'
                        onClick={removeMegaImage}
                        className='inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700'
                      >
                        <X size={14} />
                        Remover imagem
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className='flex items-center gap-2 md:col-span-2'>
              <input
                type='checkbox'
                id='isActive'
                checked={form.isActive}
                onChange={e => setForm({ ...form, isActive: e.target.checked })}
              />
              <label htmlFor='isActive' className='text-sm text-gray-700'>
                Ativa
              </label>
            </div>

            <div className='flex gap-3 md:col-span-2'>
              <button
                type='submit'
                disabled={uploading || uploadingMega}
                className='px-4 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
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
        {categories.length === 0 ? (
          <div className='p-12 text-center text-gray-500'>
            <FolderTree size={48} className='mx-auto mb-3 opacity-50' />
            <p>Nenhuma categoria criada</p>
          </div>
        ) : (
          <div className='divide-y'>
            {rootCategories.map(cat => (
              <div key={cat._id}>
                <div className='flex items-center justify-between p-4 hover:bg-gray-50'>
                  <div className='flex items-center gap-3'>
                    <CategoryThumb image={cat.image} name={cat.name} />
                    <span className='font-medium'>{cat.name}</span>
                    <span className='text-xs text-gray-400'>/{cat.slug}</span>
                    {!cat.isActive && (
                      <span className='text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded'>
                        Inativa
                      </span>
                    )}
                  </div>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => handleEdit(cat)}
                      className='p-2 text-gray-400 hover:text-blue-600 transition-colors'
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id, cat.name)}
                      className='p-2 text-gray-400 hover:text-red-600 transition-colors'
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {getChildren(cat._id).map(sub => (
                  <div key={sub._id}>
                    <div className='flex items-center justify-between p-4 pl-10 hover:bg-gray-50 border-l-2 border-gray-200 ml-4'>
                      <div className='flex items-center gap-3'>
                        <CategoryThumb image={sub.image} name={sub.name} />
                        <span className='text-sm'>{sub.name}</span>
                        <span className='text-xs text-gray-400'>
                          /{sub.slug}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => handleEdit(sub)}
                          className='p-2 text-gray-400 hover:text-blue-600 transition-colors'
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(sub._id, sub.name)}
                          className='p-2 text-gray-400 hover:text-red-600 transition-colors'
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {getChildren(sub._id).map(subsub => (
                      <div
                        key={subsub._id}
                        className='flex items-center justify-between p-4 pl-16 hover:bg-gray-50 border-l-2 border-gray-100 ml-8'
                      >
                        <div className='flex items-center gap-3'>
                          <CategoryThumb
                            image={subsub.image}
                            name={subsub.name}
                          />
                          <span className='text-sm text-gray-600'>
                            {subsub.name}
                          </span>
                          <span className='text-xs text-gray-400'>
                            /{subsub.slug}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <button
                            onClick={() => handleEdit(subsub)}
                            className='p-2 text-gray-400 hover:text-blue-600 transition-colors'
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(subsub._id, subsub.name)
                            }
                            className='p-2 text-gray-400 hover:text-red-600 transition-colors'
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
