// src/app/(shop)/promocao/PromoPageClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';

// Shape mínimo aceite pelo ProductCard (os campos extra são passados na íntegra).
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
  sku?: string;
  weight?: number;
  stock?: number;
}

export default function PromocaoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Contexto 'online' (default) → só produtos ativos, publicados e
        // variante principal. isOnSale=true = marcados como "Em Promoção".
        const res = await fetch(
          '/api/products?isOnSale=true&limit=60&sort=-createdAt',
          { cache: 'no-store' },
        );
        const data = await res.json();
        if (data.success) setProducts(data.products);
      } catch {
        console.error('Erro ao carregar promoções');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className='min-h-[60vh]'>
      {/* Hero */}
      <div className='bg-[#FF6600] text-white'>
        <div className='max-w-7xl mx-auto px-4 py-10 text-center'>
          <div className='inline-flex items-center gap-2 mb-2'>
            <Tag size={22} />
            <span className='text-xs font-bold uppercase tracking-widest opacity-90'>
              Ofertas
            </span>
          </div>
          <h1 className='text-3xl md:text-4xl font-black uppercase tracking-wide'>
            Promoções
          </h1>
          <p className='mt-2 text-sm md:text-base text-white/90'>
            Os melhores preços em produtos selecionados. Aproveite enquanto
            duram!
          </p>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* Loading */}
        {loading ? (
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className='bg-gray-100 rounded-lg animate-pulse aspect-[3/4]'
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          // Estado vazio
          <div className='py-20 text-center'>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 text-[#FF6600] mb-4'>
              <Tag size={28} />
            </div>
            <p className='text-lg font-medium text-gray-700'>
              Nenhuma promoção ativa no momento.
            </p>
            <p className='text-sm text-gray-400 mt-1'>
              Volte em breve para conferir novas ofertas!
            </p>
          </div>
        ) : (
          <>
            <p className='text-sm text-gray-500 mb-6'>
              {products.length}{' '}
              {products.length === 1
                ? 'produto em promoção'
                : 'produtos em promoção'}
            </p>
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
