// src/app/(shop)/colecao/[slug]/page.tsx
// Coleção — metadata dinâmica derivada do slug (placeholder até a feature
// de coleções ser implementada).

import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function humanize(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = humanize(slug);
  return {
    title: `Coleção ${name}`,
    description: `Coleção ${name}: equipamentos e acessórios de surf selecionados com os melhores preços em até 10x sem juros.`,
    alternates: { canonical: `/colecao/${slug}` },
  };
}

export default async function ColecaoPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <div className='max-w-7xl mx-auto px-4 py-8'>
      <h1 className='text-2xl font-bold mb-6 capitalize'>
        {slug.replace(/-/g, ' ')}
      </h1>
      <p className='text-gray-500'>Produtos desta colecao em breve...</p>
    </div>
  );
}
