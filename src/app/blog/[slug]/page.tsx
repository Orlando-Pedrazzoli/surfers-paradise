// src/app/blog/[slug]/page.tsx
// Artigo do blog — generateMetadata dinâmica + JSON-LD BlogPosting.
// Posts geridos em /admin/blog (modelo BlogPost, isPublished: true).

import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { getBlogPostForSeo } from '@/lib/seo/queries';
import { blogPostingJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld';
import { toMetaDescription, absoluteUrl } from '@/lib/seo/config';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostForSeo(slug);

  if (!post) {
    return {
      title: 'Artigo não encontrado',
      robots: { index: false, follow: false },
    };
  }

  const canonical = `/blog/${post.slug}`;
  const description = toMetaDescription(post.excerpt);

  return {
    title: post.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: absoluteUrl(canonical),
      title: post.title,
      description,
      ...(post.coverImage && { images: [{ url: post.coverImage }] }),
      ...(post.publishedAt && {
        publishedTime: new Date(post.publishedAt).toISOString(),
      }),
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPostForSeo(slug);

  return (
    <div className='max-w-3xl mx-auto px-4 py-8'>
      {post && (
        <>
          <JsonLd data={blogPostingJsonLd(post)} />
          <JsonLd
            data={breadcrumbJsonLd([
              { name: 'Blog', path: '/blog' },
              { name: post.title, path: `/blog/${post.slug}` },
            ])}
          />
        </>
      )}
      <h1 className='text-3xl font-bold mb-4 capitalize'>
        {post?.title || slug.replace(/-/g, ' ')}
      </h1>
      <p className='text-gray-500'>Conteudo em breve...</p>
    </div>
  );
}
