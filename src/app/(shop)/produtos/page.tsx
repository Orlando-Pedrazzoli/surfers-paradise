// src/app/(shop)/produtos/page.tsx
// 🔍 Server wrapper SEO da listagem geral de produtos.

import type { Metadata } from 'next';
import { Suspense } from 'react';
import ProductsListClient from './ProductsListClient';

export const metadata: Metadata = {
  title: 'Todos os Produtos — Quilhas, Leashes, Decks e Wetsuits',
  description:
    'Catálogo completo de equipamentos de surf: quilhas FCS II e Futures, leashes, decks, wetsuits e acessórios das melhores marcas em até 10x sem juros.',
  alternates: { canonical: '/produtos' },
};

export default function ProdutosPage() {
  return (
    <Suspense>
      <ProductsListClient />
    </Suspense>
  );
}
