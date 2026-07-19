// src/app/sitemap.ts
// 🗺️ Sitemap dinâmico gerado a partir do MongoDB.
// Prioridades espelham a estratégia do onlysurf.com.br:
// home 1.0 → produtos 0.95 → categorias/marcas 0.8 → blog 0.8 → institucional 0.4–0.6
// Revalidado a cada hora para refletir novos produtos do catálogo.

import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/config';
import {
  getAllProductSlugs,
  getAllCategorySlugs,
  getAllBrandSlugs,
  getAllBlogSlugs,
} from '@/lib/seo/queries';

export const revalidate = 3600; // 1 hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [products, categories, brands, posts] = await Promise.all([
    getAllProductSlugs(),
    getAllCategorySlugs(),
    getAllBrandSlugs(),
    getAllBlogSlugs(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/produtos`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/promocao`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/a-empresa`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/contato`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    { url: `${SITE_URL}/faq`, changeFrequency: 'monthly', priority: 0.4 },
    {
      url: `${SITE_URL}/formas-pagamento`,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/prazos-entrega`,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/trocas-devolucoes`,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/politica-privacidade`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    { url: `${SITE_URL}/termos`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map(c => ({
    url: `${SITE_URL}/categoria/${c.slug}`,
    lastModified: c.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const brandPages: MetadataRoute.Sitemap = brands.map(b => ({
    url: `${SITE_URL}/marca/${b.slug}`,
    lastModified: b.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productPages: MetadataRoute.Sitemap = products.map(p => ({
    url: `${SITE_URL}/produtos/${p.slug}`,
    lastModified: p.updatedAt || now,
    changeFrequency: 'weekly',
    priority: 0.95,
  }));

  const blogPages: MetadataRoute.Sitemap = posts.map(post => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt || now,
    changeFrequency: 'yearly',
    priority: 0.8,
  }));

  return [
    ...staticPages,
    ...categoryPages,
    ...brandPages,
    ...productPages,
    ...blogPages,
  ];
}
