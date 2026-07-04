// 📄 src/components/checkout/ShippingOptions.tsx (v2)
// Cards de seleção de envio: badges "Mais barata"/"Mais rápida", prazo visível,
// preço riscado + "Grátis" quando o frete grátis se aplica, skeleton no loading.

'use client';

import { Truck, Zap, CheckCircle2 } from 'lucide-react';
import type { ShippingQuoteOption } from '@/lib/hooks/useShippingQuotes';

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface ShippingOptionsProps {
  options: ShippingQuoteOption[];
  selectedId?: number;
  loading?: boolean;
  error?: string;
  onSelect: (option: ShippingQuoteOption) => void;
}

export default function ShippingOptions({
  options,
  selectedId,
  loading = false,
  error = '',
  onSelect,
}: ShippingOptionsProps) {
  if (loading) {
    return (
      <div className='space-y-2'>
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className='h-16 w-full animate-pulse rounded-lg bg-gray-100'
          />
        ))}
        <p className='text-center text-xs text-gray-400'>
          Consultando transportadoras...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <p className='rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600'>
        {error}
      </p>
    );
  }

  if (!options.length) {
    return (
      <p className='text-sm text-gray-500'>
        Informe o CEP para ver as opções de envio.
      </p>
    );
  }

  return (
    <div className='space-y-2' role='radiogroup' aria-label='Método de envio'>
      {options.map(opt => {
        const selected = opt.id === selectedId;
        return (
          <button
            key={opt.id}
            type='button'
            role='radio'
            aria-checked={selected}
            onClick={() => onSelect(opt)}
            className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition ${
              selected
                ? 'border-[#FF6600] bg-orange-50 ring-1 ring-[#FF6600]'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <div className='flex items-center gap-3'>
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  selected ? 'border-[#FF6600] bg-[#FF6600]' : 'border-gray-300'
                }`}
              >
                {selected && <CheckCircle2 className='h-4 w-4 text-white' />}
              </div>

              <div>
                <div className='flex flex-wrap items-center gap-1.5'>
                  <p className='text-sm font-medium'>
                    {opt.company} — {opt.name}
                  </p>
                  {opt.cheapest && !opt.isFree && (
                    <span className='rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700'>
                      Mais barata
                    </span>
                  )}
                  {opt.fastest && (
                    <span className='inline-flex items-center gap-0.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700'>
                      <Zap className='h-2.5 w-2.5' /> Mais rápida
                    </span>
                  )}
                </div>
                <p className='mt-0.5 flex items-center gap-1 text-xs text-gray-500'>
                  <Truck className='h-3 w-3' />
                  até {opt.deliveryDays}{' '}
                  {opt.deliveryDays === 1 ? 'dia útil' : 'dias úteis'}
                </p>
              </div>
            </div>

            <div className='text-right'>
              {opt.isFree ? (
                <>
                  <span className='block text-xs text-gray-400 line-through'>
                    {brl(opt.price)}
                  </span>
                  <span className='text-sm font-bold text-green-600'>
                    Grátis
                  </span>
                </>
              ) : (
                <span className='text-sm font-bold'>{brl(opt.price)}</span>
              )}
            </div>
          </button>
        );
      })}
      <p className='text-center text-[11px] text-gray-400'>
        Cotação via Melhor Envio · preços e prazos em tempo real
      </p>
    </div>
  );
}
