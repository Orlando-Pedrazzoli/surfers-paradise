'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
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

export default function BuscaPage() {
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
  const [searchInput, setSearchInput] = useState('');

  const q = searchParams.get('q') || '';
  const page = searchParams.get('page') || '1';
  const sort = searchParams.get('sort') || '-createdAt';

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const fetchResults = useCallback(async () => {
    if (!q.trim()) {
      setProducts([]);
      setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ q, page, limit: '20', sort });
      const res = await fetch(`/api/products/search?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        setPagination(data.pagination);
      }
    } catch {
      console.error('Erro na busca');
    } finally {
      setLoading(false);
    }
  }, [q, page, sort]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/busca?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    params.delete('page');
    router.push(`/busca?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/busca?${params.toString()}`);
  };

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      {/* Breadcrumb */}
      <nav className='text-sm text-gray-500 mb-6'>
        <Link href='/' className='hover:text-[#FF6600]'>
          Início
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-700'>Busca</span>
      </nav>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className='mb-6'>
        <div className='flex gap-2 max-w-xl'>
          <div className='relative flex-1'>
            <Search
              size={18}
              className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
            />
            <input
              type='text'
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder='O que você está procurando?'
              className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600] text-sm'
            />
          </div>
          <button
            type='submit'
            className='px-6 py-2.5 bg-[#FF6600] text-white font-medium rounded-md hover:bg-[#e55b00] transition-colors text-sm'
          >
            Buscar
          </button>
        </div>
      </form>

      {/* Results Header */}
      {q && (
        <h1 className='text-xl font-bold text-gray-900 mb-6'>
          Resultados para:{' '}
          <span className='text-[#FF6600]'>&quot;{q}&quot;</span>
        </h1>
      )}

      {!q ? (
        <div className='text-center py-16'>
          <Search size={48} className='mx-auto mb-4 text-gray-300' />
          <p className='text-gray-500 text-lg'>
            Digite um termo para buscar produtos
          </p>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
