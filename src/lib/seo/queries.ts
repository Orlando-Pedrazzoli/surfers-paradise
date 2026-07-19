// src/lib/seo/queries.ts
// 🔎 Queries lean ao MongoDB usadas por generateMetadata e sitemap.ts.
// Só campos necessários para SEO — nunca dados sensíveis (custo, stock interno).

import connectDB from '@/lib/db/connect';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import Brand from '@/lib/models/Brand';
import BlogPost from '@/lib/models/BlogPost';

// Filtro da loja pública — o mesmo usado por /api/products
const PUBLIC_PRODUCT_FILTER = { isActive: true, isPublishedOnline: true };

export interface SeoProduct {
  name: string;
  slug: string;
  description?: string;
  richDescription?: string;
  sku?: string;
  price: number;
  images?: string[];
  thumbnail?: string;
  stock?: number;
  brand?: { name: string; slug: string } | null;
  category?: { name: string; slug: string } | null;
  updatedAt?: Date;
}

export async function getProductForSeo(
  slug: string,
): Promise<SeoProduct | null> {
  try {
    await connectDB();
    const product = await Product.findOne({ slug, ...PUBLIC_PRODUCT_FILTER })
      .select(
        'name slug description richDescription sku price images thumbnail stock brand category updatedAt',
      )
      .populate('brand', 'name slug')
      .populate('category', 'name slug')
      .lean<SeoProduct>();
    return product;
  } catch {
    return null;
  }
}

export interface SeoCategory {
  name: string;
  slug: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  updatedAt?: Date;
}

export async function getCategoryForSeo(
  slug: string,
): Promise<SeoCategory | null> {
  try {
    await connectDB();
    return await Category.findOne({ slug, isActive: true })
      .select('name slug description seoTitle seoDescription updatedAt')
      .lean<SeoCategory>();
  } catch {
    return null;
  }
}

export interface SeoBrand {
  name: string;
  slug: string;
  description?: string;
  updatedAt?: Date;
}

export async function getBrandForSeo(slug: string): Promise<SeoBrand | null> {
  try {
    await connectDB();
    return await Brand.findOne({ slug, isActive: true })
      .select('name slug description updatedAt')
      .lean<SeoBrand>();
  } catch {
    return null;
  }
}

export interface SeoBlogPost {
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  author?: string;
  publishedAt?: Date;
  updatedAt?: Date;
}

export async function getBlogPostForSeo(
  slug: string,
): Promise<SeoBlogPost | null> {
  try {
    await connectDB();
    return await BlogPost.findOne({ slug, isPublished: true })
      .select('title slug excerpt coverImage author publishedAt updatedAt')
      .lean<SeoBlogPost>();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Listagens para o sitemap
// ---------------------------------------------------------------------------

export interface SlugEntry {
  slug: string;
  updatedAt?: Date;
}

export async function getAllProductSlugs(): Promise<SlugEntry[]> {
  try {
    await connectDB();
    return await Product.find(PUBLIC_PRODUCT_FILTER)
      .select('slug updatedAt')
      .lean<SlugEntry[]>();
  } catch {
    return [];
  }
}

export async function getAllCategorySlugs(): Promise<SlugEntry[]> {
  try {
    await connectDB();
    return await Category.find({ isActive: true })
      .select('slug updatedAt')
      .lean<SlugEntry[]>();
  } catch {
    return [];
  }
}

export async function getAllBrandSlugs(): Promise<SlugEntry[]> {
  try {
    await connectDB();
    return await Brand.find({ isActive: true })
      .select('slug updatedAt')
      .lean<SlugEntry[]>();
  } catch {
    return [];
  }
}

export async function getAllBlogSlugs(): Promise<SlugEntry[]> {
  try {
    await connectDB();
    return await BlogPost.find({ isPublished: true })
      .select('slug updatedAt')
      .lean<SlugEntry[]>();
  } catch {
    return [];
  }
}
