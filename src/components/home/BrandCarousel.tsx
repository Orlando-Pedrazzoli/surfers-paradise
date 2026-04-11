'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo: string;
}

export default function BrandCarousel() {
  const [brands, setBrands] = useState<Brand[]>([]);

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

  if (brands.length === 0) return null;

  return (
    <section className='py-8 border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4'>
        <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-y-8 gap-x-10 place-items-center'>
          {brands.map(brand => (
            <Link
              key={brand._id}
              href={`/marca/${brand.slug}`}
              className='grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300'
            >
              <Image
                src={brand.logo}
                alt={brand.name}
                width={110}
                height={44}
                className='object-contain h-8 md:h-10 w-auto'
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
