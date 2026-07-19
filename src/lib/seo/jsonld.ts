// src/lib/seo/jsonld.ts
// 🧩 Builders de dados estruturados (schema.org / JSON-LD).
// Renderizar com <JsonLd data={...} /> em server components.
// Schemas priorizados: Organization, WebSite+SearchAction, Product+Offer,
// BreadcrumbList, BlogPosting, CollectionPage — os que geram rich results.

import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SOCIAL_LINKS,
  absoluteUrl,
  toMetaDescription,
} from './config';

type JsonLdObject = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Site-wide (root layout)
// ---------------------------------------------------------------------------

export function organizationJsonLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/android-chrome-512x512.png`,
    image: DEFAULT_OG_IMAGE,
    description: SITE_DESCRIPTION,
    ...(SOCIAL_LINKS.length > 0 && { sameAs: SOCIAL_LINKS }),
  };
}

export function webSiteJsonLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'pt-BR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/busca?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ---------------------------------------------------------------------------
// Produto
// ---------------------------------------------------------------------------

export interface ProductForJsonLd {
  name: string;
  slug: string;
  description?: string;
  richDescription?: string;
  sku?: string;
  price: number;
  images?: string[];
  thumbnail?: string;
  stock?: number;
  brand?: { name: string } | null;
  category?: { name: string; slug: string } | null;
  updatedAt?: Date | string;
}

export function productJsonLd(product: ProductForJsonLd): JsonLdObject {
  const url = absoluteUrl(`/produtos/${product.slug}`);
  const images = [
    ...(product.thumbnail ? [product.thumbnail] : []),
    ...(product.images || []),
  ].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.name,
    url,
    ...(images.length > 0 && { image: images }),
    description: toMetaDescription(
      product.description || product.richDescription,
    ),
    ...(product.sku && { sku: product.sku }),
    ...(product.brand?.name && {
      brand: { '@type': 'Brand', name: product.brand.name },
    }),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'BRL',
      price: product.price.toFixed(2),
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        (product.stock ?? 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: { '@id': `${SITE_URL}/#organization` },
    },
  };
}

// ---------------------------------------------------------------------------
// Breadcrumbs
// ---------------------------------------------------------------------------

export interface BreadcrumbItem {
  name: string;
  path: string; // relativo, ex: '/produtos/quilha-fcs-ii'
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Início', path: '/' }, ...items].map(
      (item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: absoluteUrl(item.path),
      }),
    ),
  };
}

// ---------------------------------------------------------------------------
// Categoria / Marca / Coleção (páginas de listagem)
// ---------------------------------------------------------------------------

export function collectionPageJsonLd(params: {
  name: string;
  description?: string;
  path: string;
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: params.name,
    url: absoluteUrl(params.path),
    description: toMetaDescription(params.description),
    isPartOf: { '@id': `${SITE_URL}/#website` },
    inLanguage: 'pt-BR',
  };
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export interface BlogPostForJsonLd {
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  author?: string;
  publishedAt?: Date | string;
  updatedAt?: Date | string;
}

export function blogPostingJsonLd(post: BlogPostForJsonLd): JsonLdObject {
  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: post.title,
    url,
    mainEntityOfPage: url,
    ...(post.coverImage && { image: [post.coverImage] }),
    description: toMetaDescription(post.excerpt),
    ...(post.publishedAt && {
      datePublished: new Date(post.publishedAt).toISOString(),
    }),
    ...(post.updatedAt && {
      dateModified: new Date(post.updatedAt).toISOString(),
    }),
    author: {
      '@type': 'Person',
      name: post.author || SITE_NAME,
    },
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'pt-BR',
  };
}
