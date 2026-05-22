'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo: string;
}

const BRANDS_PER_PAGE_DESKTOP = 6;

export default function BrandCarousel() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch('/api/brands');
        const data = await res.json();
        if (data.success) {
          setBrands(
            data.brands.filter(
              (b: Brand & { isFeatured: boolean; isActive: boolean }) =>
                b.isFeatured && b.isActive && b.logo,
            ),
          );
        }
      } catch {
        console.error('Erro ao carregar marcas');
      }
    };
    fetchBrands();
  }, []);

  // ─── Desktop pagination ────────────────────────────────────
  const totalPagesDesktop = Math.ceil(brands.length / BRANDS_PER_PAGE_DESKTOP);
  const startIndex = currentPage * BRANDS_PER_PAGE_DESKTOP;
  const visibleBrandsDesktop = brands.slice(
    startIndex,
    startIndex + BRANDS_PER_PAGE_DESKTOP,
  );

  const goToPrev = useCallback(() => {
    setCurrentPage(prev => (prev - 1 + totalPagesDesktop) % totalPagesDesktop);
  }, [totalPagesDesktop]);

  const goToNext = useCallback(() => {
    setCurrentPage(prev => (prev + 1) % totalPagesDesktop);
  }, [totalPagesDesktop]);

  // Auto-play desktop every 4s
  useEffect(() => {
    if (totalPagesDesktop <= 1) return;
    const interval = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % totalPagesDesktop);
    }, 4000);
    return () => clearInterval(interval);
  }, [totalPagesDesktop]);

  // ─── Mobile scroll tracking ────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || brands.length === 0) return;

    const handleScroll = () => {
      const itemWidth = el.scrollWidth / brands.length;
      const index = Math.round(el.scrollLeft / itemWidth);
      setMobileActiveIndex(Math.min(index, brands.length - 1));
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [brands.length]);

  const scrollMobileTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const itemWidth = el.scrollWidth / brands.length;
    el.scrollTo({ left: itemWidth * index, behavior: 'smooth' });
  };

  if (brands.length === 0) return null;

  return (
    <section className='py-8 border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4'>
        {/* ═══ MOBILE: horizontal scroll snap (< md) ═══ */}
        <div className='md:hidden'>
          <div
            ref={scrollRef}
            className='flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-4 px-4 pb-2'
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {brands.map(brand => (
              <Link
                key={brand._id}
                href={`/marca/${brand.slug}`}
                className='snap-center shrink-0 flex items-center justify-center hover:opacity-70 transition-opacity'
                style={{ width: 'calc((100% - 1.5rem) / 2.5)' }}
              >
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={140}
                  height={48}
                  className='object-contain h-10 w-auto'
                />
              </Link>
            ))}
          </div>

          {/* Dots — one per logo */}
          {brands.length > 1 && (
            <div className='flex items-center justify-center gap-1.5 mt-4'>
              {brands.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollMobileTo(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === mobileActiveIndex
                      ? 'bg-gray-800 w-2'
                      : 'bg-gray-300 hover:bg-gray-400 w-2'
                  }`}
                  aria-label={`Ir para marca ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ═══ DESKTOP: grid paginado (≥ md) ═══ */}
        <div className='hidden md:block'>
          <div className='grid grid-cols-4 md:grid-cols-6 gap-y-6 gap-x-8 place-items-center min-h-[60px]'>
            {visibleBrandsDesktop.map(brand => (
              <Link
                key={brand._id}
                href={`/marca/${brand.slug}`}
                className='hover:opacity-70 transition-opacity duration-200'
              >
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={120}
                  height={48}
                  className='object-contain h-8 md:h-10 w-auto'
                />
              </Link>
            ))}
          </div>

          {totalPagesDesktop > 1 && (
            <div className='flex items-center justify-center gap-3 mt-6'>
              <button
                onClick={goToPrev}
                className='text-gray-400 hover:text-gray-700 transition-colors'
                aria-label='Marcas anteriores'
              >
                <ChevronLeft size={18} />
              </button>

              <div className='flex items-center gap-2'>
                {Array.from({ length: totalPagesDesktop }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentPage
                        ? 'bg-gray-800'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Página ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={goToNext}
                className='text-gray-400 hover:text-gray-700 transition-colors'
                aria-label='Próximas marcas'
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
