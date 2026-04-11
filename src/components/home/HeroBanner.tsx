'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  _id: string;
  title: string;
  image: string;
  mobileImage?: string;
  link?: string;
}

export default function HeroBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch('/api/banners?position=hero&active=true');
        const data = await res.json();
        if (data.success) setBanners(data.banners);
      } catch {
        console.error('Erro ao carregar banners');
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = () => {
    setCurrent(prev => (prev - 1 + banners.length) % banners.length);
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [banners.length, next]);

  if (loading) {
    return <div className='w-full aspect-[2.5/1] bg-gray-100 animate-pulse' />;
  }

  if (banners.length === 0) return null;

  return (
    <div className='relative w-full overflow-hidden'>
      <div
        className='flex transition-transform duration-500 ease-in-out'
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map(banner => (
          <div key={banner._id} className='w-full flex-shrink-0 relative'>
            {banner.link ? (
              <Link href={banner.link} className='block'>
                <div className='relative w-full aspect-[2.5/1]'>
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    priority
                    sizes='100vw'
                    className='object-cover'
                  />
                </div>
              </Link>
            ) : (
              <div className='relative w-full aspect-[2.5/1]'>
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  priority
                  sizes='100vw'
                  className='object-cover'
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className='absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 text-white rounded-full flex items-center justify-center hover:bg-black/50 transition-colors'
            aria-label='Banner anterior'
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className='absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 text-white rounded-full flex items-center justify-center hover:bg-black/50 transition-colors'
            aria-label='Próximo banner'
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {banners.length > 1 && (
        <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2'>
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-3 h-3 rounded-full transition-colors ${
                i === current ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
