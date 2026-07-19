// src/app/(institutional)/contato/page.tsx
// 🔍 Server wrapper SEO da página de contato.

import type { Metadata } from 'next';
import { Suspense } from 'react';
import ContactPageClient from './ContactPageClient';

export const metadata: Metadata = {
  title: 'Contato — Fale com a Surfers Paradise',
  description:
    'Fale com a equipe da Surfers Paradise: dúvidas sobre produtos, pedidos, envios e parcerias. Atendimento por e-mail e WhatsApp.',
  alternates: { canonical: '/contato' },
};

export default function ContatoPage() {
  return (
    <Suspense>
      <ContactPageClient />
    </Suspense>
  );
}
