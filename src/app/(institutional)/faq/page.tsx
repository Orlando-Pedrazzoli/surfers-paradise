// src/app/(institutional)/faq/page.tsx
// 🔍 Server wrapper SEO da página de FAQ.

import type { Metadata } from 'next';
import { Suspense } from 'react';
import FaqPageClient from './FaqPageClient';

export const metadata: Metadata = {
  title: 'Perguntas Frequentes (FAQ)',
  description:
    'Dúvidas sobre pedidos, pagamentos, prazos de entrega, trocas e devoluções na Surfers Paradise. Encontre respostas rápidas antes de comprar.',
  alternates: { canonical: '/faq' },
};

export default function FAQPage() {
  return (
    <Suspense>
      <FaqPageClient />
    </Suspense>
  );
}
