'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Reorder } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Upload, X } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Preto', code: '#000000' },
  { name: 'Branco', code: '#FFFFFF' },
  { name: 'Cinza', code: '#6B7280' },
  { name: 'Vermelho', code: '#DC2626' },
  { name: 'Azul', code: '#2563EB' },
  { name: 'Verde', code: '#16A34A' },
  { name: 'Amarelo', code: '#EAB308' },
  { name: 'Laranja', code: '#EA580C' },
  { name: 'Rosa', code: '#EC4899' },
  { name: 'Roxo', code: '#9333EA' },
  { name: 'Castanho', code: '#78350F' },
  { name: 'Bege', code: '#D4B896' },
  { name: 'Turquesa', code: '#14B8A6' },
  { name: 'Vinho', code: '#792F48' },
  { name: 'Salmão', code: '#D86546' },
];

const PRESET_DUAL_COLORS = [
  { name: 'Preto/Azul', code1: '#000000', code2: '#2096d7' },
  { name: 'Preto/Cinza', code1: '#000000', code2: '#6a727f' },
  { name: 'Preto/Musgo', code1: '#000000', code2: '#3b6343' },
  { name: 'Preto/Verde', code1: '#000000', code2: '#87be47' },
  { name: 'Preto/Amarelo', code1: '#000000', code2: '#d9c214' },
  { name: 'Preto/Rosa', code1: '#000000', code2: '#d2336e' },
  { name: 'Preto/Branco', code1: '#000000', code2: '#dfdfe1' },
  { name: 'Preto/Vermelho', code1: '#000000', code2: '#dc2333' },
];

const PRESET_SIZES = [
  'P',
  'M',
  'G',
  "5'10",
  "6'0",
  "6'2",
  "6'3",
  "6'4",
  "6'6",
  "6'8",
  "7'0",
  "7'2",
  "7'6",
  "8'0",
  "8'5",
  "9'0",
  "9'2",
  "9'6",
  "9'8",
  "10'0",
  "10'5",
  "11'0",
  "11'6",
  "12'6",
  "14'0",
];

function ColorBall({
  code1,
  code2,
  size = 32,
  selected = false,
  onClick,
  title,
}: {
  code1: string;
  code2?: string;
  size?: number;
  selected?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  const isDual = code2 && code2 !== code1;
  const isLight = (c: string) =>
    ['#FFFFFF', '#FFF', '#ffffff', '#fff', '#F5F5F5', '#FAFAFA'].includes(c);
  return (
    <button
      type='button'
      onClick={onClick}
      className={`rounded-full transition-all hover:scale-110 ${selected ? 'ring-2 ring-[#FF6600] ring-offset-2' : 'border-2 border-gray-300'}`}
      style={{ width: size, height: size }}
      title={title}
    >
      {isDual ? (
        <div
          className='w-full h-full rounded-full overflow-hidden'
          style={{
            background: `linear-gradient(135deg, ${code1} 50%, ${code2} 50%)`,
            border:
              isLight(code1) || isLight(code2!) ? '1px solid #d1d5db' : 'none',
          }}
        />
      ) : (
        <div
          className='w-full h-full rounded-full'
          style={{
            backgroundColor: code1,
            border: isLight(code1) ? '1px solid #d1d5db' : 'none',
          }}
        />
      )}
    </button>
  );
}

interface CategoryOption {
  _id: string;
  name: string;
  level: number;
  parent?: string | { _id: string };
}
interface BrandOption {
  _id: string;
  name: string;
}

export default function AdminProdutoEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);

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

  const [productFamily, setProductFamily] = useState('');
  const [hasColor, setHasColor] = useState(false);
  const [color, setColor] = useState('');
  const [colorCode, setColorCode] = useState('#000000');
  const [isDualColor, setIsDualColor] = useState(false);
  const [colorCode2, setColorCode2] = useState('#2563EB');
  const [hasSize, setHasSize] = useState(false);
  const [sizeValue, setSizeValue] = useState('');
  const [isMainVariant, setIsMainVariant] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, brandRes, productRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/brands'),
        fetch(`/api/products/${id}`),
      ]);
      const catData = await catRes.json();
      const brandData = await brandRes.json();
      const productData = await productRes.json();

      if (catData.success) setCategories(catData.categories);
      if (brandData.success) setBrands(brandData.brands);

      if (productData.success) {
        const p = productData.product;
        setForm({
          name: p.name || '',
          slug: p.slug || '',
          description: p.description || '',
          richDescription: p.richDescription || '',
          sku: p.sku || '',
          price: p.price || 0,
          compareAtPrice: p.compareAtPrice || 0,
          costPrice: p.costPrice || 0,
          category: p.category?._id || p.category || '',
          subcategory: p.subcategory || '',
          brand: p.brand?._id || p.brand || '',
          images: p.images || [],
          thumbnail: p.thumbnail || '',
          stock: p.stock || 0,
          weight: p.weight || 0,
          dimensions: p.dimensions || { length: 0, width: 0, height: 0 },
          tags: (p.tags || []).join(', '),
          isActive: p.isActive ?? true,
          isFeatured: p.isFeatured ?? false,
          isNewArrival: p.isNewArrival ?? false,
          isOnSale: p.isOnSale ?? false,
          salePercentage: p.salePercentage || 0,
          seoTitle: p.seoTitle || '',
          seoDescription: p.seoDescription || '',
        });

        setProductFamily(p.productFamily || '');
        setIsMainVariant(p.isMainVariant ?? true);
        if (p.color) {
          setHasColor(true);
          setColor(p.color);
          setColorCode(p.colorCode || '#000000');
          if (p.colorCode2) {
            setIsDualColor(true);
            setColorCode2(p.colorCode2);
          }
        }
        if (p.size) {
          setHasSize(true);
          setSizeValue(p.size);
        }
      } else {
        toast.error('Produto não encontrado');
        router.push('/admin/produtos');
      }
      setLoadingProduct(false);
    };
    fetchData();
  }, [id, router]);

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

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
        if (data.success) newImages.push(data.url);
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
    if (newImages.length > 0) toast.success('Imagens enviadas!');
  };

  const removeImage = (index: number) => {
    setForm(prev => {
      const ni = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: ni,
        thumbnail:
          prev.thumbnail === prev.images[index] ? ni[0] || '' : prev.thumbnail,
      };
    });
  };
  const setAsThumbnail = (url: string) => {
    setForm(prev => ({ ...prev, thumbnail: url }));
    toast.success('Thumbnail definida!');
  };
  const selectPresetColor = (p: { name: string; code: string }) => {
    setColor(p.name);
    setColorCode(p.code);
    setIsDualColor(false);
  };
  const selectPresetDualColor = (p: {
    name: string;
    code1: string;
    code2: string;
  }) => {
    setColor(p.name);
    setColorCode(p.code1);
    setColorCode2(p.code2);
    setIsDualColor(true);
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

    const familyFields: Record<string, unknown> = { isMainVariant };
    familyFields.productFamily = productFamily.trim()
      ? generateSlug(productFamily)
      : '';

    const activeColor = hasColor && color.trim();
    const activeSize = hasSize && sizeValue.trim();

    if (activeColor && activeSize) familyFields.variantType = 'both';
    else if (activeColor) familyFields.variantType = 'color';
    else if (activeSize) familyFields.variantType = 'size';
    else familyFields.variantType = '';

    if (activeColor) {
      familyFields.color = color;
      familyFields.colorCode = colorCode;
      familyFields.colorCode2 = isDualColor && colorCode2 ? colorCode2 : '';
    } else {
      familyFields.color = '';
      familyFields.colorCode = '';
      familyFields.colorCode2 = '';
    }
    familyFields.size = activeSize ? sizeValue.trim() : '';

    if (!productFamily.trim() && (activeColor || activeSize)) {
      let baseName = form.name;
      if (activeColor)
        baseName = baseName.replace(new RegExp(color, 'gi'), '').trim();
      if (activeSize) {
        const esc = sizeValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        baseName = baseName.replace(new RegExp(esc, 'gi'), '').trim();
      }
      baseName = baseName.replace(/\s*[-–—]\s*$/, '').trim();
      if (baseName) familyFields.productFamily = generateSlug(baseName);
    }

    const payload = {
      ...form,
      ...familyFields,
      tags: form.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      variants: [],
      specifications: [],
    };

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Produto atualizado!');
        router.push('/admin/produtos');
      } else toast.error(data.error || 'Erro ao atualizar');
    } catch {
      toast.error('Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  if (loadingProduct)
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#FF6600]' />
      </div>
    );

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold'>Editar Produto</h1>
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
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
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
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
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
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
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
                rows={8}
                placeholder={
                  'Escreva a descrição do produto.\nCada linha nova (Enter) será respeitada na página do produto.\n\nExemplo:\nPrancha de surf modelo Performance.\nIdeal para ondas de 1 a 2 metros.\nConstrução em EPS com resina epóxi.'
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600] font-mono text-sm leading-relaxed'
              />
              <p className='text-xs text-gray-400 mt-1'>
                💡 Dica: Use Enter para quebrar linhas. Cada Enter cria um novo
                parágrafo na página do produto.
              </p>
              {form.description && (
                <div className='mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200'>
                  <p className='text-xs font-medium text-gray-500 mb-2 uppercase'>
                    Pré-visualização:
                  </p>
                  <div className='text-sm text-gray-700 leading-relaxed whitespace-pre-line'>
                    {form.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold mb-4'>Preços</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Preço de Venda (R$) *
              </label>
              <div className='relative'>
                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400'>
                  R$
                </span>
                <input
                  type='number'
                  step='0.01'
                  min='0'
                  value={form.price || ''}
                  onChange={e =>
                    setForm({ ...form, price: parseFloat(e.target.value) || 0 })
                  }
                  required
                  placeholder='0,00'
                  className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
              <p className='text-xs text-gray-400 mt-1'>
                Preço que o cliente paga
              </p>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Preço Original (R$)
              </label>
              <div className='relative'>
                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400'>
                  R$
                </span>
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
                  placeholder='0,00'
                  className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
              <p className='text-xs text-gray-400 mt-1'>
                Riscado (opcional, para mostrar desconto)
              </p>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Custo (R$)
              </label>
              <div className='relative'>
                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400'>
                  R$
                </span>
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
                  placeholder='0,00'
                  className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
              <p className='text-xs text-gray-400 mt-1'>
                Uso interno (não visível ao cliente)
              </p>
            </div>
          </div>
          {form.price > 0 && (
            <div className='mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200'>
              <p className='text-xs font-medium text-gray-500 mb-3 uppercase'>
                Como o cliente vai ver:
              </p>
              <div className='flex items-center gap-6 flex-wrap'>
                <div>
                  {form.compareAtPrice > 0 &&
                    form.compareAtPrice > form.price && (
                      <p className='text-sm text-gray-400 line-through'>
                        de R$ {form.compareAtPrice.toFixed(2).replace('.', ',')}
                      </p>
                    )}
                  <p className='text-2xl font-black text-gray-900'>
                    R$ {form.price.toFixed(2).replace('.', ',')}
                  </p>
                  <p className='text-xs text-gray-500'>
                    10x de R$ {(form.price / 10).toFixed(2).replace('.', ',')}{' '}
                    sem juros
                  </p>
                </div>
                <div className='border-l pl-6'>
                  <p className='text-sm text-[#FF6600] font-bold'>
                    PIX / Boleto: R${' '}
                    {(form.price * 0.9).toFixed(2).replace('.', ',')}
                  </p>
                  <p className='text-xs text-green-600'>10% de desconto</p>
                </div>
                {form.costPrice > 0 && (
                  <div className='border-l pl-6'>
                    <p className='text-xs text-gray-400'>Margem</p>
                    <p className='text-sm font-bold text-gray-700'>
                      {((1 - form.costPrice / form.price) * 100).toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Category & Brand */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold mb-4'>Classificação</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Categoria *
              </label>
              <select
                value={form.category}
                onChange={e => {
                  setForm({
                    ...form,
                    category: e.target.value,
                    subcategory: '',
                  });
                }}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              >
                <option value=''>Selecionar categoria</option>
                {categories
                  .filter(cat => cat.level === 0)
                  .map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Subcategoria
              </label>
              <select
                value={form.subcategory}
                onChange={e =>
                  setForm({ ...form, subcategory: e.target.value })
                }
                disabled={!form.category}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600] disabled:bg-gray-100 disabled:cursor-not-allowed'
              >
                <option value=''>Selecionar subcategoria</option>
                {categories
                  .filter(
                    cat =>
                      cat.parent?.toString() === form.category ||
                      (cat as any).parent?._id?.toString() === form.category,
                  )
                  .map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
              {form.category &&
                categories.filter(
                  cat =>
                    cat.parent?.toString() === form.category ||
                    (cat as any).parent?._id?.toString() === form.category,
                ).length === 0 && (
                  <p className='text-xs text-gray-400 mt-1'>
                    Nenhuma subcategoria cadastrada para esta categoria
                  </p>
                )}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Marca *
              </label>
              <select
                value={form.brand}
                onChange={e => setForm({ ...form, brand: e.target.value })}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              >
                <option value=''>Selecionar marca</option>
                {brands.map(brand => (
                  <option key={brand._id} value={brand._id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='md:col-span-3'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Tags (separadas por vírgula)
              </label>
              <input
                type='text'
                value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                placeholder='surf, quilha, fcs'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold mb-1'>Imagens</h2>
          <p className='text-sm text-gray-500 mb-4'>
            Arraste para reordenar. A primeira imagem será a thumbnail
            principal.
          </p>
          <div className='mb-4'>
            <label className='flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#FF6600] hover:bg-orange-50 transition-colors'>
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
            <Reorder.Group
              axis='x'
              values={form.images}
              onReorder={newOrder => {
                setForm(prev => ({
                  ...prev,
                  images: newOrder,
                  thumbnail: newOrder[0] || '',
                }));
              }}
              className='flex flex-wrap gap-3'
            >
              {form.images.map((url, index) => (
                <Reorder.Item
                  key={url}
                  value={url}
                  className={`relative group rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing ${index === 0 ? 'border-[#FF6600]' : 'border-gray-200'}`}
                  style={{ width: 150, height: 150 }}
                  whileDrag={{
                    scale: 1.05,
                    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                    zIndex: 50,
                  }}
                >
                  <Image
                    src={url}
                    alt={`Imagem ${index + 1}`}
                    width={150}
                    height={150}
                    className='w-full h-full object-cover pointer-events-none'
                    draggable={false}
                  />
                  <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                    <button
                      type='button'
                      onClick={() => removeImage(index)}
                      className='text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600'
                    >
                      <X size={12} />
                    </button>
                  </div>
                  {index === 0 && (
                    <span className='absolute top-1 left-1 text-[10px] bg-[#FF6600] text-white px-1.5 py-0.5 rounded'>
                      Principal
                    </span>
                  )}
                  <span className='absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded'>
                    {index + 1}
                  </span>
                </Reorder.Item>
              ))}
            </Reorder.Group>
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
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Peso (g) *
              </label>
              <input
                type='number'
                min='0'
                value={form.weight || ''}
                onChange={e =>
                  setForm({ ...form, weight: parseInt(e.target.value) || 0 })
                }
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Comp. (cm)
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
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Larg. (cm)
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
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Alt. (cm)
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
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              />
            </div>
          </div>
        </div>

        {/* ═══ FAMÍLIA DE PRODUTOS ═══ */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold mb-2'>
            Família de Produtos (Variantes)
          </h2>
          <p className='text-sm text-gray-500 mb-4'>
            Defina cor e/ou tamanho deste produto.
          </p>

          <div className='mb-6'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Nome da Família
            </label>
            <input
              type='text'
              value={productFamily}
              onChange={e => setProductFamily(e.target.value)}
              placeholder='Ex: Prancha Xanadu'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
            />
            <p className='text-xs text-gray-400 mt-1'>
              Produtos com o mesmo nome de família serão agrupados
            </p>
          </div>

          {/* COR */}
          <div className='border border-gray-200 rounded-lg p-4 mb-4'>
            <div className='flex items-center gap-3 mb-4'>
              <input
                type='checkbox'
                id='hasColor'
                checked={hasColor}
                onChange={e => setHasColor(e.target.checked)}
                className='w-5 h-5 text-[#FF6600] rounded border-gray-300 focus:ring-[#FF6600] cursor-pointer'
              />
              <label
                htmlFor='hasColor'
                className='text-base font-medium cursor-pointer'
              >
                Este produto tem uma cor específica
              </label>
            </div>
            {hasColor && (
              <div className='bg-gray-50 p-4 rounded-lg space-y-4'>
                <div className='flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200'>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='colorType'
                      checked={!isDualColor}
                      onChange={() => setIsDualColor(false)}
                      className='w-4 h-4 text-[#FF6600]'
                    />
                    <span className='text-sm font-medium'>Cor Única</span>
                  </label>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='colorType'
                      checked={isDualColor}
                      onChange={() => setIsDualColor(true)}
                      className='w-4 h-4 text-[#FF6600]'
                    />
                    <span className='text-sm font-medium'>Duas Cores</span>
                  </label>
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Nome da Cor
                  </label>
                  <input
                    type='text'
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    placeholder={isDualColor ? 'Ex: Preto/Azul' : 'Ex: Preto'}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                  />
                </div>
                {!isDualColor ? (
                  <>
                    <div>
                      <label className='block text-sm font-medium mb-1'>
                        Código
                      </label>
                      <div className='flex items-center gap-3'>
                        <input
                          type='color'
                          value={colorCode}
                          onChange={e => setColorCode(e.target.value)}
                          className='w-12 h-10 rounded border border-gray-300 cursor-pointer'
                        />
                        <input
                          type='text'
                          value={colorCode}
                          onChange={e => setColorCode(e.target.value)}
                          className='flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                        />
                      </div>
                    </div>
                    <div>
                      <p className='text-sm font-medium mb-2'>Cores Rápidas:</p>
                      <div className='flex flex-wrap gap-2'>
                        {PRESET_COLORS.map((pr, i) => (
                          <ColorBall
                            key={i}
                            code1={pr.code}
                            size={32}
                            selected={colorCode === pr.code && !isDualColor}
                            onClick={() => selectPresetColor(pr)}
                            title={pr.name}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium mb-1'>
                          Cor 1
                        </label>
                        <div className='flex items-center gap-2'>
                          <input
                            type='color'
                            value={colorCode}
                            onChange={e => setColorCode(e.target.value)}
                            className='w-10 h-10 rounded border border-gray-300 cursor-pointer'
                          />
                          <input
                            type='text'
                            value={colorCode}
                            onChange={e => setColorCode(e.target.value)}
                            className='flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm'
                          />
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm font-medium mb-1'>
                          Cor 2
                        </label>
                        <div className='flex items-center gap-2'>
                          <input
                            type='color'
                            value={colorCode2}
                            onChange={e => setColorCode2(e.target.value)}
                            className='w-10 h-10 rounded border border-gray-300 cursor-pointer'
                          />
                          <input
                            type='text'
                            value={colorCode2}
                            onChange={e => setColorCode2(e.target.value)}
                            className='flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm'
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className='text-sm font-medium mb-2'>
                        Combinações Rápidas:
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        {PRESET_DUAL_COLORS.map((pr, i) => (
                          <ColorBall
                            key={i}
                            code1={pr.code1}
                            code2={pr.code2}
                            size={32}
                            selected={
                              isDualColor &&
                              colorCode === pr.code1 &&
                              colorCode2 === pr.code2
                            }
                            onClick={() => selectPresetDualColor(pr)}
                            title={pr.name}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {color && (
                  <div className='flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200'>
                    <ColorBall
                      code1={colorCode}
                      code2={isDualColor ? colorCode2 : undefined}
                      size={40}
                    />
                    <div>
                      <p className='font-medium'>{color}</p>
                      <p className='text-xs text-gray-500 font-mono'>
                        {isDualColor
                          ? `${colorCode} / ${colorCode2}`
                          : colorCode}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* TAMANHO */}
          <div className='border border-gray-200 rounded-lg p-4 mb-4'>
            <div className='flex items-center gap-3 mb-4'>
              <input
                type='checkbox'
                id='hasSize'
                checked={hasSize}
                onChange={e => setHasSize(e.target.checked)}
                className='w-5 h-5 text-[#FF6600] rounded border-gray-300 focus:ring-[#FF6600] cursor-pointer'
              />
              <label
                htmlFor='hasSize'
                className='text-base font-medium cursor-pointer'
              >
                Este produto tem um tamanho específico
              </label>
            </div>
            {hasSize && (
              <div className='bg-gray-50 p-4 rounded-lg space-y-4'>
                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Tamanho
                  </label>
                  <input
                    type='text'
                    value={sizeValue}
                    onChange={e => setSizeValue(e.target.value)}
                    placeholder="Ex: 6'0"
                    className='w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                  />
                </div>
                <div>
                  <p className='text-sm font-medium mb-2'>Tamanhos Rápidos:</p>
                  <div className='flex flex-wrap gap-2'>
                    {PRESET_SIZES.map(pr => (
                      <button
                        key={pr}
                        type='button'
                        onClick={() => setSizeValue(pr)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${sizeValue === pr ? 'bg-[#FF6600] text-white ring-2 ring-[#FF6600] ring-offset-1' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:border-gray-400'}`}
                      >
                        {pr}
                      </button>
                    ))}
                  </div>
                </div>
                {sizeValue && (
                  <div className='flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200'>
                    <span className='bg-[#FF6600] text-white text-sm font-semibold px-3 py-1.5 rounded-lg'>
                      {sizeValue}
                    </span>
                    <p className='font-medium'>Tamanho: {sizeValue}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Principal */}
          <div className='flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200'>
            <input
              type='checkbox'
              id='isMainVariant'
              checked={isMainVariant}
              onChange={e => setIsMainVariant(e.target.checked)}
              className='w-5 h-5 text-[#FF6600] rounded border-gray-300 focus:ring-[#FF6600] cursor-pointer'
            />
            <div>
              <label
                htmlFor='isMainVariant'
                className='text-sm font-medium cursor-pointer'
              >
                Produto Principal da Família
              </label>
              <p className='text-xs text-gray-600 mt-0.5'>
                Apenas um por família deve ser principal.
              </p>
            </div>
          </div>
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
              />{' '}
              Ativo
            </label>
            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={form.isFeatured}
                onChange={e =>
                  setForm({ ...form, isFeatured: e.target.checked })
                }
              />{' '}
              Destaque
            </label>
            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={form.isNewArrival}
                onChange={e =>
                  setForm({ ...form, isNewArrival: e.target.checked })
                }
              />{' '}
              Novidade
            </label>
            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={form.isOnSale}
                onChange={e => setForm({ ...form, isOnSale: e.target.checked })}
              />{' '}
              Promoção
            </label>
            {form.isOnSale && (
              <div className='flex items-center gap-2'>
                <label className='text-sm'>Desconto %</label>
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
                  className='w-20 px-2 py-1 border border-gray-300 rounded text-sm'
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
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
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
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className='flex gap-3'>
          <button
            type='submit'
            disabled={saving}
            className='px-6 py-2.5 bg-[#FF6600] text-white font-medium rounded-md hover:bg-[#e55b00] disabled:opacity-50 transition-colors'
          >
            {saving ? 'Salvando...' : 'Atualizar Produto'}
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
