'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import ProductGrid from '@/components/product/ProductGrid';
import ProductFilters from '@/components/product/ProductFilters';
import ProductSort from '@/components/product/ProductSort';

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

export default function ProdutosPage() {
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const page = searchParams.get('page') || '1';
  const sort = searchParams.get('sort') || '-createdAt';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: '20',
        sort,
        isActive: 'true',
      });
      if (category) params.set('category', category);
      if (brand) params.set('brand', brand);
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
  }, [page, sort, category, brand, minPrice, maxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.delete('page'); // Reset page on filter change
    router.push(`/produtos?${params.toString()}`);
  };

  const handleFilterChange = (filters: Record<string, string | undefined>) => {
    updateParams(filters);
  };

  const handleSortChange = (newSort: string) => {
    updateParams({ sort: newSort });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/produtos?${params.toString()}`);
  };

  const handleClearFilters = () => {
    router.push('/produtos');
  };

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      {/* Breadcrumb */}
      <nav className='text-sm text-gray-500 mb-6'>
        <a href='/' className='hover:text-[#FF6600]'>
          Início
        </a>
        <span className='mx-2'>/</span>
        <span className='text-gray-700'>Produtos</span>
      </nav>

      <h1 className='text-2xl font-bold text-gray-900 mb-6'>
        Todos os Produtos
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
        {/* Sidebar — Desktop */}
        <div className='hidden md:block w-56 flex-shrink-0'>
          <ProductFilters
            selectedCategory={category}
            selectedBrand={brand}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Mobile Filters Overlay */}
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
              <ProductFilters
                selectedCategory={category}
                selectedBrand={brand}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onFilterChange={f => {
                  handleFilterChange(f);
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

        {/* Main Content */}
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
