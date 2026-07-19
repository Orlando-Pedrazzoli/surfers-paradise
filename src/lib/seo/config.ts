// src/lib/seo/config.ts
// ⚙️ Configuração SEO central — fonte única de verdade para domínio, nome,
// descrições e imagens padrão. Usado por layout, sitemap, robots e JSON-LD.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.surfersparadise.com.br';

export const SITE_NAME = 'Surfers Paradise';

export const SITE_TITLE =
  'Surfers Paradise — Pranchas, Quilhas, Leashes, Decks e Wetsuits';

export const SITE_DESCRIPTION =
  'Surf Shop Online com 20 anos de mercado. Quilhas FCS II e Futures, leashes, decks, wetsuits Rip Curl, O\u2019Neill, Hurley e Vissla, pranchas e acessórios de surf em até 10x sem juros.';

export const SITE_KEYWORDS = [
  'surf shop',
  'loja de surf',
  'quilhas fcs',
  'quilhas fcs 2',
  'quilhas futures',
  'leash de surf',
  'cordinha de prancha',
  'deck de surf',
  'wetsuit',
  'long john',
  'roupa de borracha',
  'prancha de surf',
  'parafina',
  'acessórios de surf',
  'rip curl',
  'oneill',
  'hurley',
  'vissla',
];

// Imagem OG padrão (1200x630) — colocar em /public/images/og-default.jpg
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-default.jpg`;

export const CONTACT = {
  // Atualizar com os dados reais da loja (Adriana / OMBAK BARU)
  email: 'contato@surfersparadise.com.br',
  phone: '+55-11-00000-0000',
  addressLocality: 'São Paulo',
  addressRegion: 'SP',
  addressCountry: 'BR',
};

export const SOCIAL_LINKS: string[] = [
  // Adicionar quando existirem:
  // 'https://www.instagram.com/surfersparadise',
  // 'https://www.facebook.com/surfersparadise',
];

/** Junta caminho relativo ao domínio canónico, sem barras duplicadas. */
export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Remove HTML e trunca texto para meta description (máx. 160 chars). */
export function toMetaDescription(
  input: string | undefined | null,
  fallback: string = SITE_DESCRIPTION,
): string {
  if (!input) return fallback;
  const text = input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return fallback;
  return text.length > 157 ? `${text.slice(0, 157).trimEnd()}…` : text;
}
