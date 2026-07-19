// src/app/layout.tsx
// Root layout com sistema SEO completo: metadataBase, Open Graph, Twitter
// Cards, robots, canonical e JSON-LD (OnlineStore + WebSite com SearchAction).

import type { Metadata } from 'next';
import { Geist, Geist_Mono, Original_Surfer } from 'next/font/google';
import './globals.css';
import AppProvider from '@/lib/context/AppProvider';
import CartSidebar from '@/components/layout/CartSidebar';
// import NewsletterModalTrigger from '@/components/marketing/NewsletterModalTrigger'; // desativado temporariamente a pedido do cliente
import CookieConsent from '@/components/shared/CookieConsent';
import JsonLd from '@/components/seo/JsonLd';
import { organizationJsonLd, webSiteJsonLd } from '@/lib/seo/jsonld';
import {
  SITE_URL,
  SITE_NAME,
  SITE_TITLE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  DEFAULT_OG_IMAGE,
} from '@/lib/seo/config';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});
const originalSurfer = Original_Surfer({
  weight: '400',
  variable: '--font-original-surfer',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  // ⚠️ NÃO definir alternates.canonical aqui — seria herdado por todas as
  // páginas sem canonical próprio, apontando o site inteiro para a home.
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  // Após verificar no Google Search Console, colar o token aqui:
  // verification: { google: 'TOKEN_GSC' },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='pt-BR'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${originalSurfer.variable} antialiased`}
      >
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={webSiteJsonLd()} />
        <AppProvider>
          {children}
          <CartSidebar />
          {/* <NewsletterModalTrigger /> */}
          {/* desativado temporariamente a pedido do cliente */}
          <CookieConsent />
        </AppProvider>
      </body>
    </html>
  );
}
