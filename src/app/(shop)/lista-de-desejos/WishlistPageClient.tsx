// 📄 src/app/(shop)/lista-de-desejos/WishlistPageClient.tsx
// Página da lista de desejos: grid de ProductCard (mesmo card do catálogo —
// coração, quick-add ao carrinho e variantes já funcionam de graça).
// Funciona para GUESTS (ids do localStorage) e logados (sync no provider).
// Estado vazio com CTA para o catálogo; aviso suave para guest logar e
// não perder a lista ao trocar de dispositivo.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Heart, ArrowRight, LogIn } from 'lucide-react';
import { useWishlist } from '@/lib/context/WishlistProvider';
import ProductCard from '@/components/product/ProductCard';

interface WishlistProduct {
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

export default function WishlistPageClient() {
  const { ids, hydrated } = useWishlist();
  const { status } = useSession();
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [fetchedOnce, setFetchedOnce] = useState(false);

  // Busca apenas os ids que ainda não temos (remoções não refazem fetch);
  // todos os setState acontecem em callbacks assíncronos (lint do React).
  useEffect(() => {
    if (!hydrated) return;
    const missing = ids.filter(id => !products.some(p => p._id === id));
    if (missing.length === 0) return;
    let cancelled = false;
    fetch(`/api/products/by-ids?ids=${missing.join(',')}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (data.success) {
          setProducts(prev => {
            const have = new Set(prev.map(p => p._id));
            return [
              ...prev,
              ...(data.products as WishlistProduct[]).filter(
                p => !have.has(p._id),
              ),
            ];
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setFetchedOnce(true);
      });
    return () => {
      cancelled = true;
    };
  }, [ids, hydrated, products]);

  // Loading derivado: esperando hidratar, ou há ids e a primeira busca
  // ainda não terminou
  const loading =
    !hydrated || (ids.length > 0 && !fetchedOnce && products.length === 0);

  // Remoções pelo coração do card refletem sem novo fetch
  const visible = products.filter(p => ids.includes(p._id));

  return (
    <main className='max-w-7xl mx-auto px-4 py-8 min-h-[60vh]'>
      <nav className='text-sm text-gray-500 mb-6'>
        <Link href='/' className='hover:text-[#FF6600]'>
          Início
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-700'>Lista de Desejos</span>
      </nav>

      <div className='flex items-center gap-3 mb-1'>
        <Heart size={26} className='fill-[#FF6600] text-[#FF6600]' />
        <h1 className='text-2xl md:text-3xl font-black text-gray-900'>
          Lista de Desejos
        </h1>
      </div>
      <p className='text-sm text-gray-500 mb-6'>
        {hydrated && !loading
          ? visible.length === 0
            ? 'Nenhum produto salvo ainda.'
            : `${visible.length} ${visible.length === 1 ? 'produto salvo' : 'produtos salvos'}`
          : '\u00A0'}
      </p>

      {/* Guest: incentivo suave a logar (sem gatear a funcionalidade) */}
      {hydrated && status === 'unauthenticated' && visible.length > 0 && (
        <div className='flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 mb-6'>
          <LogIn size={18} className='text-[#FF6600] flex-shrink-0' />
          <p className='text-sm text-gray-700'>
            <Link
              href='/login'
              className='font-semibold text-[#FF6600] hover:underline'
            >
              Entre na sua conta
            </Link>{' '}
            para salvar sua lista e acessá-la de qualquer dispositivo.
          </p>
        </div>
      )}

      {loading || !hydrated ? (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className='bg-gray-100 rounded-lg animate-pulse aspect-[3/4]'
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className='py-16 text-center'>
          <Heart size={56} className='mx-auto mb-4 text-gray-200' />
          <h2 className='text-lg font-bold text-gray-900 mb-2'>
            Sua lista de desejos está vazia
          </h2>
          <p className='text-sm text-gray-500 max-w-md mx-auto mb-6'>
            Toque no coração de qualquer produto para salvá-lo aqui e comprar
            quando quiser.
          </p>
          <Link
            href='/produtos'
            className='inline-flex items-center gap-2 px-8 py-3 bg-[#FF6600] text-white text-sm font-bold rounded-md hover:bg-[#e55b00] transition-colors'
          >
            Explorar Produtos
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          {visible.map(product => (
            <ProductCard key={product._id} product={product} removeMode />
          ))}
        </div>
      )}
    </main>
  );
}
