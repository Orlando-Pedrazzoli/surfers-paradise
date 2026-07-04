// 📄 src/lib/hooks/useShippingQuotes.ts
// Cotação automática de frete: dispara sozinho quando o CEP completa 8 dígitos
// (com debounce), envia os itens do carrinho e retorna as 5 melhores opções
// (mais baratas, garantindo que a mais rápida esteja entre elas).

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { company } from '@/lib/config/company';

export interface ShippingQuoteOption {
  id: number;
  name: string;
  price: number; // preço original da transportadora
  finalPrice: number; // 0 quando frete grátis se aplica a esta opção
  isFree: boolean;
  deliveryDays: number;
  company: string;
  companyLogo?: string;
  cheapest: boolean;
  fastest: boolean;
}

export interface QuoteCartItem {
  weight?: number;
  height?: number;
  width?: number;
  length?: number;
  quantity: number;
  price: number;
}

interface UseShippingQuotesParams {
  cep: string; // com ou sem máscara
  items: QuoteCartItem[];
  subtotal: number; // para regra de frete grátis
  maxOptions?: number; // default 5
}

export function useShippingQuotes({
  cep,
  items,
  subtotal,
  maxOptions = 5,
}: UseShippingQuotesParams) {
  const [quotes, setQuotes] = useState<ShippingQuoteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const cleanCep = cep.replace(/\D/g, '');
  const debouncedCep = useDebounce(cleanCep, 600);

  const freeShipping = subtotal >= company.shipping.freeShippingMinValue;

  // Serializa os itens pra estabilidade da dependência do efeito
  const itemsKey = useMemo(() => JSON.stringify(items), [items]);

  useEffect(() => {
    if (debouncedCep.length !== 8) {
      setQuotes([]);
      setError('');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError('');

    fetch('/api/shipping/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cep: debouncedCep, items: JSON.parse(itemsKey) }),
      signal: controller.signal,
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao calcular frete');
        return data.quotes as Omit<
          ShippingQuoteOption,
          'finalPrice' | 'isFree' | 'cheapest' | 'fastest'
        >[];
      })
      .then(raw => {
        // Seleciona as N mais baratas, garantindo a mais rápida entre elas
        const byPrice = [...raw].sort((a, b) => a.price - b.price);
        const fastest = [...raw].sort(
          (a, b) => a.deliveryDays - b.deliveryDays,
        )[0];

        let selected = byPrice.slice(0, maxOptions);
        if (fastest && !selected.some(q => q.id === fastest.id)) {
          selected = [...selected.slice(0, maxOptions - 1), fastest];
        }

        const cheapestId = selected[0]?.id;
        const fastestId = [...selected].sort(
          (a, b) => a.deliveryDays - b.deliveryDays,
        )[0]?.id;

        setQuotes(
          selected.map(q => {
            // Frete grátis: aplica-se à opção MAIS BARATA quando o subtotal
            // atinge o limiar. Expressas continuam pagas (padrão de mercado).
            // Para tornar TODAS grátis: troque a condição por só `freeShipping`.
            const isFree = freeShipping && q.id === cheapestId;
            return {
              ...q,
              finalPrice: isFree ? 0 : q.price,
              isFree,
              cheapest: q.id === cheapestId,
              fastest: q.id === fastestId,
            };
          }),
        );
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(
            err instanceof Error ? err.message : 'Erro ao calcular frete',
          );
          setQuotes([]);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedCep, itemsKey, freeShipping, maxOptions]);

  return { quotes, loading, error, freeShipping };
}
