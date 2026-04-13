'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from '@/lib/context/CartProvider';

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <Toaster
          position='top-right'
          toastOptions={{
            duration: 3000,
            style: { background: '#1a1a1a', color: '#fff', fontSize: '14px' },
          }}
        />
      </CartProvider>
    </SessionProvider>
  );
}
