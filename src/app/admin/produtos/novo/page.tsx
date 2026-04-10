'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Upload, X, Plus, Trash2 } from 'lucide-react';

interface CategoryOption {
  _id: string;
  name: string;
  level: number;
}

interface BrandOption {
  _id: string;
  name: string;
}

interface VariantOption {
  label: string;
  value: string;
  stock: number;
  sku: string;
}

interface Variant {
  name: string;
  options: VariantOption[];
}

interface Specification {
  key: string;
  value: string;
}

export default function AdminProdutoNovoPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    richDescription: '',
    sku: '',
    price: 0,
    compareAtPrice: 0,
    costPrice: 0,
    category: '',
    subcategory: '',
    brand: '',
    images: [] as string[],
    thumbnail: '',
    stock: 0,
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    tags: '',
    isActive: true,
    isFeatured: false,
    isNewArrival: false,
    isOnSale: false,
    salePercentage: 0,
    seoTitle: '',
    seoDescription: '',
  });

  const [variants, setVariants] = useState<Variant[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, brandRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/brands'),
      ]);
      const catData = await catRes.json();
      const brandData = await brandRes.json();
      if (catData.success) setCategories(catData.categories);
      if (brandData.success) setBrands(brandData.brands);
    };
    fetchData();
  }, []);

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const handleNameChange = (name: string) => {
    setForm(prev => ({ ...prev, name, slug: generateSlug(name) }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'surfers-paradise/products');

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          newImages.push(data.url);
        }
      } catch {
        toast.error(`Erro ao enviar ${file.name}`);
      }
    }

    setForm(prev => ({
      ...prev,
      images: [...prev.images, ...newImages],
      thumbnail: prev.thumbnail || newImages[0] || '',
    }));
    setUploading(false);

    if (newImages.length > 0) {
      toast.success(
        `${newImages.length} imagem${newImages.length > 1 ? 'ns' : ''} enviada${newImages.length > 1 ? 's' : ''}!`,
      );
    }
  };

  const removeImage = (index: number) => {
    setForm(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
        thumbnail:
          prev.thumbnail === prev.images[index]
            ? newImages[0] || ''
            : prev.thumbnail,
      };
    });
  };

  const setAsThumbnail = (url: string) => {
    setForm(prev => ({ ...prev, thumbnail: url }));
    toast.success('Thumbnail definida!');
  };

  // Variants
  const addVariant = () => {
    setVariants(prev => [
      ...prev,
      { name: '', options: [{ label: '', value: '', stock: 0, sku: '' }] },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariantName = (index: number, name: string) => {
    setVariants(prev => prev.map((v, i) => (i === index ? { ...v, name } : v)));
  };

  const addVariantOption = (variantIndex: number) => {
    setVariants(prev =>
      prev.map((v, i) =>
        i === variantIndex
          ? {
              ...v,
              options: [
                ...v.options,
                { label: '', value: '', stock: 0, sku: '' },
              ],
            }
          : v,
      ),
    );
  };

  const removeVariantOption = (variantIndex: number, optionIndex: number) => {
    setVariants(prev =>
      prev.map((v, i) =>
        i === variantIndex
          ? { ...v, options: v.options.filter((_, oi) => oi !== optionIndex) }
          : v,
      ),
    );
  };

  const updateVariantOption = (
    variantIndex: number,
    optionIndex: number,
    field: keyof VariantOption,
    value: string | number,
  ) => {
    setVariants(prev =>
      prev.map((v, i) =>
        i === variantIndex
          ? {
              ...v,
              options: v.options.map((o, oi) =>
                oi === optionIndex ? { ...o, [field]: value } : o,
              ),
            }
          : v,
      ),
    );
  };

  // Specifications
  const addSpecification = () => {
    setSpecifications(prev => [...prev, { key: '', value: '' }]);
  };

  const removeSpecification = (index: number) => {
    setSpecifications(prev => prev.filter((_, i) => i !== index));
  };

  const updateSpecification = (
    index: number,
    field: 'key' | 'value',
    value: string,
  ) => {
    setSpecifications(prev =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.sku ||
      !form.price ||
      !form.category ||
      !form.brand
    ) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setSaving(true);

    const payload = {
      ...form,
      tags: form.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      variants: variants.filter(v => v.name && v.options.length > 0),
      specifications: specifications.filter(s => s.key && s.value),
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Produto criado com sucesso!');
        router.push('/admin/produtos');
      } else {
        toast.error(data.error || 'Erro ao criar produto');
      }
    } catch {
      toast.error('Erro ao criar produto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold'>Novo Produto</h1>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Basic Info */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold mb-4'>Informações Básicas</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='md:col-span-2'>
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
                SKU *
              </label>
              <input
                type='text'
                value={form.sku}
                onChange={e => setForm({ ...form, sku: e.target.value })}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div className='md:col-span-2'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Descrição *
              </label>
              <textarea
                value={form.description}
                onChange={e =>
                  setForm({ ...form, description: e.target.value })
                }
                required
                rows={4}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold mb-4'>Preços</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Preço (R$) *
              </label>
              <input
                type='number'
                step='0.01'
                min='0'
                value={form.price || ''}
                onChange={e =>
                  setForm({ ...form, price: parseFloat(e.target.value) || 0 })
                }
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Preço Comparativo (R$)
              </label>
              <input
                type='number'
                step='0.01'
                min='0'
                value={form.compareAtPrice || ''}
                onChange={e =>
                  setForm({
                    ...form,
                    compareAtPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Custo (R$)
              </label>
              <input
                type='number'
                step='0.01'
                min='0'
                value={form.costPrice || ''}
                onChange={e =>
                  setForm({
                    ...form,
                    costPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>
        </div>

        {/* Category & Brand */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold mb-4'>Classificação</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Categoria *
              </label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>Selecionar categoria</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {'—'.repeat(cat.level)} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Marca *
              </label>
              <select
                value={form.brand}
                onChange={e => setForm({ ...form, brand: e.target.value })}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>Selecionar marca</option>
                {brands.map(brand => (
                  <option key={brand._id} value={brand._id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Tags (separadas por vírgula)
              </label>
              <input
                type='text'
                value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                placeholder='surf, quilha, fcs'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold mb-4'>Imagens</h2>

          <div className='mb-4'>
            <label className='flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors'>
              <Upload size={20} className='text-gray-400' />
              <span className='text-sm text-gray-500'>
                {uploading ? 'Enviando...' : 'Clique para enviar imagens'}
              </span>
              <input
                type='file'
                accept='image/*'
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                className='hidden'
              />
            </label>
          </div>

          {form.images.length > 0 && (
            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3'>
              {form.images.map((url, index) => (
                <div
                  key={index}
                  className={`relative group rounded-lg overflow-hidden border-2 ${
                    form.thumbnail === url
                      ? 'border-blue-500'
                      : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`Imagem ${index + 1}`}
                    width={150}
                    height={150}
                    className='w-full aspect-square object-cover'
                  />
                  <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                    <button
                      type='button'
                      onClick={() => setAsThumbnail(url)}
                      className='text-xs bg-white text-gray-800 px-2 py-1 rounded hover:bg-blue-100'
                    >
                      Thumb
                    </button>
                    <button
                      type='button'
                      onClick={() => removeImage(index)}
                      className='text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600'
                    >
                      <X size={12} />
                    </button>
                  </div>
                  {form.thumbnail === url && (
                    <span className='absolute top-1 left-1 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded'>
                      Thumb
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock & Shipping */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold mb-4'>Estoque & Envio</h2>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Estoque *
              </label>
              <input
                type='number'
                min='0'
                value={form.stock || ''}
                onChange={e =>
                  setForm({ ...form, stock: parseInt(e.target.value) || 0 })
                }
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Peso (gramas) *
              </label>
              <input
                type='number'
                min='0'
                value={form.weight || ''}
                onChange={e =>
                  setForm({ ...form, weight: parseInt(e.target.value) || 0 })
                }
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Comprimento (cm)
              </label>
              <input
                type='number'
                min='0'
                value={form.dimensions.length || ''}
                onChange={e =>
                  setForm({
                    ...form,
                    dimensions: {
                      ...form.dimensions,
                      length: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Largura (cm)
              </label>
              <input
                type='number'
                min='0'
                value={form.dimensions.width || ''}
                onChange={e =>
                  setForm({
                    ...form,
                    dimensions: {
                      ...form.dimensions,
                      width: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Altura (cm)
              </label>
              <input
                type='number'
                min='0'
                value={form.dimensions.height || ''}
                onChange={e =>
                  setForm({
                    ...form,
                    dimensions: {
                      ...form.dimensions,
                      height: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold'>Variantes</h2>
            <button
              type='button'
              onClick={addVariant}
              className='flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700'
            >
              <Plus size={16} />
              Adicionar Variante
            </button>
          </div>

          {variants.length === 0 && (
            <p className='text-sm text-gray-400'>
              Nenhuma variante adicionada (ex: Tamanho, Cor)
            </p>
          )}

          {variants.map((variant, vi) => (
            <div key={vi} className='border rounded-lg p-4 mb-4'>
              <div className='flex items-center gap-3 mb-3'>
                <input
                  type='text'
                  value={variant.name}
                  onChange={e => updateVariantName(vi, e.target.value)}
                  placeholder='Nome da variante (ex: Tamanho)'
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                />
                <button
                  type='button'
                  onClick={() => removeVariant(vi)}
                  className='p-2 text-red-500 hover:text-red-700'
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {variant.options.map((opt, oi) => (
                <div key={oi} className='grid grid-cols-5 gap-2 mb-2'>
                  <input
                    type='text'
                    value={opt.label}
                    onChange={e =>
                      updateVariantOption(vi, oi, 'label', e.target.value)
                    }
                    placeholder='Label (M)'
                    className='px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                  <input
                    type='text'
                    value={opt.value}
                    onChange={e =>
                      updateVariantOption(vi, oi, 'value', e.target.value)
                    }
                    placeholder='Valor (m)'
                    className='px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                  <input
                    type='number'
                    value={opt.stock || ''}
                    onChange={e =>
                      updateVariantOption(
                        vi,
                        oi,
                        'stock',
                        parseInt(e.target.value) || 0,
                      )
                    }
                    placeholder='Estoque'
                    className='px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                  <input
                    type='text'
                    value={opt.sku}
                    onChange={e =>
                      updateVariantOption(vi, oi, 'sku', e.target.value)
                    }
                    placeholder='SKU'
                    className='px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                  <button
                    type='button'
                    onClick={() => removeVariantOption(vi, oi)}
                    className='p-1.5 text-red-400 hover:text-red-600 justify-self-center'
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              <button
                type='button'
                onClick={() => addVariantOption(vi)}
                className='text-xs text-blue-600 hover:text-blue-700 mt-1'
              >
                + Adicionar opção
              </button>
            </div>
          ))}
        </div>

        {/* Specifications */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold'>Especificações</h2>
            <button
              type='button'
              onClick={addSpecification}
              className='flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700'
            >
              <Plus size={16} />
              Adicionar
            </button>
          </div>

          {specifications.length === 0 && (
            <p className='text-sm text-gray-400'>
              Nenhuma especificação (ex: Material, Sistema de Quilha)
            </p>
          )}

          {specifications.map((spec, i) => (
            <div key={i} className='grid grid-cols-5 gap-2 mb-2'>
              <input
                type='text'
                value={spec.key}
                onChange={e => updateSpecification(i, 'key', e.target.value)}
                placeholder='Chave (Material)'
                className='col-span-2 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              <input
                type='text'
                value={spec.value}
                onChange={e => updateSpecification(i, 'value', e.target.value)}
                placeholder='Valor (Fibra de Carbono)'
                className='col-span-2 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              <button
                type='button'
                onClick={() => removeSpecification(i)}
                className='p-1.5 text-red-400 hover:text-red-600 justify-self-center'
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Flags */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold mb-4'>Visibilidade</h2>
          <div className='flex flex-wrap gap-6'>
            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={form.isActive}
                onChange={e => setForm({ ...form, isActive: e.target.checked })}
              />
              Ativo
            </label>
            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={form.isFeatured}
                onChange={e =>
                  setForm({ ...form, isFeatured: e.target.checked })
                }
              />
              Destaque
            </label>
            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={form.isNewArrival}
                onChange={e =>
                  setForm({ ...form, isNewArrival: e.target.checked })
                }
              />
              Novidade
            </label>
            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={form.isOnSale}
                onChange={e => setForm({ ...form, isOnSale: e.target.checked })}
              />
              Em Promoção
            </label>
            {form.isOnSale && (
              <div className='flex items-center gap-2'>
                <label className='text-sm text-gray-700'>Desconto %</label>
                <input
                  type='number'
                  min='0'
                  max='100'
                  value={form.salePercentage || ''}
                  onChange={e =>
                    setForm({
                      ...form,
                      salePercentage: parseInt(e.target.value) || 0,
                    })
                  }
                  className='w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            )}
          </div>
        </div>

        {/* SEO */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold mb-4'>SEO</h2>
          <div className='grid grid-cols-1 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Título SEO
              </label>
              <input
                type='text'
                value={form.seoTitle}
                onChange={e => setForm({ ...form, seoTitle: e.target.value })}
                placeholder='Deixe vazio para usar o nome do produto'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Descrição SEO
              </label>
              <textarea
                value={form.seoDescription}
                onChange={e =>
                  setForm({ ...form, seoDescription: e.target.value })
                }
                rows={2}
                placeholder='Deixe vazio para usar a descrição do produto'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className='flex gap-3'>
          <button
            type='submit'
            disabled={saving}
            className='px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {saving ? 'Salvando...' : 'Criar Produto'}
          </button>
          <button
            type='button'
            onClick={() => router.push('/admin/produtos')}
            className='px-6 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors'
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
