import type { Metadata } from 'next';
import { Geist, Geist_Mono, Original_Surfer } from 'next/font/google';
import './globals.css';
import AppProvider from '@/lib/context/AppProvider';
import CartSidebar from '@/components/layout/CartSidebar';

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
  title: {
    default:
      'Surfers Paradise — 20 anos no mercado de acessórios e equipamentos para o Surf',
    template: '%s | Surfers Paradise',
  },
  description:
    'Surfers Paradise — 20 anos no mercado de acessórios e equipamentos para o Surf. Pranchas, quilhas, leashes, decks, wetsuits e muito mais. Parcele em até 10x sem juros.',
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
        <AppProvider>
          {children}
          <CartSidebar />
        </AppProvider>
      </body>
    </html>
  );
}
