'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';

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
  // ═══ FAMILY FIELDS ═══
  productFamily?: string;
  variantType?: 'color' | 'size' | 'both';
  color?: string;
  colorCode?: string;
  colorCode2?: string;
  size?: string;
  isMainVariant?: boolean;
  // ═══ WETSUIT ═══
  gender?: 'masculino' | 'feminino' | 'kids' | 'unissex' | '';
}

type Gender = 'masculino' | 'feminino';

interface FeaturedWetsuitsProps {
  title?: string;
  /** Slug da categoria raiz a buscar (default: wetsuits) */
  categorySlug?: string;
  /** Quantos produtos buscar no total (serão divididos entre os gêneros) */
  limit?: number;
}

export default function FeaturedWetsuits({
  title = 'WETSUITS',
  categorySlug = 'wetsuits',
  limit = 40,
}: FeaturedWetsuitsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Gender>('masculino');
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Busca única de todos os wetsuits
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `/api/products?categorySlug=${categorySlug}&context=online&limit=${limit}&sort=-createdAt`,
        );
        const data = await res.json();
        if (data.success) setProducts(data.products);
      } catch {
        console.error('Erro ao carregar wetsuits');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categorySlug, limit]);

  // Separação por gênero (client-side)
  const byGender = useMemo(() => {
    return {
      masculino: products.filter(p => p.gender === 'masculino'),
      feminino: products.filter(p => p.gender === 'feminino'),
    };
  }, [products]);

  const activeList = byGender[activeTab];

  // Estado de scroll: setas + dots de página
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    const pages = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    setPageCount(pages);
    setActivePage(
      Math.min(pages - 1, Math.round(el.scrollLeft / el.clientWidth)),
    );
  }, []);

  // Listeners de scroll/resize
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, loading]);

  // Ao trocar de tab (ou quando a lista muda), volta ao início e recalcula
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    const id = requestAnimationFrame(updateScrollState);
    return () => cancelAnimationFrame(id);
  }, [activeTab, activeList.length, updateScrollState]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const goToPage = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  // ───── Loading ─────
  if (loading) {
    return (
      <section className='py-8'>
        <div className='max-w-7xl mx-auto px-4'>
          <h2 className='text-xl font-bold text-gray-900 mb-6 uppercase'>
            {title}
          </h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className='bg-gray-100 rounded-lg animate-pulse aspect-[3/4]'
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Se não há wetsuits em nenhum gênero, não renderiza nada
  if (byGender.masculino.length === 0 && byGender.feminino.length === 0) {
    return null;
  }

  return (
    <section className='py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        {/* Header: título à esquerda, toggle centralizado */}
        <div className='mb-6 grid grid-cols-1 sm:grid-cols-3 items-center gap-4'>
          <h2 className='text-xl font-bold text-gray-900 uppercase'>{title}</h2>

          <div className='flex justify-center'>
            <div className='inline-flex rounded-full bg-gray-100 p-1'>
              {(['masculino', 'feminino'] as Gender[]).map(g => (
                <button
                  key={g}
                  onClick={() => setActiveTab(g)}
                  className={`px-6 py-2 text-sm font-bold uppercase rounded-full transition-colors ${
                    activeTab === g
                      ? 'bg-[#FF6600] text-white shadow'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <span className='hidden sm:block' aria-hidden='true' />
        </div>

        {/* Carrossel */}
        <div className='relative'>
          {activeList.length === 0 ? (
            <div className='py-12 text-center text-sm text-gray-400'>
              Nenhum produto nesta coleção no momento.
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                className='flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2'
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {activeList.map(product => (
                  <div
                    key={product._id}
                    className='flex-shrink-0 w-[48%] sm:w-[31%] md:w-[23.5%] snap-start'
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* Seta circular ESQUERDA (desktop) */}
              <button
                onClick={() => scroll('left')}
                aria-label='Anteriores'
                className={`hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white text-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.15)] ring-1 ring-black/5 transition hover:bg-gray-50 ${
                  canLeft ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                <ChevronLeft size={20} />
              </button>

              {/* Seta circular DIREITA (desktop) */}
              <button
                onClick={() => scroll('right')}
                aria-label='Próximos'
                className={`hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white text-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.15)] ring-1 ring-black/5 transition hover:bg-gray-50 ${
                  canRight ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Dots de página */}
        {activeList.length > 0 && pageCount > 1 && (
          <div className='mt-4 flex justify-center gap-2'>
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i)}
                aria-label={`Página ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === activePage
                    ? 'w-6 bg-[#FF6600]'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}

        {/* Ver todos */}
        {activeList.length > 0 && (
          <div className='mt-6 flex justify-center'>
            <Link
              href={`/categoria/${categorySlug}?gender=${activeTab}`}
              className='inline-flex items-center gap-2 rounded-full border-2 border-[#FF6600] px-8 py-2.5 text-sm font-bold uppercase tracking-wide text-[#FF6600] transition-colors hover:bg-[#FF6600] hover:text-white'
            >
              Ver todos
              <ChevronRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
