// src/app/(shop)/promocao/page.tsx
// 🔍 Server wrapper SEO da página de promoções.

import type { Metadata } from 'next';
import { Suspense } from 'react';
import PromoPageClient from './PromoPageClient';

export const metadata: Metadata = {
  title: 'Promoções e Ofertas de Equipamentos de Surf',
  description:
    'Ofertas em quilhas, leashes, decks, wetsuits e acessórios de surf. Produtos originais com desconto e parcelamento em até 10x sem juros.',
  alternates: { canonical: '/promocao' },
};

export default function PromocaoPage() {
  return (
    <Suspense>
      <PromoPageClient />
    </Suspense>
  );
}
