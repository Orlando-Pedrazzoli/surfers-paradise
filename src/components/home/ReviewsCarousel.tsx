'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface Review {
  name: string;
  location: string;
  date: string;
  rating: number;
  text: string;
}

const reviews: Review[] = [
  {
    name: 'Itamar Guimarães',
    location: 'São Paulo/SP',
    date: '15/10/2025',
    rating: 5,
    text: 'Produtos incríveis de qualidade, linha completa das melhores marcas do Brasil e do mundo!',
  },
  {
    name: 'Marcos Capuzzo',
    location: 'São Paulo/SP',
    date: '08/04/2024',
    rating: 5,
    text: 'Loja de surf de verdade com vendedor que entende, em especial o Anderson que é bem gente boa e sabe o que está falando e indicando.',
  },
  {
    name: 'Paulo Benevides',
    location: 'São Paulo/SP',
    date: '12/03/2025',
    rating: 5,
    text: 'Tanto o proprietário quanto o time é sensacional, e com ótimos produtos.',
  },
  {
    name: 'Rob',
    location: 'São Paulo/SP',
    date: '20/06/2016',
    rating: 5,
    text: 'Ótimos produtos com preço justo! Bom atendimento! Aloha!',
  },
  {
    name: 'Marcos Vinicius B.',
    location: 'São Paulo/SP',
    date: '03/09/2022',
    rating: 5,
    text: 'Comprar na Surfers Paradise é como escolher produtos entre amigos, me sinto em casa!',
  },
  {
    name: 'Itamar Guimarães',
    location: 'São Paulo/SP',
    date: '15/10/2025',
    rating: 5,
    text: 'Produtos incríveis de qualidade, linha completa das melhores marcas do Brasil e do mundo!',
  },
];

const renderStars = (rating: number) =>
  Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      size={14}
      className={
        i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
      }
    />
  ));

export default function ReviewsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  return (
    <section className='py-10 bg-white'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='mb-6'>
          <h2 className='text-lg font-bold text-gray-900 uppercase tracking-wide'>
            O que estão falando da Surfers Paradise
          </h2>
          <div className='w-full h-0.5 bg-gray-800 mt-2' />
        </div>

        <div className='relative'>
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className='absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:border-gray-500 shadow-sm transition-colors'
              aria-label='Reviews anteriores'
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className='absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:border-gray-500 shadow-sm transition-colors'
              aria-label='Próximos reviews'
            >
              <ChevronRight size={16} />
            </button>
          )}

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className='flex gap-6 overflow-x-auto scrollbar-hide pb-2'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {reviews.map((review, index) => (
              <div key={index} className='flex-shrink-0 w-[220px] sm:w-[240px]'>
                <div className='mb-2'>
                  <p className='font-semibold text-sm text-gray-900 truncate'>
                    {review.name}
                  </p>
                  <p className='text-xs text-gray-500'>{review.location}</p>
                  <p className='text-xs text-gray-400'>Data: {review.date}</p>
                </div>
                <div className='flex gap-0.5 mb-2'>
                  {renderStars(review.rating)}
                </div>
                <p className='text-sm text-gray-600 leading-relaxed line-clamp-4'>
                  {review.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
