'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tags,
  Image as ImageIcon,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils/cn';

const menuItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Produtos', href: '/admin/produtos', icon: Package },
  { label: 'Categorias', href: '/admin/categorias', icon: FolderTree },
  { label: 'Marcas', href: '/admin/marcas', icon: Tags },
  { label: 'Banners', href: '/admin/configuracoes', icon: ImageIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className='w-64 min-h-screen bg-[#1A1A1A] text-white flex flex-col'>
      {/* Logo */}
      <div className='px-5 py-5 border-b border-white/10'>
        <Link href='/admin' className='flex items-center gap-3'>
          <Image
            src='/images/logo-navbar.png'
            alt='Surfers Paradise'
            width={40}
            height={40}
            className='w-10 h-10 object-contain'
          />
          <div>
            <p className='text-white font-black text-sm leading-tight'>
              SURFERS PARADISE
            </p>
            <p className='text-[9px] text-gray-500 uppercase tracking-widest'>
              Painel Admin
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className='flex-1 py-3 overflow-y-auto'>
        {menuItems.map(item => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-5 py-2.5 text-sm transition-all mx-2 rounded-lg mb-0.5',
                isActive
                  ? 'bg-[#FF6600] text-white font-medium shadow-lg shadow-[#FF6600]/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white',
              )}
            >
              <item.icon size={18} className={isActive ? 'text-white' : ''} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className='px-3 py-3 border-t border-white/10 space-y-1'>
        <Link
          href='/'
          target='_blank'
          className='flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors'
        >
          <ExternalLink size={16} />
          Ver Loja
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/admin-login' })}
          className='flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors w-full'
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}
