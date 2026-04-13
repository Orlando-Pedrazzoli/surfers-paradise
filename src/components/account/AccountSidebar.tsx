'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { User, Package, MapPin, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const menuItems = [
  { label: 'Minha Conta', href: '/minha-conta', icon: User },
  { label: 'Meus Pedidos', href: '/meus-pedidos', icon: Package },
  { label: 'Meus Endereços', href: '/enderecos', icon: MapPin },
];

export default function AccountSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className='w-full md:w-64 flex-shrink-0'>
      <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
        {/* User Info */}
        <div className='p-4 bg-[#1A1A1A]'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-[#FF6600] text-white rounded-full flex items-center justify-center font-bold text-sm'>
              {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className='text-white font-medium text-sm truncate'>
                {session?.user?.name || 'Cliente'}
              </p>
              <p className='text-gray-400 text-xs truncate'>
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className='py-2'>
          {menuItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                  isActive
                    ? 'text-[#FF6600] font-medium bg-orange-50 border-l-3 border-[#FF6600]'
                    : 'text-gray-600 hover:text-[#FF6600] hover:bg-gray-50',
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className='border-t border-gray-100 py-2'>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className='flex items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:text-red-500 transition-colors w-full'
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
