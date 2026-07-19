import type { Metadata } from 'next';
// 📄 src/app/(account)/layout.tsx
// v2: GATE de autenticação server-side — sem sessão, redireciona para o
//     login antes de renderizar qualquer página da área do cliente.
//     (Antes, o visitante deslogado via um spinner eterno: as páginas só
//     fazem fetch se session?.user existir, e o loading nunca resolvia.)

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import AccountSidebar from '@/components/account/AccountSidebar';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='flex flex-col md:flex-row gap-8'>
          <AccountSidebar />
          <div className='flex-1'>{children}</div>
        </div>
      </div>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
