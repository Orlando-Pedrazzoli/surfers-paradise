'use client';

import Image from 'next/image';
import Link from 'next/link';

interface CategoryBanner {
  title: string;
  image: string;
  href: string;
}

const categories: CategoryBanner[] = [
  {
    title: 'Deck',
    image: '/images/category-deck.jpg',
    href: '/categoria/deck',
  },
  {
    title: 'Leash',
    image: '/images/category-leash.jpg',
    href: '/categoria/leash',
  },
  {
    title: 'Capa',
    image: '/images/category-capa.jpg',
    href: '/categoria/capa',
  },
];

export default function CategoryBanners() {
  return (
    <section className='py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          {categories.map(cat => (
            <Link
              key={cat.title}
              href={cat.href}
              className='group block overflow-hidden'
            >
              <div className='bg-[#2196F3] py-2 text-center'>
                <h3 className='text-white font-bold text-lg uppercase tracking-wider italic'>
                  {cat.title}
                </h3>
              </div>
              <div className='relative aspect-[3/4] overflow-hidden'>
                <Image
                  src={cat.image}
                  alt={cat.title}
                  fill
                  sizes='(max-width: 640px) 100vw, 33vw'
                  className='object-cover group-hover:scale-105 transition-transform duration-500'
                />
                <div className='absolute bottom-6 left-1/2 -translate-x-1/2'>
                  <span className='text-white font-bold text-sm uppercase tracking-wide underline underline-offset-4'>
                    Shop Now
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
