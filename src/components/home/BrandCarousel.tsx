'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo: string;
}

const BRANDS_PER_PAGE = 6;

export default function BrandCarousel() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

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

  const totalPages = Math.ceil(brands.length / BRANDS_PER_PAGE);
  const startIndex = currentPage * BRANDS_PER_PAGE;
  const visibleBrands = brands.slice(startIndex, startIndex + BRANDS_PER_PAGE);

  const goToPrev = useCallback(() => {
    setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  const goToNext = useCallback(() => {
    setCurrentPage(prev => (prev + 1) % totalPages);
  }, [totalPages]);

  // Auto-play every 4 seconds
  useEffect(() => {
    if (totalPages <= 1) return;
    const interval = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % totalPages);
    }, 4000);
    return () => clearInterval(interval);
  }, [totalPages]);

  if (brands.length === 0) return null;

  return (
    <section className='py-8 border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4'>
        {/* Logos Grid — 6 per page */}
        <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-y-6 gap-x-8 place-items-center min-h-[60px]'>
          {visibleBrands.map(brand => (
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

        {/* Navigation — arrows + dots */}
        {totalPages > 1 && (
          <div className='flex items-center justify-center gap-3 mt-6'>
            <button
              onClick={goToPrev}
              className='text-gray-400 hover:text-gray-700 transition-colors'
              aria-label='Marcas anteriores'
            >
              <ChevronLeft size={18} />
            </button>

            <div className='flex items-center gap-2'>
              {Array.from({ length: totalPages }).map((_, i) => (
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
    </section>
  );
}
