// src/app/(shop)/marca/[slug]/page.tsx
// 🔍 Server wrapper SEO da página de marca.
// Metadata dinâmica + JSON-LD CollectionPage e BreadcrumbList.

import type { Metadata } from 'next';
import BrandPageClient from './BrandPageClient';
import JsonLd from '@/components/seo/JsonLd';
import { getBrandForSeo } from '@/lib/seo/queries';
import { collectionPageJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld';
import { toMetaDescription, absoluteUrl, SITE_NAME } from '@/lib/seo/config';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandForSeo(slug);

  if (!brand) {
    return {
      title: 'Marca não encontrada',
      robots: { index: false, follow: false },
    };
  }

  const title = `${brand.name} — Produtos Originais`;
  const description = toMetaDescription(
    brand.description,
    `Produtos ${brand.name} originais com os melhores preços em até 10x sem juros na ${SITE_NAME}. Envio para todo o Brasil.`,
  );
  const canonical = `/marca/${brand.slug}`;

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

export default async function BrandPage({ params }: PageProps) {
  const { slug } = await params;
  const brand = await getBrandForSeo(slug);
  const path = `/marca/${slug}`;

  return (
    <>
      {brand && (
        <>
          <JsonLd
            data={collectionPageJsonLd({
              name: brand.name,
              description: brand.description,
              path,
            })}
          />
          <JsonLd data={breadcrumbJsonLd([{ name: brand.name, path }])} />
        </>
      )}
      <BrandPageClient params={params} />
    </>
  );
}
