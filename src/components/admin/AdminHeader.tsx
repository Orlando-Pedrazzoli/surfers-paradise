'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Bell, ExternalLink } from 'lucide-react';

export default function AdminHeader() {
  const { data: session } = useSession();

  const userName = session?.user?.name || 'Admin';
  const userEmail = session?.user?.email || '';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <header className='h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6'>
      {/* Left — Breadcrumb area */}
      <div />

      {/* Right — Actions */}
      <div className='flex items-center gap-4'>
        {/* Visit store */}
        <Link
          href='/'
          target='_blank'
          className='hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#FF6600] transition-colors'
        >
          <ExternalLink size={14} />
          Ver Loja
        </Link>

        {/* Notifications placeholder */}
        <button className='relative p-2 text-gray-400 hover:text-gray-600 transition-colors'>
          <Bell size={18} />
        </button>

        {/* Divider */}
        <div className='w-px h-8 bg-gray-200' />

        {/* User */}
        <div className='flex items-center gap-3'>
          <div className='hidden sm:block text-right'>
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
  );
}
