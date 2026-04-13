'use client';

import Image from 'next/image';
import Link from 'next/link';

interface PromoBanner {
  image: string;
  alt: string;
  href: string;
  label: string;
}

const banners: PromoBanner[] = [
  {
    image: '/images/fcs2.jpg',
    alt: 'Quilhas FCS II',
    href: '/marca/fcs-ii',
    label: 'ENCAIXE FCS2',
  },
  {
    image: '/images/futures.jpg',
    alt: 'Quilhas Futures',
    href: '/marca/futures',
    label: 'ENCAIXE FUTURES',
  },
];

export default function PromoBanners() {
  return (
    <section className='py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {banners.map((banner, index) => (
            <Link
              key={index}
              href={banner.href}
              className='relative block overflow-hidden rounded-lg group'
            >
              <Image
                src={banner.image}
                alt={banner.alt}
                width={700}
                height={400}
                className='w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500'
              />
              <div className='absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors' />
              <div className='absolute bottom-6 left-1/2 -translate-x-1/2'>
                <span className='bg-[#FF6600] text-white font-bold text-sm md:text-base px-6 py-2.5 uppercase tracking-wide'>
                  {banner.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
