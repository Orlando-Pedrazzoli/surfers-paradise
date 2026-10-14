import type { Metadata } from 'next';
import Script from 'next/script';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Device fingerprint do Mercado Pago (security.js): define
// window.MP_DEVICE_SESSION_ID, enviado no header X-meli-session-id ao criar
// a order. Carregado AQUI, no layout do checkout, para já estar pronto quando
// o cliente chega ao passo do cartão — antes era injetado só quando o
// formulário montava, e quem pagava rápido ia sem device ID (aprovação
// menor no antifraude). O CreditCardForm mantém um fallback.
const MP_SECURITY_PROPS = { view: 'checkout' } as Record<string, string>;

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        src='https://www.mercadopago.com/v2/security.js'
        strategy='afterInteractive'
        {...MP_SECURITY_PROPS}
      />
      <AnnouncementBar />
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
