'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

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
}

interface ProductFiltersProps {
  selectedCategory?: string;
  selectedBrand?: string;
  minPrice?: string;
  maxPrice?: string;
  onFilterChange: (filters: {
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => void;
  onClearFilters: () => void;
}

export default function ProductFilters({
  selectedCategory,
  selectedBrand,
  minPrice,
  maxPrice,
  onFilterChange,
  onClearFilters,
}: ProductFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showCategories, setShowCategories] = useState(true);
  const [showBrands, setShowBrands] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [localMinPrice, setLocalMinPrice] = useState(minPrice || '');
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice || '');

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch('/api/catalog');
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories);
          setBrands(data.brands);
        }
      } catch {
        console.error('Erro ao carregar filtros');
      }
    };
    fetchCatalog();
  }, []);

  useEffect(() => {
    setLocalMinPrice(minPrice || '');
    setLocalMaxPrice(maxPrice || '');
  }, [minPrice, maxPrice]);

  const hasActiveFilters =
    selectedCategory || selectedBrand || minPrice || maxPrice;

  // Build category tree
  const rootCategories = categories.filter(c => !c.parent);
  const getChildren = (parentId: string) =>
    categories.filter(c => c.parent === parentId);

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

      {/* Categories */}
      <div className='border-b border-gray-200 pb-4 mb-4'>
        <button
          onClick={() => setShowCategories(!showCategories)}
          className='flex items-center justify-between w-full text-sm font-bold text-gray-900 uppercase mb-3'
        >
          Categorias
          {showCategories ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showCategories && (
          <div className='space-y-1'>
            {rootCategories.map(cat => (
              <div key={cat._id}>
                <button
                  onClick={() =>
                    onFilterChange({
                      category:
                        selectedCategory === cat._id ? undefined : cat._id,
                    })
                  }
                  className={`block w-full text-left text-sm py-1 px-2 rounded transition-colors ${
                    selectedCategory === cat._id
                      ? 'text-[#FF6600] font-semibold bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
                {/* Subcategories */}
                {getChildren(cat._id).map(sub => (
                  <button
                    key={sub._id}
                    onClick={() =>
                      onFilterChange({
                        category:
                          selectedCategory === sub._id ? undefined : sub._id,
                      })
                    }
                    className={`block w-full text-left text-sm py-1 px-4 rounded transition-colors ${
                      selectedCategory === sub._id
                        ? 'text-[#FF6600] font-semibold bg-orange-50'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Brands */}
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
            {brands.map(brand => (
              <button
                key={brand._id}
                onClick={() =>
                  onFilterChange({
                    brand: selectedBrand === brand._id ? undefined : brand._id,
                  })
                }
                className={`block w-full text-left text-sm py-1 px-2 rounded transition-colors ${
                  selectedBrand === brand._id
                    ? 'text-[#FF6600] font-semibold bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {brand.name}
              </button>
            ))}
          </div>
        )}
      </div>

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
