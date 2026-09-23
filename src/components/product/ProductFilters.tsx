'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import Link from 'next/link';

interface Category {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null;
  level?: number;
}

interface Brand {
  _id: string;
  name: string;
  slug: string;
  /** Nº de produtos da marca na categoria atual (só vem do facets-shop) */
  count?: number;
}

interface ProductFiltersProps {
  categorySlug?: string;
  selectedBrand?: string;
  minPrice?: string;
  maxPrice?: string;
  onFilterChange: (filters: {
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => void;
  onClearFilters: () => void;
}

export default function ProductFilters({
  categorySlug,
  selectedBrand,
  minPrice,
  maxPrice,
  onFilterChange,
  onClearFilters,
}: ProductFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [showBrands, setShowBrands] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [localMinPrice, setLocalMinPrice] = useState(minPrice || '');
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice || '');

  // ═══ Categorias: sempre o catálogo completo (árvore da sidebar) ═══
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch('/api/catalog');
        const data = await res.json();
        if (data.success) setCategories(data.categories);
      } catch {
        console.error('Erro ao carregar categorias');
      }
    };
    fetchCatalog();
  }, []);

  // ═══ Marcas: contextuais à categoria atual ═══
  // Com categorySlug  → só as marcas com produtos nessa categoria
  //                     (ou nas subcategorias dela), com count real.
  // Sem categorySlug  → todas as marcas ativas (ex.: página /produtos).
  useEffect(() => {
    let cancelled = false;

    const fetchBrands = async () => {
      setBrandsLoading(true);
      try {
        const url = categorySlug
          ? `/api/products/facets-shop?categorySlug=${encodeURIComponent(categorySlug)}`
          : '/api/catalog';
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;
        setBrands(
          data.success ? (categorySlug ? data.facets.brands : data.brands) : [],
        );
      } catch {
        if (!cancelled) setBrands([]);
        console.error('Erro ao carregar marcas');
      } finally {
        if (!cancelled) setBrandsLoading(false);
      }
    };

    fetchBrands();
    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  useEffect(() => {
    setLocalMinPrice(minPrice || '');
    setLocalMaxPrice(maxPrice || '');
  }, [minPrice, maxPrice]);

  const hasActiveFilters = selectedBrand || minPrice || maxPrice;

  // A secção só aparece se houver escolha real (2+ marcas). Com uma única
  // marca o filtro não filtra nada — exceto se já estiver selecionada,
  // para o user conseguir desmarcá-la.
  const showBrandsSection =
    brandsLoading || brands.length > 1 || Boolean(selectedBrand);

  // Find current category context
  const currentCat = categories.find(c => c.slug === categorySlug);

  // Determine which categories to show in sidebar
  const getSidebarCategories = () => {
    if (!currentCat) return { parent: null, siblings: [] };

    if (currentCat.level === 0) {
      // User is on a parent category (e.g. Wetsuit)
      // Show subcategories of this parent
      const children = categories.filter(c => c.parent === currentCat._id);
      return { parent: currentCat, siblings: children };
    } else {
      // User is on a subcategory (e.g. Long John)
      // Show parent + all sibling subcategories
      const parent = categories.find(c => c._id === currentCat.parent);
      if (!parent) return { parent: null, siblings: [] };
      const siblings = categories.filter(c => c.parent === parent._id);
      return { parent, siblings };
    }
  };

  const { parent: parentCat, siblings: sidebarCategories } =
    getSidebarCategories();

  const handlePriceApply = () => {
    onFilterChange({
      minPrice: localMinPrice || undefined,
      maxPrice: localMaxPrice || undefined,
    });
  };

  return (
    <aside className='w-full'>
      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className='flex items-center gap-1 text-sm text-[#FF6600] hover:text-[#e55b00] mb-4 font-medium'
        >
          <X size={14} />
          Limpar filtros
        </button>
      )}

      {/* Categories - contextual */}
      {parentCat && sidebarCategories.length > 0 && (
        <div className='border-b border-gray-200 pb-4 mb-4'>
          <button
            onClick={() => setShowCategories(!showCategories)}
            className='flex items-center justify-between w-full text-sm font-bold text-gray-900 uppercase mb-3'
          >
            {parentCat.name}
            {showCategories ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
          {showCategories && (
            <div className='space-y-1'>
              {/* Link to parent (show all) */}
              <Link
                href={`/categoria/${parentCat.slug}`}
                className={`block w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
                  categorySlug === parentCat.slug
                    ? 'text-[#FF6600] font-semibold bg-orange-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-medium'
                }`}
              >
                Ver tudo
              </Link>
              {/* Subcategories */}
              {sidebarCategories.map(sub => (
                <Link
                  key={sub._id}
                  href={`/categoria/${sub.slug}`}
                  className={`block w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
                    categorySlug === sub.slug
                      ? 'text-[#FF6600] font-semibold bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Brands */}
      {showBrandsSection && (
        <div className='border-b border-gray-200 pb-4 mb-4'>
          <button
            onClick={() => setShowBrands(!showBrands)}
            className='flex items-center justify-between w-full text-sm font-bold text-gray-900 uppercase mb-3'
          >
            Marcas
            {showBrands ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showBrands && (
            <div className='space-y-1 max-h-48 overflow-y-auto'>
              {brandsLoading ? (
                <div className='space-y-2 py-1 px-2'>
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className='h-4 bg-gray-100 rounded animate-pulse'
                    />
                  ))}
                </div>
              ) : brands.length === 0 ? (
                <p className='text-sm text-gray-400 px-2 py-1'>
                  Nenhuma marca nesta categoria
                </p>
              ) : (
                brands.map(brand => (
                  <button
                    key={brand._id}
                    onClick={() =>
                      onFilterChange({
                        brand:
                          selectedBrand === brand._id ? undefined : brand._id,
                      })
                    }
                    className={`flex items-center justify-between gap-2 w-full text-left text-sm py-1 px-2 rounded transition-colors ${
                      selectedBrand === brand._id
                        ? 'text-[#FF6600] font-semibold bg-orange-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <span className='truncate'>{brand.name}</span>
                    {typeof brand.count === 'number' && (
                      <span className='text-xs text-gray-400 flex-shrink-0'>
                        ({brand.count})
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Price Range */}
      <div className='pb-4'>
        <button
          onClick={() => setShowPrice(!showPrice)}
          className='flex items-center justify-between w-full text-sm font-bold text-gray-900 uppercase mb-3'
        >
          Preço
          {showPrice ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showPrice && (
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                placeholder='Min'
                value={localMinPrice}
                onChange={e => setLocalMinPrice(e.target.value)}
                className='w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              />
              <span className='text-gray-400 text-sm'>—</span>
              <input
                type='number'
                placeholder='Max'
                value={localMaxPrice}
                onChange={e => setLocalMaxPrice(e.target.value)}
                className='w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              />
            </div>
            <button
              onClick={handlePriceApply}
              className='w-full py-1.5 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors'
            >
              Filtrar
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
