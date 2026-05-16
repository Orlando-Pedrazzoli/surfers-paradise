// src/components/admin/QuickProductModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Zap, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import QuickBrandModal from './QuickBrandModal';
import QuickCategoryModal from './QuickCategoryModal';

interface QuickProductModalProps {
  onClose: () => void;
  onCreated: () => void;
}

interface BrandOption {
  _id: string;
  name: string;
}

interface CategoryOption {
  _id: string;
  name: string;
  level: number;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function QuickProductModal({
  onClose,
  onCreated,
}: QuickProductModalProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');

  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Modais on-the-fly
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Carregar marcas e categorias
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [brandRes, catRes] = await Promise.all([
          fetch('/api/brands'),
          fetch('/api/categories'),
        ]);
        const brandData = await brandRes.json();
        const catData = await catRes.json();
        if (brandData.success) setBrands(brandData.brands);
        if (catData.success) {
          // Só categorias raiz (level 0)
          setCategories(
            catData.categories.filter((c: CategoryOption) => c.level === 0),
          );
        }
      } catch {
        toast.error('Erro ao carregar marcas e categorias');
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  // ESC fecha modal (mas não fecha se algum modal interno estiver aberto)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        !loading &&
        !showBrandModal &&
        !showCategoryModal
      ) {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [loading, showBrandModal, showCategoryModal, onClose]);

  // Callbacks para os modais
  const handleBrandCreated = (newBrand: { _id: string; name: string }) => {
    setBrands(prev =>
      [...prev, newBrand].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setBrand(newBrand._id);
    setShowBrandModal(false);
  };

  const handleCategoryCreated = (newCategory: {
    _id: string;
    name: string;
    level: number;
  }) => {
    // Só aceita categorias raiz no QuickProductModal
    if (newCategory.level === 0) {
      setCategories(prev => [...prev, newCategory]);
      setCategory(newCategory._id);
    }
    setShowCategoryModal(false);
  };

  const priceNum = parseFloat(price.replace(',', '.')) || 0;
  const stockNum = parseInt(stock) || 0;

  const canSubmit =
    name.trim().length >= 2 &&
    sku.trim().length >= 1 &&
    priceNum > 0 &&
    brand &&
    category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      const slug = generateSlug(name) + '-' + sku.trim();

      const payload = {
        name: name.trim(),
        slug,
        sku: sku.trim(),
        description: '',
        price: priceNum,
        compareAtPrice: 0,
        costPrice: 0,
        category,
        brand,
        stock: stockNum,
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        images: [],
        thumbnail: '',
        tags: [],
        isActive: true,
        isAvailableInStore: true,
        isPublishedOnline: false,
        isMainVariant: true,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`${name} cadastrado!`);
        onCreated();
      } else {
        toast.error(data.error || 'Erro ao cadastrar produto');
      }
    } catch {
      toast.error('Erro de rede');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto'>
        {/* HEADER */}
        <div className='flex items-center justify-between p-4 border-b'>
          <div className='flex items-center gap-2'>
            <Zap size={20} className='text-[#FF6600]' />
            <div>
              <h2 className='text-lg font-bold'>Cadastro Rápido</h2>
              <p className='text-xs text-gray-500'>
                Produto entra como Parcial — completa os detalhes depois
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className='text-gray-400 hover:text-gray-600 disabled:opacity-50'
          >
            <X size={20} />
          </button>
        </div>

        {loadingOptions ? (
          <div className='p-12 flex items-center justify-center'>
            <Loader2 size={28} className='animate-spin text-[#FF6600]' />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='p-4 space-y-3'>
            {/* NOME */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Nome do Produto *
              </label>
              <input
                type='text'
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                placeholder='Ex: Quilha Futures Mayhem M'
                className='w-full px-3 py-2.5 border-2 border-gray-300 rounded-md focus:outline-none focus:border-[#FF6600]'
              />
            </div>

            {/* SKU + PREÇO + ESTOQUE em linha */}
            <div className='grid grid-cols-3 gap-2'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  SKU *
                </label>
                <input
                  type='text'
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  placeholder='Ex: 1234'
                  className='w-full px-3 py-2.5 border-2 border-gray-300 rounded-md focus:outline-none focus:border-[#FF6600] font-mono text-sm'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Preço *
                </label>
                <input
                  type='text'
                  value={price}
                  onChange={e =>
                    setPrice(e.target.value.replace(/[^\d,.]/g, ''))
                  }
                  placeholder='0,00'
                  className='w-full px-3 py-2.5 border-2 border-gray-300 rounded-md focus:outline-none focus:border-[#FF6600] font-mono text-sm'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Estoque *
                </label>
                <input
                  type='number'
                  min='0'
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  className='w-full px-3 py-2.5 border-2 border-gray-300 rounded-md focus:outline-none focus:border-[#FF6600] font-mono text-sm'
                />
              </div>
            </div>

            {/* MARCA + CATEGORIA com botões + Nova */}
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Marca *
                </label>
                <div className='flex gap-1'>
                  <select
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className='flex-1 min-w-0 px-3 py-2.5 border-2 border-gray-300 rounded-md focus:outline-none focus:border-[#FF6600] text-sm'
                  >
                    <option value=''>Selecionar...</option>
                    {brands.map(b => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type='button'
                    onClick={() => setShowBrandModal(true)}
                    title='Criar nova marca'
                    className='shrink-0 px-2.5 py-2.5 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] transition-colors'
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Categoria *
                </label>
                <div className='flex gap-1'>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className='flex-1 min-w-0 px-3 py-2.5 border-2 border-gray-300 rounded-md focus:outline-none focus:border-[#FF6600] text-sm'
                  >
                    <option value=''>Selecionar...</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type='button'
                    onClick={() => setShowCategoryModal(true)}
                    title='Criar nova categoria'
                    className='shrink-0 px-2.5 py-2.5 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] transition-colors'
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* AVISO */}
            <div className='bg-yellow-50 border border-yellow-200 rounded-md p-2.5 text-xs text-yellow-800'>
              <p>
                <strong>Modo rápido:</strong> Produto disponível para venda no
                balcão imediatamente. Para vender no site, complete depois:
                imagens, descrição, peso e dimensões.
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
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Cadastrar e usar
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          MODAIS ON-THE-FLY (sobrepostos)
          ═══════════════════════════════════════════════════════ */}
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
    </div>
  );
}
