'use client';

import { useSession } from 'next-auth/react';

export default function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header className='h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6'>
      <div />
      <div className='flex items-center gap-3'>
        <span className='text-sm text-gray-600'>
          {session?.user?.name || session?.user?.email}
        </span>
        <div className='w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium'>
          {session?.user?.name?.charAt(0) || 'A'}
        </div>
      </div>
    </header>
  );
}
