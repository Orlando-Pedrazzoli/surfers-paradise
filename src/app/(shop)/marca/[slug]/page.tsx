'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
import ProductSort from '@/components/product/ProductSort';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  thumbnail?: string;
  isOnSale?: boolean;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  salePercentage?: number;
  productFamily?: string;
  variantType?: 'color' | 'size' | 'both';
  color?: string;
  colorCode?: string;
  colorCode2?: string;
  size?: string;
  isMainVariant?: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface BrandInfo {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
}

interface CategoryInfo {
  _id: string;
  name: string;
  slug: string;
  parent?: string | null;
  level?: number;
}

export default function MarcaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [brandInfo, setBrandInfo] = useState<BrandInfo | null>(null);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const page = searchParams.get('page') || '1';
  const sort = searchParams.get('sort') || '-createdAt';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  // Fetch brand info + categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/catalog');
        const data = await res.json();
        if (data.success) {
          const brand = data.brands.find((b: BrandInfo) => b.slug === slug);
          if (brand) setBrandInfo(brand);
          setCategories(data.categories || []);
        }
      } catch {
        console.error('Erro ao carregar marca');
      }
    };
    fetchData();
  }, [slug]);

  const fetchProducts = useCallback(async () => {
    if (!brandInfo) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: '20',
        sort,
        isActive: 'true',
        brand: brandInfo._id,
      });
      if (category) params.set('category', category);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        setPagination(data.pagination);
      }
    } catch {
      console.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [page, sort, brandInfo, category, minPrice, maxPrice]);

  useEffect(() => {
    if (brandInfo) fetchProducts();
  }, [brandInfo, fetchProducts]);

  const basePath = `/marca/${slug}`;

  const updateParams = (updates: Record<string, string | undefined>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) p.set(key, value);
      else p.delete(key);
    });
    p.delete('page');
    router.push(`${basePath}?${p.toString()}`);
  };

  const handleSortChange = (newSort: string) => {
    updateParams({ sort: newSort });
  };

  const handlePageChange = (newPage: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set('page', newPage.toString());
    router.push(`${basePath}?${p.toString()}`);
  };

  const handleClearFilters = () => {
    router.push(basePath);
  };

  const hasActiveFilters = category || minPrice || maxPrice;

  // Only show root categories for brand page filtering
  const rootCategories = categories.filter(c => c.level === 0);

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      {/* Breadcrumb */}
      <nav className='text-sm text-gray-500 mb-6'>
        <Link href='/' className='hover:text-[#FF6600]'>
          Inicio
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-700'>{brandInfo?.name || 'Marca'}</span>
      </nav>

      <h1 className='text-2xl font-bold text-gray-900 mb-6'>
        {brandInfo?.name || 'Marca'}
      </h1>

      {/* Mobile filter toggle */}
      <button
        onClick={() => setShowMobileFilters(true)}
        className='md:hidden flex items-center gap-2 mb-4 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700'
      >
        <SlidersHorizontal size={16} />
        Filtros
      </button>

      <div className='flex gap-8'>
        {/* Desktop Sidebar */}
        <div className='hidden md:block w-56 flex-shrink-0'>
          <BrandFilters
            categories={rootCategories}
            selectedCategory={category}
            minPrice={minPrice}
            maxPrice={maxPrice}
            hasActiveFilters={!!hasActiveFilters}
            onCategoryChange={catId =>
              updateParams({ category: catId || undefined })
            }
            onPriceChange={(min, max) =>
              updateParams({
                minPrice: min || undefined,
                maxPrice: max || undefined,
              })
            }
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Mobile Sidebar */}
        {showMobileFilters && (
          <div className='fixed inset-0 z-50 md:hidden'>
            <div
              className='absolute inset-0 bg-black/50'
              onClick={() => setShowMobileFilters(false)}
            />
            <div className='absolute right-0 top-0 bottom-0 w-72 bg-white p-6 overflow-y-auto'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='font-bold text-lg'>Filtros</h3>
                <button onClick={() => setShowMobileFilters(false)}>
                  <X size={20} />
                </button>
              </div>
              <BrandFilters
                categories={rootCategories}
                selectedCategory={category}
                minPrice={minPrice}
                maxPrice={maxPrice}
                hasActiveFilters={!!hasActiveFilters}
                onCategoryChange={catId => {
                  updateParams({ category: catId || undefined });
                  setShowMobileFilters(false);
                }}
                onPriceChange={(min, max) => {
                  updateParams({
                    minPrice: min || undefined,
                    maxPrice: max || undefined,
                  });
                  setShowMobileFilters(false);
                }}
                onClearFilters={() => {
                  handleClearFilters();
                  setShowMobileFilters(false);
                }}
              />
            </div>
          </div>
        )}

        <div className='flex-1'>
          <ProductSort
            value={sort}
            onChange={handleSortChange}
            total={pagination.total}
          />
          <ProductGrid
            products={products}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Brand-specific filters (inline component) ───
function BrandFilters({
  categories,
  selectedCategory,
  minPrice,
  maxPrice,
  hasActiveFilters,
  onCategoryChange,
  onPriceChange,
  onClearFilters,
}: {
  categories: CategoryInfo[];
  selectedCategory: string;
  minPrice: string;
  maxPrice: string;
  hasActiveFilters: boolean;
  onCategoryChange: (catId: string | null) => void;
  onPriceChange: (min: string, max: string) => void;
  onClearFilters: () => void;
}) {
  const [showCategories, setShowCategories] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  useEffect(() => {
    setLocalMin(minPrice);
    setLocalMax(maxPrice);
  }, [minPrice, maxPrice]);

  return (
    <aside className='w-full'>
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
            {categories.map(cat => (
              <button
                key={cat._id}
                onClick={() =>
                  onCategoryChange(
                    selectedCategory === cat._id ? null : cat._id,
                  )
                }
                className={`block w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
                  selectedCategory === cat._id
                    ? 'text-[#FF6600] font-semibold bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price */}
      <div className='pb-4'>
        <button
          onClick={() => setShowPrice(!showPrice)}
          className='flex items-center justify-between w-full text-sm font-bold text-gray-900 uppercase mb-3'
        >
          Preco
          {showPrice ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showPrice && (
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                placeholder='Min'
                value={localMin}
                onChange={e => setLocalMin(e.target.value)}
                className='w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              />
              <span className='text-gray-400 text-sm'>—</span>
              <input
                type='number'
                placeholder='Max'
                value={localMax}
                onChange={e => setLocalMax(e.target.value)}
                className='w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              />
            </div>
            <button
              onClick={() => onPriceChange(localMin, localMax)}
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
