// src/app/admin/layout.tsx
// v2 (mobile): layout tipo app no celular — app bar no topo, conteúdo com
//     padding menor e barra de navegação fixa inferior (<AdminBottomNav />).
//     Desktop (lg+) mantém sidebar + header originais.
import type { Viewport } from 'next';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminBottomNav from '@/components/admin/AdminBottomNav';

export const metadata = {
  title: 'Admin',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1A1A1A',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='flex min-h-screen bg-gray-100'>
      <AdminSidebar />
      <div className='flex-1 min-w-0 flex flex-col'>
        <AdminHeader />
        <main className='admin-main flex-1 min-w-0'>{children}</main>
      </div>
      <AdminBottomNav />
    </div>
  );
}
