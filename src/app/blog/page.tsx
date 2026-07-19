// src/app/blog/page.tsx
// Listagem do blog — metadata SEO. Conteúdo gerido em /admin/blog.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — Guias e Dicas de Surf',
  description:
    'Guias de quilhas, leashes, wetsuits e equipamentos de surf. Dicas para escolher o setup ideal para o seu nível e tipo de onda.',
  alternates: { canonical: '/blog' },
};

export default function BlogPage() {
  return (
    <div className='max-w-7xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-bold mb-6'>Blog</h1>
      <p className='text-gray-500'>Artigos em breve...</p>
    </div>
  );
}
