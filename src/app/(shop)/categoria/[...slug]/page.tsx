// src/app/(shop)/categoria/[...slug]/page.tsx
// 🔍 Server wrapper SEO da página de categoria (catch-all).
// Usa seoTitle/seoDescription do modelo Category quando preenchidos no admin,
// com fallback automático. Injeta JSON-LD CollectionPage + BreadcrumbList.

import type { Metadata } from 'next';
import CategoryPageClient from './CategoryPageClient';
import JsonLd from '@/components/seo/JsonLd';
import { getCategoryForSeo } from '@/lib/seo/queries';
import { collectionPageJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld';
import { toMetaDescription, absoluteUrl, SITE_NAME } from '@/lib/seo/config';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // O último segmento do catch-all é a categoria/subcategoria efetiva
  const categorySlug = slug[slug.length - 1];
  const category = await getCategoryForSeo(categorySlug);

  if (!category) {
    return {
      title: 'Categoria não encontrada',
      robots: { index: false, follow: false },
    };
  }

  const title = category.seoTitle || `${category.name} — Equipamentos de Surf`;
  const description = toMetaDescription(
    category.seoDescription || category.description,
    `${category.name} com os melhores preços em até 10x sem juros na ${SITE_NAME}. Produtos originais com envio para todo o Brasil.`,
  );
  const canonical = `/categoria/${slug.join('/')}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: absoluteUrl(canonical),
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const categorySlug = slug[slug.length - 1];
  const category = await getCategoryForSeo(categorySlug);
  const path = `/categoria/${slug.join('/')}`;

  return (
    <>
      {category && (
        <>
          <JsonLd
            data={collectionPageJsonLd({
              name: category.name,
              description: category.seoDescription || category.description,
              path,
            })}
          />
          <JsonLd data={breadcrumbJsonLd([{ name: category.name, path }])} />
        </>
      )}
      <CategoryPageClient params={params} />
    </>
  );
}
