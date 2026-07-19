// src/app/(shop)/produtos/[slug]/page.tsx
// 🔍 Server wrapper SEO da página de produto.
// Gera metadata dinâmica (title, description, canonical, Open Graph) e injeta
// JSON-LD Product + BreadcrumbList. A UI interativa vive em ProductPageClient.

import type { Metadata } from 'next';
import ProductPageClient from './ProductPageClient';
import JsonLd from '@/components/seo/JsonLd';
import { getProductForSeo } from '@/lib/seo/queries';
import { productJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld';
import { toMetaDescription, absoluteUrl } from '@/lib/seo/config';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductForSeo(slug);

  if (!product) {
    return {
      title: 'Produto não encontrado',
      robots: { index: false, follow: false },
    };
  }

  const title = product.brand?.name
    ? `${product.name} — ${product.brand.name}`
    : product.name;
  const description = toMetaDescription(
    product.description || product.richDescription,
  );
  const canonical = `/produtos/${product.slug}`;
  const ogImage = product.thumbnail || product.images?.[0];

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: absoluteUrl(canonical),
      title,
      description,
      ...(ogImage && { images: [{ url: ogImage, alt: product.name }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductForSeo(slug);

  return (
    <>
      {product && (
        <>
          <JsonLd data={productJsonLd(product)} />
          <JsonLd
            data={breadcrumbJsonLd([
              ...(product.category
                ? [
                    {
                      name: product.category.name,
                      path: `/categoria/${product.category.slug}`,
                    },
                  ]
                : []),
              { name: product.name, path: `/produtos/${product.slug}` },
            ])}
          />
        </>
      )}
      <ProductPageClient params={params} />
    </>
  );
}
