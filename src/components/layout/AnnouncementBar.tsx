'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const messages = [
  'Descontos de até 10% no PIX ou Boleto*',
  'Frete Grátis para todo Brasil*',
  'Parcele em até 10x sem juros no cartão de crédito*',
];

export default function AnnouncementBar() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='bg-[#FF6600] text-white py-2 px-4 text-xs sm:text-sm font-medium'>
      <div className='max-w-7xl mx-auto flex items-center justify-between'>
        {/* Spacer for centering on desktop */}
        <div className='hidden md:block w-16' />

        {/* Messages */}
        <div className='flex-1 text-center'>
          <div className='hidden md:flex items-center justify-center gap-2'>
            {messages.map((msg, i) => (
              <span key={i} className='flex items-center'>
                {i > 0 && <span className='mx-3 opacity-60'>|</span>}
                {msg}
              </span>
            ))}
          </div>
          <p className='md:hidden'>{messages[current]}</p>
        </div>

        {/* Social Icons */}
        <div className='flex items-center gap-2 ml-3 flex-shrink-0'>
          <Link
            href='https://www.instagram.com/lojasurfersparadiseoficial/'
            target='_blank'
            rel='noopener noreferrer'
            className='w-7 h-7 rounded-full bg-white/15 flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 group'
            aria-label='Instagram'
          >
            <svg
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='none'
              className='text-white group-hover:text-[#FF6600] transition-colors duration-300'
            >
              <rect
                x='2'
                y='2'
                width='20'
                height='20'
                rx='5'
                stroke='currentColor'
                strokeWidth='2'
              />
              <circle
                cx='12'
                cy='12'
                r='5'
                stroke='currentColor'
                strokeWidth='2'
              />
              <circle cx='18' cy='6' r='1.5' fill='currentColor' />
            </svg>
          </Link>
          <Link
            href='https://web.facebook.com/lojasurfersparadise/'
            target='_blank'
            rel='noopener noreferrer'
            className='w-7 h-7 rounded-full bg-white/15 flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 group'
            aria-label='Facebook'
          >
            <svg
              width='14'
              height='14'
              viewBox='0 0 24 24'
              fill='currentColor'
              className='text-white group-hover:text-[#FF6600] transition-colors duration-300'
            >
              <path d='M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z' />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
