'use client';

import ProductCard from '@/components/product/ProductCard';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

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

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  pagination?: Pagination;
  onPageChange?: (page: number) => void;
}

export default function ProductGrid({
  products,
  loading,
  pagination,
  onPageChange,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className='bg-gray-100 rounded-lg animate-pulse aspect-[3/4]'
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className='text-center py-16'>
        <Package size={48} className='mx-auto mb-4 text-gray-300' />
        <p className='text-gray-500 text-lg'>Nenhum produto encontrado</p>
        <p className='text-gray-400 text-sm mt-1'>
          Tente ajustar os filtros ou buscar por outro termo
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && onPageChange && (
        <div className='flex items-center justify-center gap-2 mt-8'>
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className='p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: pagination.pages }, (_, i) => i + 1)
            .filter(p => {
              if (pagination.pages <= 7) return true;
              if (p === 1 || p === pagination.pages) return true;
              if (Math.abs(p - pagination.page) <= 1) return true;
              return false;
            })
            .map((p, i, arr) => {
              const showEllipsis = i > 0 && p - arr[i - 1] > 1;
              return (
                <span key={p} className='flex items-center gap-1'>
                  {showEllipsis && (
                    <span className='px-1 text-gray-400'>...</span>
                  )}
                  <button
                    onClick={() => onPageChange(p)}
                    className={`w-9 h-9 rounded-md text-sm font-medium transition-colors ${
                      p === pagination.page
                        ? 'bg-[#FF6600] text-white'
                        : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              );
            })}

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className='p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
