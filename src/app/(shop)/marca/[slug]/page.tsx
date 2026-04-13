'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
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

interface BrandInfo {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
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
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const page = searchParams.get('page') || '1';
  const sort = searchParams.get('sort') || '-createdAt';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  // Fetch brand info
  useEffect(() => {
    const fetchBrandInfo = async () => {
      try {
        const res = await fetch('/api/catalog');
        const data = await res.json();
        if (data.success) {
          const brand = data.brands.find((b: BrandInfo) => b.slug === slug);
          if (brand) setBrandInfo(brand);
        }
      } catch {
        console.error('Erro ao carregar marca');
      }
    };
    fetchBrandInfo();
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

  const handleFilterChange = (filters: Record<string, string | undefined>) => {
    updateParams(filters);
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

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      {/* Breadcrumb */}
      <nav className='text-sm text-gray-500 mb-6'>
        <Link href='/' className='hover:text-[#FF6600]'>
          Início
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-700'>{brandInfo?.name || 'Marca'}</span>
      </nav>

      {/* Brand Header */}
      <div className='flex items-center gap-4 mb-6'>
        {brandInfo?.logo && (
          <Image
            src={brandInfo.logo}
            alt={brandInfo.name}
            width={80}
            height={40}
            className='object-contain h-10 w-auto'
          />
        )}
        <h1 className='text-2xl font-bold text-gray-900'>
          {brandInfo?.name || 'Marca'}
        </h1>
      </div>

      {/* Mobile filter toggle */}
      <button
        onClick={() => setShowMobileFilters(true)}
        className='md:hidden flex items-center gap-2 mb-4 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700'
      >
        <SlidersHorizontal size={16} />
        Filtros
      </button>

      <div className='flex gap-8'>
        <div className='hidden md:block w-56 flex-shrink-0'>
          <ProductFilters
            selectedCategory={category}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

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
