'use client';

import { useState, useEffect } from 'react';

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
    <div className='bg-[#FF6600] text-white text-center py-2 px-4 text-xs sm:text-sm font-medium'>
      <div className='max-w-7xl mx-auto'>
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
    </div>
  );
}
