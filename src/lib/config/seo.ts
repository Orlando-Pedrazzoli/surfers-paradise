import { company } from './company';

export const seoConfig = {
  defaultTitle: `${company.name} — ${company.slogan}`,
  titleTemplate: `%s | ${company.name}`,
  description: `${company.name} — ${company.slogan}. Pranchas, quilhas, leashes, decks, wetsuits e muito mais. Parcele em até ${company.payment.maxInstallments}x sem juros.`,
  url: company.url,
  siteName: company.name,
  locale: 'pt_BR',
  type: 'website',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: company.url,
    siteName: company.name,
  },
} as const;
