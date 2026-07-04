// 📄 src/components/checkout/FreeShippingProgress.tsx
// Barra de progresso do frete grátis. Best practice: valor EXATO em R$
// ("Faltam R$ 4,10") em vez de percentual — atualiza em tempo real com o carrinho.

'use client';

import { Truck, PartyPopper } from 'lucide-react';
import { company } from '@/lib/config/company';

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface FreeShippingProgressProps {
  subtotal: number;
}

export default function FreeShippingProgress({
  subtotal,
}: FreeShippingProgressProps) {
  const threshold = company.shipping.freeShippingMinValue;
  const missing = Math.max(0, threshold - subtotal);
  const percent = Math.min(100, (subtotal / threshold) * 100);
  const achieved = missing === 0;

  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        achieved
          ? 'border-green-200 bg-green-50'
          : 'border-amber-200 bg-amber-50'
      }`}
    >
      <div className='mb-2 flex items-center gap-2 text-sm font-medium'>
        {achieved ? (
          <>
            <PartyPopper className='h-4 w-4 shrink-0 text-green-600' />
            <span className='text-green-700'>
              Parabéns! Você ganhou <strong>frete grátis</strong> 🤙
            </span>
          </>
        ) : (
          <>
            <Truck className='h-4 w-4 shrink-0 text-amber-600' />
            <span className='text-amber-800'>
              Faltam <strong>{brl(missing)}</strong> para o frete grátis
            </span>
          </>
        )}
      </div>

      <div className='h-2 w-full overflow-hidden rounded-full bg-white'>
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            achieved ? 'bg-green-500' : 'bg-[#FF6600]'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className='mt-1 flex justify-between text-[11px] text-gray-500'>
        <span>{brl(Math.min(subtotal, threshold))}</span>
        <span>{brl(threshold)}</span>
      </div>
    </div>
  );
}
