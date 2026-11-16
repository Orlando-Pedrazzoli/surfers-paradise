// src/components/admin/AdminHeader.tsx
// v2 (mobile): no celular vira uma app bar fixa no topo (logo + título da
//     página + avatar). Em desktop mantém o layout original.
'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Bell, ExternalLink } from 'lucide-react';
import { getAdminPageTitle } from './adminNav';

export default function AdminHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const userName = session?.user?.name || 'Admin';
  const userEmail = session?.user?.email || '';
  const initial = userName.charAt(0).toUpperCase();
  const title = getAdminPageTitle(pathname);

  return (
    <>
      {/* MOBILE — app bar */}
      <header
        className='lg:hidden sticky top-0 z-40 bg-[#1A1A1A] text-white flex items-center gap-3 px-4'
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          minHeight: 56,
        }}
      >
        <Link href='/admin' className='shrink-0' aria-label='Início'>
          <Image
            src='/images/logo-navbar.png'
            alt='Surfers Paradise'
            width={32}
            height={32}
            className='w-8 h-8 object-contain'
          />
        </Link>
        <div className='flex-1 min-w-0 py-2'>
          <p className='text-[9px] text-gray-400 uppercase tracking-widest leading-none'>
            Surfers Paradise
          </p>
          <p className='text-base font-bold truncate leading-tight mt-0.5'>
            {title}
          </p>
        </div>
        <div
          className='w-9 h-9 shrink-0 bg-[#FF6600] text-white rounded-full flex items-center justify-center text-sm font-bold'
          title={userEmail}
        >
          {initial}
        </div>
      </header>

      {/* DESKTOP */}
      <header className='hidden lg:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-6'>
        <div />
        <div className='flex items-center gap-4'>
          <Link
            href='/'
            target='_blank'
            className='flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#FF6600] transition-colors'
          >
            <ExternalLink size={14} />
            Ver Loja
          </Link>

          <button className='relative p-2 text-gray-400 hover:text-gray-600 transition-colors'>
            <Bell size={18} />
          </button>

          <div className='w-px h-8 bg-gray-200' />

          <div className='flex items-center gap-3'>
            <div className='text-right'>
              <p className='text-sm font-medium text-gray-900 leading-tight'>
                {userName}
              </p>
              <p className='text-[10px] text-gray-400'>{userEmail}</p>
            </div>
            <div className='w-9 h-9 bg-[#FF6600] text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md shadow-[#FF6600]/20'>
              {initial}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
