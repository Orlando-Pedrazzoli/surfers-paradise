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
              className='group block overflow-hidden rounded-lg'
            >
              {/* Orange Title Bar */}
              <div className='bg-[#FF6600] py-2.5 text-center'>
                <h3 className='text-white font-black text-lg uppercase tracking-wider'>
                  {cat.title}
                </h3>
              </div>

              {/* Image */}
              <div className='relative aspect-[3/4] overflow-hidden'>
                <Image
                  src={cat.image}
                  alt={cat.title}
                  fill
                  sizes='(max-width: 640px) 100vw, 33vw'
                  className='object-cover group-hover:scale-105 transition-transform duration-500'
                />
                <div className='absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-colors' />
                <div className='absolute bottom-6 left-1/2 -translate-x-1/2'>
                  <span className='bg-[#FF6600] text-white font-bold text-sm px-6 py-2.5 uppercase tracking-wide'>
                    Ver Produtos
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
