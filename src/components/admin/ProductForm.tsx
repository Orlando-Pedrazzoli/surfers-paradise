// src/components/admin/ProductForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Reorder } from 'framer-motion';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  Upload,
  X,
  Store,
  Globe,
  CheckCircle2,
  Circle,
  AlertCircle,
  Plus,
} from 'lucide-react';
import QuickBrandModal from './QuickBrandModal';
import QuickCategoryModal from './QuickCategoryModal';

// ═══════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// CONSTANTES PARA QUILHAS
// ═══════════════════════════════════════════════════════════════

const QUILHAS_CATEGORY_SLUG = 'quilhas';

const SETUP_OPTIONS = [
  { value: '', label: '— Selecionar —' },
  { value: 'thruster', label: 'Thruster (3 quilhas)' },
  { value: 'twin', label: 'Twin (2 quilhas)' },
  { value: 'twin-1', label: 'Twin + 1' },
  { value: 'quad', label: 'Quad (4 quilhas)' },
  { value: 'quad-rear', label: 'Quad Rear (par traseiras)' },
  { value: '5-fin', label: 'Set 5-Fin (tri/quad)' },
  { value: 'single', label: 'Single (1 quilha)' },
];

const CONSTRUCTION_PRESETS = [
  'Performance Core',
  'PC AirCore',
  'PCC',
  'PCC AirCore',
  'Performance Glass',
  'Neo Glass',
  'Glass Flex',
  'Neo Carbon',
  'Honeycomb',
  'Techflex',
  'Alpha',
  'Vapor Core',
  'Blackstix',
  'Blackstix+',
  'Generation Series',
  'Control Series',
  'Legacy Series',
  'RTM Hex',
  'Fiberglass',
  'H4 Uni-Carbon',
  'G-10',
];

const TEMPLATE_PRESETS = [
  'Performer',
  'Carver',
  'Reactor',
  'Accelerator',
  'Rake',
  'Neutral',
  'Pivot',
  'Mayhem',
];

const PRESET_QUILHA_SIZES = ['S', 'M', 'M-L', 'L', 'XL'];

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

interface CategoryOption {
  _id: string;
  name: string;
  slug?: string;
  level: number;
  parent?: string | { _id: string };
}

interface BrandOption {
  _id: string;
  name: string;
}

interface SupplierOption {
  _id: string;
  name: string;
}

export interface ProductFormData {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  richDescription?: string;
  sku: string;
  price: number;
  compareAtPrice: number;
  costPrice: number;
  category: string | { _id: string };
  subcategory?: string | { _id: string } | null;
  brand: string | { _id: string };
  images: string[];
  thumbnail: string;
  stock: number;
  weight: number;
  dimensions: { length: number; width: number; height: number };
  tags: string[] | string;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isOnSale: boolean;
  salePercentage: number;
  seoTitle?: string;
  seoDescription?: string;
  // Family
  productFamily?: string;
  variantType?: 'color' | 'size' | 'both' | '';
  color?: string;
  colorCode?: string;
  colorCode2?: string;
  size?: string;
  isMainVariant?: boolean;
  // Unified Commerce
  isAvailableInStore?: boolean;
  isPublishedOnline?: boolean;
  completionStatus?: 'incomplete' | 'partial' | 'complete';
  // Fiscal
  gtin?: string;
  ncm?: string;
  origin?: string;
  cest?: string;
  // Supplier
  supplier?: string | { _id: string } | null;
  supplierProductCode?: string;
  // Quilhas
  setup?: string;
  construction?: string;
  template?: string;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  initialData?: ProductFormData;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return '';
}

interface CompletionCheck {
  status: 'incomplete' | 'partial' | 'complete';
  missing: string[];
  hasMinimum: boolean;
}

function evaluateCompletion(form: {
  name: string;
  sku: string;
  price: number;
  category: string;
  brand: string;
  description: string;
  images: string[];
  weight: number;
  dimensions: { length: number; width: number; height: number };
}): CompletionCheck {
  const missing: string[] = [];

  if (!form.name?.trim()) missing.push('Nome');
  if (!form.sku?.trim()) missing.push('SKU');
  if (!form.price || form.price <= 0) missing.push('Preço de venda');
  if (!form.category) missing.push('Categoria');
  if (!form.brand) missing.push('Marca');

  const hasMinimum = missing.length === 0;

  if (!form.description?.trim() || form.description.trim().length < 20) {
    missing.push('Descrição (mínimo 20 caracteres)');
  }
  if (!form.images || form.images.length === 0)
    missing.push('Pelo menos 1 imagem');
  if (!form.weight || form.weight <= 0) missing.push('Peso (gramas)');
  if (!form.dimensions?.length) missing.push('Comprimento (cm)');
  if (!form.dimensions?.width) missing.push('Largura (cm)');
  if (!form.dimensions?.height) missing.push('Altura (cm)');

  let status: 'incomplete' | 'partial' | 'complete';
  if (missing.length === 0) status = 'complete';
  else if (hasMinimum) status = 'partial';
  else status = 'incomplete';

  return { status, missing, hasMinimum };
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function ProductForm({ mode, initialData }: ProductFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    richDescription: initialData?.richDescription || '',
    sku: initialData?.sku || '',
    price: initialData?.price || 0,
    compareAtPrice: initialData?.compareAtPrice || 0,
    costPrice: initialData?.costPrice || 0,
    category: extractId(initialData?.category),
    subcategory: extractId(initialData?.subcategory),
    brand: extractId(initialData?.brand),
    images: initialData?.images || [],
    thumbnail: initialData?.thumbnail || '',
    stock: initialData?.stock || 0,
    weight: initialData?.weight || 0,
    dimensions: initialData?.dimensions || { length: 0, width: 0, height: 0 },
    tags: Array.isArray(initialData?.tags)
      ? initialData.tags.join(', ')
      : (initialData?.tags as string) || '',
    isActive: initialData?.isActive ?? true,
    isFeatured: initialData?.isFeatured ?? false,
    isNewArrival: initialData?.isNewArrival ?? false,
    isOnSale: initialData?.isOnSale ?? false,
    salePercentage: initialData?.salePercentage || 0,
    seoTitle: initialData?.seoTitle || '',
    seoDescription: initialData?.seoDescription || '',
    isAvailableInStore: initialData?.isAvailableInStore ?? true,
    isPublishedOnline: initialData?.isPublishedOnline ?? false,
    gtin: initialData?.gtin || '',
    ncm: initialData?.ncm || '',
    origin: initialData?.origin || '0',
    cest: initialData?.cest || '',
    supplier: extractId(initialData?.supplier),
    supplierProductCode: initialData?.supplierProductCode || '',
    // Quilhas
    setup: initialData?.setup || '',
    construction: initialData?.construction || '',
    template: initialData?.template || '',
  });

  // Family state
  const [productFamily, setProductFamily] = useState(
    initialData?.productFamily || '',
  );
  const [hasColor, setHasColor] = useState(!!initialData?.color);
  const [color, setColor] = useState(initialData?.color || '');
  const [colorCode, setColorCode] = useState(
    initialData?.colorCode || '#000000',
  );
  const [isDualColor, setIsDualColor] = useState(!!initialData?.colorCode2);
  const [colorCode2, setColorCode2] = useState(
    initialData?.colorCode2 || '#2563EB',
  );
  const [hasSize, setHasSize] = useState(!!initialData?.size);
  const [sizeValue, setSizeValue] = useState(initialData?.size || '');
  const [isMainVariant, setIsMainVariant] = useState(
    initialData?.isMainVariant ?? true,
  );

  const completion = evaluateCompletion(form);

  // Determinar se é uma quilha (categoria selecionada é "quilhas")
  const selectedCategory = categories.find(c => c._id === form.category);
  const isQuilha = selectedCategory?.slug === QUILHAS_CATEGORY_SLUG;

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, brandRes, supplierRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/brands'),
        fetch('/api/suppliers?isActive=true'),
      ]);
      const catData = await catRes.json();
      const brandData = await brandRes.json();
      const supplierData = await supplierRes.json();
      if (catData.success) setCategories(catData.categories);
      if (brandData.success) setBrands(brandData.brands);
      if (supplierData.success) setSuppliers(supplierData.suppliers);
    };
    fetchData();
  }, []);

  const handleBrandCreated = (newBrand: { _id: string; name: string }) => {
    setBrands(prev =>
      [...prev, newBrand].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setForm(prev => ({ ...prev, brand: newBrand._id }));
    setShowBrandModal(false);
  };

  const handleCategoryCreated = (newCategory: {
    _id: string;
    name: string;
    slug?: string;
    level: number;
    parent?: string;
  }) => {
    setCategories(prev => [...prev, newCategory as CategoryOption]);
    setForm(prev => ({
      ...prev,
      category: newCategory._id,
      subcategory: '',
    }));
    setShowCategoryModal(false);
  };

  const handleSubcategoryCreated = (newSubcategory: {
    _id: string;
    name: string;
    slug?: string;
    level: number;
    parent?: string;
  }) => {
    setCategories(prev => [...prev, newSubcategory as CategoryOption]);
    setForm(prev => ({ ...prev, subcategory: newSubcategory._id }));
    setShowSubcategoryModal(false);
  };

  const parentCategoryName =
    categories.find(c => c._id === form.category)?.name || '';

  const handleNameChange = (name: string) => {
    if (isEdit) {
      setForm(prev => ({ ...prev, name }));
    } else {
      setForm(prev => ({ ...prev, name, slug: generateSlug(name) }));
    }
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
    if (newImages.length > 0) {
      toast.success(
        `${newImages.length} imagem${newImages.length > 1 ? 'ns' : ''} enviada${newImages.length > 1 ? 's' : ''}!`,
      );
    }
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

  const togglePublishOnline = (checked: boolean) => {
    if (checked && completion.status !== 'complete') {
      toast.error(
        'Produto incompleto não pode ser publicado online. Veja o que falta no painel de status.',
      );
      return;
    }
    setForm(prev => ({ ...prev, isPublishedOnline: checked }));
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
      toast.error('Preencha os campos obrigatórios mínimos');
      return;
    }

    if (form.isPublishedOnline && completion.status !== 'complete') {
      toast.error(
        'Produto incompleto não pode ser publicado online. Desligue o toggle "Publicar no site" ou complete os dados.',
      );
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
      const url = isEdit
        ? `/api/products/${initialData?._id}`
        : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(isEdit ? 'Produto atualizado!' : 'Produto criado!');
        router.push('/admin/produtos');
      } else {
        toast.error(data.error || 'Erro ao salvar produto');
      }
    } catch {
      toast.error('Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const statusConfig = {
    complete: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      label: '🟢 COMPLETO',
      description: 'Pronto para vender em todos os canais',
    },
    partial: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      label: '🟡 PARCIAL',
      description: 'Vende no balcão. Faltam dados para publicar online.',
    },
    incomplete: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      label: '🔴 INCOMPLETO',
      description: 'Faltam dados mínimos para vender.',
    },
  };

  const currentStatus = statusConfig[completion.status];

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold'>
          {isEdit ? 'Editar Produto' : 'Novo Produto'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* STATUS */}
        <div
          className={`rounded-lg shadow-sm p-6 border-2 ${currentStatus.bg} ${currentStatus.border}`}
        >
          <div className='flex items-start justify-between gap-4 flex-wrap'>
            <div>
              <div className='flex items-center gap-3 mb-2'>
                <span className={`text-base font-bold ${currentStatus.text}`}>
                  Status: {currentStatus.label}
                </span>
              </div>
              <p className={`text-sm ${currentStatus.text}`}>
                {currentStatus.description}
              </p>
            </div>
            {completion.status !== 'complete' && (
              <div className='text-xs text-gray-600 bg-white/60 px-3 py-2 rounded-md'>
                {completion.missing.length} item
                {completion.missing.length !== 1 ? 's' : ''} pendente
                {completion.missing.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {completion.missing.length > 0 && (
            <div className='mt-4 pt-4 border-t border-gray-200'>
              <p className='text-xs font-semibold text-gray-700 uppercase mb-2'>
                O que falta:
              </p>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-1.5'>
                {completion.missing.map(item => (
                  <div
                    key={item}
                    className='flex items-center gap-2 text-sm text-gray-700'
                  >
                    <Circle size={14} className='text-gray-400 flex-shrink-0' />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CANAIS DE VENDA */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold mb-1'>Canais de Venda</h2>
          <p className='text-sm text-gray-500 mb-4'>
            Define onde este produto está disponível para venda.
          </p>

          <div className='space-y-3'>
            <label
              className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                form.isAvailableInStore
                  ? 'bg-orange-50 border-[#FF6600]'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type='checkbox'
                checked={form.isAvailableInStore}
                onChange={e =>
                  setForm({ ...form, isAvailableInStore: e.target.checked })
                }
                className='w-5 h-5 mt-0.5 text-[#FF6600] rounded border-gray-300 focus:ring-[#FF6600] cursor-pointer'
              />
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-1'>
                  <Store size={18} className='text-[#FF6600]' />
                  <span className='font-medium text-gray-900'>
                    Disponível no balcão
                  </span>
                </div>
                <p className='text-sm text-gray-600'>
                  Vende no POS da loja física. Pode estar incompleto (sem
                  imagens, descrição, etc.).
                </p>
              </div>
            </label>

            <label
              className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                form.isPublishedOnline
                  ? 'bg-blue-50 border-blue-500 cursor-pointer'
                  : completion.status === 'complete'
                    ? 'bg-gray-50 border-gray-200 hover:border-gray-300 cursor-pointer'
                    : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
              }`}
            >
              <input
                type='checkbox'
                checked={form.isPublishedOnline}
                onChange={e => togglePublishOnline(e.target.checked)}
                disabled={
                  !form.isPublishedOnline && completion.status !== 'complete'
                }
                className='w-5 h-5 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed'
              />
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-1'>
                  <Globe size={18} className='text-blue-600' />
                  <span className='font-medium text-gray-900'>
                    Publicar no site
                  </span>
                  {completion.status !== 'complete' && (
                    <span className='inline-flex items-center gap-1 text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded'>
                      <AlertCircle size={10} />
                      BLOQUEADO
                    </span>
                  )}
                </div>
                <p className='text-sm text-gray-600'>
                  Aparece no e-commerce público.{' '}
                  {completion.status !== 'complete'
                    ? 'Complete os dados pendentes acima para liberar.'
                    : 'Tudo pronto para publicação.'}
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* INFORMAÇÕES BÁSICAS */}
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
                Descrição{' '}
                <span className='text-xs text-gray-400 font-normal'>
                  (opcional para balcão, obrigatória para site — mín. 20
                  caracteres)
                </span>
              </label>
              <textarea
                value={form.description}
                onChange={e =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={8}
                placeholder={
                  'Escreva a descrição do produto.\nCada linha nova (Enter) será respeitada na página do produto.'
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600] font-mono text-sm leading-relaxed'
              />
              <p className='text-xs text-gray-400 mt-1'>
                💡 Use Enter para quebrar linhas. Cada Enter cria um novo
                parágrafo.
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

        {/* PREÇOS */}
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
                    setForm({
                      ...form,
                      price: parseFloat(e.target.value) || 0,
                    })
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

        {/* CLASSIFICAÇÃO */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold mb-4'>Classificação</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Categoria *
              </label>
              <div className='flex gap-2'>
                <select
                  value={form.category}
                  onChange={e =>
                    setForm({
                      ...form,
                      category: e.target.value,
                      subcategory: '',
                    })
                  }
                  required
                  className='flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
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
                <button
                  type='button'
                  onClick={() => setShowCategoryModal(true)}
                  title='Criar nova categoria'
                  className='shrink-0 px-3 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] transition-colors flex items-center gap-1'
                >
                  <Plus size={16} />
                  <span className='hidden sm:inline text-sm font-medium'>
                    Nova
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Subcategoria
              </label>
              <div className='flex gap-2'>
                <select
                  value={form.subcategory}
                  onChange={e =>
                    setForm({ ...form, subcategory: e.target.value })
                  }
                  disabled={!form.category}
                  className='flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600] disabled:bg-gray-100 disabled:cursor-not-allowed'
                >
                  <option value=''>Selecionar subcategoria</option>
                  {categories
                    .filter(cat => extractId(cat.parent) === form.category)
                    .map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
                <button
                  type='button'
                  onClick={() => setShowSubcategoryModal(true)}
                  disabled={!form.category}
                  title={
                    form.category
                      ? 'Criar nova subcategoria'
                      : 'Selecione uma categoria primeiro'
                  }
                  className='shrink-0 px-3 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed'
                >
                  <Plus size={16} />
                  <span className='hidden sm:inline text-sm font-medium'>
                    Nova
                  </span>
                </button>
              </div>
              {form.category &&
                categories.filter(
                  cat => extractId(cat.parent) === form.category,
                ).length === 0 && (
                  <p className='text-xs text-gray-400 mt-1'>
                    Nenhuma subcategoria cadastrada. Clica em &quot;+ Nova&quot;
                    para criar.
                  </p>
                )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Marca *
              </label>
              <div className='flex gap-2'>
                <select
                  value={form.brand}
                  onChange={e => setForm({ ...form, brand: e.target.value })}
                  required
                  className='flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                >
                  <option value=''>Selecionar marca</option>
                  {brands.map(brand => (
                    <option key={brand._id} value={brand._id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <button
                  type='button'
                  onClick={() => setShowBrandModal(true)}
                  title='Criar nova marca'
                  className='shrink-0 px-3 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] transition-colors flex items-center gap-1'
                >
                  <Plus size={16} />
                  <span className='hidden sm:inline text-sm font-medium'>
                    Nova
                  </span>
                </button>
              </div>
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

        {/* ═══════════════════════════════════════════════════════
            ATRIBUTOS DE QUILHA (condicional)
            ═══════════════════════════════════════════════════════ */}
        {isQuilha && (
          <div className='bg-white rounded-lg shadow-sm p-6 border-l-4 border-[#FF6600]'>
            <h2 className='text-lg font-semibold mb-1'>
              Atributos de Quilha 🏄
            </h2>
            <p className='text-sm text-gray-500 mb-4'>
              Estes campos aparecem nos filtros da loja. Preencha para que os
              clientes encontrem este produto.
            </p>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Setup (configuração)
                </label>
                <select
                  value={form.setup}
                  onChange={e => setForm({ ...form, setup: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                >
                  {SETUP_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className='text-xs text-gray-400 mt-1'>
                  Quantas quilhas vêm no jogo
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Construção / Material
                </label>
                <input
                  type='text'
                  list='construction-presets'
                  value={form.construction}
                  onChange={e =>
                    setForm({ ...form, construction: e.target.value })
                  }
                  placeholder='Ex: Performance Core'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
                <datalist id='construction-presets'>
                  {CONSTRUCTION_PRESETS.map(c => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <p className='text-xs text-gray-400 mt-1'>
                  Digite ou selecione (PC, PCC, Techflex, etc.)
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Template / Família
                </label>
                <input
                  type='text'
                  list='template-presets'
                  value={form.template}
                  onChange={e => setForm({ ...form, template: e.target.value })}
                  placeholder='Ex: Performer'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
                <datalist id='template-presets'>
                  {TEMPLATE_PRESETS.map(t => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                <p className='text-xs text-gray-400 mt-1'>
                  Opcional (Performer, Carver, Rake...)
                </p>
              </div>
            </div>

            <div className='mt-4 p-3 bg-blue-50 rounded-md border border-blue-100 text-sm text-blue-800'>
              💡 <strong>Dica:</strong> No campo &quot;Tamanho&quot; (mais
              abaixo, na secção Família), usa <code>S, M, M-L, L, XL</code> (com
              hífen). Tamanhos como <code>M/L</code> não funcionam nos filtros.
            </div>
          </div>
        )}

        {/* IMAGENS */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold mb-1'>Imagens</h2>
          <p className='text-sm text-gray-500 mb-4'>
            Arraste para reordenar. A primeira imagem será a thumbnail.
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

        {/* ESTOQUE & ENVIO */}
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
                Peso (g)
              </label>
              <input
                type='number'
                min='0'
                value={form.weight || ''}
                onChange={e =>
                  setForm({ ...form, weight: parseInt(e.target.value) || 0 })
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
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
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
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
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
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
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              />
            </div>
          </div>
        </div>

        {/* FAMÍLIA DE PRODUTOS */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold mb-2'>
            Família de Produtos (Variantes)
          </h2>
          <p className='text-sm text-gray-500 mb-4'>
            Defina cor e/ou tamanho deste produto. Produtos da mesma família
            permitem alternar entre variantes na página do produto.
          </p>

          <div className='mb-6'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Nome da Família
            </label>
            <input
              type='text'
              value={productFamily}
              onChange={e => setProductFamily(e.target.value)}
              placeholder='Ex: Prancha Xanadu (deixe em branco para gerar automaticamente)'
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
                      className='w-4 h-4 text-[#FF6600] focus:ring-[#FF6600]'
                    />
                    <span className='text-sm font-medium'>Cor Única</span>
                    <div className='w-5 h-5 rounded-full bg-[#FF6600]' />
                  </label>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='colorType'
                      checked={isDualColor}
                      onChange={() => setIsDualColor(true)}
                      className='w-4 h-4 text-[#FF6600] focus:ring-[#FF6600]'
                    />
                    <span className='text-sm font-medium'>Duas Cores</span>
                    <div
                      className='w-5 h-5 rounded-full'
                      style={{
                        background:
                          'linear-gradient(135deg, #000 50%, #2563EB 50%)',
                      }}
                    />
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
                        Código da Cor
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
                          placeholder='#000000'
                          className='flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                        />
                      </div>
                    </div>
                    <div>
                      <p className='text-sm font-medium mb-2'>Cores Rápidas:</p>
                      <div className='flex flex-wrap gap-2'>
                        {PRESET_COLORS.map((preset, i) => (
                          <ColorBall
                            key={i}
                            code1={preset.code}
                            size={32}
                            selected={colorCode === preset.code && !isDualColor}
                            onClick={() => selectPresetColor(preset)}
                            title={preset.name}
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
                            className='flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
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
                            className='flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className='text-sm font-medium mb-2'>
                        Combinações Rápidas:
                      </p>
                      <div className='flex flex-wrap gap-2'>
                        {PRESET_DUAL_COLORS.map((preset, i) => (
                          <ColorBall
                            key={i}
                            code1={preset.code1}
                            code2={preset.code2}
                            size={32}
                            selected={
                              isDualColor &&
                              colorCode === preset.code1 &&
                              colorCode2 === preset.code2
                            }
                            onClick={() => selectPresetDualColor(preset)}
                            title={preset.name}
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
                    placeholder={
                      isQuilha ? 'Ex: M, L, M-L, XL' : "Ex: 6'0, P, M, G"
                    }
                    className='w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                  />
                </div>
                <div>
                  <p className='text-sm font-medium mb-2'>Tamanhos Rápidos:</p>
                  <div className='flex flex-wrap gap-2'>
                    {(isQuilha ? PRESET_QUILHA_SIZES : PRESET_SIZES).map(
                      preset => (
                        <button
                          key={preset}
                          type='button'
                          onClick={() => setSizeValue(preset)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${sizeValue === preset ? 'bg-[#FF6600] text-white ring-2 ring-[#FF6600] ring-offset-1' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:border-gray-400'}`}
                        >
                          {preset}
                        </button>
                      ),
                    )}
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
                Se marcado, este produto aparece na listagem. Apenas um por
                família deve ser principal.
              </p>
            </div>
          </div>
        </div>

        {/* MARCADORES */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold mb-4'>Marcadores Especiais</h2>
          <div className='flex flex-wrap gap-6'>
            <label className='flex items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={form.isActive}
                onChange={e => setForm({ ...form, isActive: e.target.checked })}
              />
              Ativo (kill switch geral)
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
                  className='w-20 px-2 py-1 border border-gray-300 rounded text-sm'
                />
              </div>
            )}
          </div>
        </div>

        {/* FISCAL */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-semibold mb-1'>Fiscal & Fornecedor</h2>
          <p className='text-sm text-gray-500 mb-4'>
            Dados fiscais (NF-e) e fornecedor. Todos os campos são opcionais.
          </p>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                GTIN / EAN (código de barras)
              </label>
              <input
                type='text'
                value={form.gtin}
                onChange={e => setForm({ ...form, gtin: e.target.value })}
                placeholder='7908782962338'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600] font-mono text-sm'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                NCM
              </label>
              <input
                type='text'
                value={form.ncm}
                onChange={e => setForm({ ...form, ncm: e.target.value })}
                placeholder='6203.43.00'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600] font-mono text-sm'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Origem
              </label>
              <select
                value={form.origin}
                onChange={e => setForm({ ...form, origin: e.target.value })}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              >
                <option value='0'>0 — Nacional</option>
                <option value='1'>1 — Importação direta</option>
                <option value='2'>2 — Importação adquirida no Brasil</option>
                <option value='3'>3 — Nacional com importação 40-70%</option>
                <option value='4'>4 — Nacional (processo básico)</option>
                <option value='5'>5 — Nacional com importação ≤40%</option>
                <option value='6'>6 — Importação direta sem similar</option>
                <option value='7'>7 — Importação adquirida sem similar</option>
                <option value='8'>8 — Nacional com importação &gt;70%</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                CEST
              </label>
              <input
                type='text'
                value={form.cest}
                onChange={e => setForm({ ...form, cest: e.target.value })}
                placeholder='00.000.00'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600] font-mono text-sm'
              />
            </div>
          </div>

          <div className='border-t pt-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Fornecedor
                </label>
                <select
                  value={form.supplier}
                  onChange={e => setForm({ ...form, supplier: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                >
                  <option value=''>Sem fornecedor</option>
                  {suppliers.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {suppliers.length === 0 && (
                  <p className='text-xs text-gray-400 mt-1'>
                    Nenhum fornecedor cadastrado.{' '}
                    <a
                      href='/admin/fornecedores'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-[#FF6600] hover:underline'
                    >
                      Cadastrar fornecedor
                    </a>
                  </p>
                )}
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Código do produto no fornecedor
                </label>
                <input
                  type='text'
                  value={form.supplierProductCode}
                  onChange={e =>
                    setForm({ ...form, supplierProductCode: e.target.value })
                  }
                  placeholder='Ex: 08IMFL9090M'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
            </div>
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
                placeholder='Deixe vazio para usar a descrição'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              />
            </div>
          </div>
        </div>

        {/* BOTÕES */}
        <div className='flex gap-3 sticky bottom-0 bg-white p-4 -mx-6 border-t shadow-lg z-10'>
          <button
            type='submit'
            disabled={saving}
            className='px-6 py-2.5 bg-[#FF6600] text-white font-medium rounded-md hover:bg-[#e55b00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {saving
              ? 'Salvando...'
              : isEdit
                ? 'Atualizar Produto'
                : 'Criar Produto'}
          </button>
          <button
            type='button'
            onClick={() => router.push('/admin/produtos')}
            className='px-6 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors'
          >
            Cancelar
          </button>
          <div className='flex-1 flex items-center justify-end gap-2 text-sm text-gray-500'>
            {completion.status === 'complete' && (
              <span className='flex items-center gap-1.5 text-green-700'>
                <CheckCircle2 size={16} />
                Tudo pronto
              </span>
            )}
            {completion.status === 'partial' && (
              <span className='text-yellow-700'>
                Vai vender no balcão (incompleto para site)
              </span>
            )}
            {completion.status === 'incomplete' && (
              <span className='text-red-700'>
                Faltam dados mínimos para salvar
              </span>
            )}
          </div>
        </div>
      </form>

      {/* MODAIS */}
      {showBrandModal && (
        <QuickBrandModal
          onClose={() => setShowBrandModal(false)}
          onCreated={handleBrandCreated}
        />
      )}
      {showCategoryModal && (
        <QuickCategoryModal
          onClose={() => setShowCategoryModal(false)}
          onCreated={handleCategoryCreated}
          parentId={null}
        />
      )}
      {showSubcategoryModal && form.category && (
        <QuickCategoryModal
          onClose={() => setShowSubcategoryModal(false)}
          onCreated={handleSubcategoryCreated}
          parentId={form.category}
          parentName={parentCategoryName}
        />
      )}
    </div>
  );
}
