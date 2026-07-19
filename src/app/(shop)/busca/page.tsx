// src/app/(shop)/busca/page.tsx
// 🔍 Server wrapper da página de busca — noindex para não desperdiçar
// crawl budget com resultados de pesquisa (bloqueada também no robots.ts).

import type { Metadata } from 'next';
import { Suspense } from 'react';
import SearchPageClient from './SearchPageClient';

export const metadata: Metadata = {
  title: 'Buscar Produtos',
  robots: { index: false, follow: true },
};

export default function BuscaPage() {
  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  );
}
