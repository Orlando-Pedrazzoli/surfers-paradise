// src/app/robots.ts
// 🤖 robots.txt gerado pelo Next (App Router).
// ⚠️ IMPORTANTE: apagar public/robots.txt (vazio) — conflita com este ficheiro.

import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin-login',
          '/api/',
          '/pos',
          '/checkout',
          '/carrinho',
          '/pagamento/',
          '/pedido-confirmado',
          '/minha-conta',
          '/meus-pedidos',
          '/enderecos',
          '/avaliacoes',
          '/login',
          '/cadastro',
          '/verificar-email',
          '/busca', // resultados de busca não devem consumir crawl budget
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
