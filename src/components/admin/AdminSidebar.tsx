'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tags,
  ShoppingCart,
  Users,
  Star,
  Image,
  Ticket,
  FileText,
  Settings,
  ClipboardList,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils/cn';

const menuItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Produtos', href: '/admin/produtos', icon: Package },
  { label: 'Categorias', href: '/admin/categorias', icon: FolderTree },
  { label: 'Marcas', href: '/admin/marcas', icon: Tags },
  { label: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart },
  { label: 'Clientes', href: '/admin/clientes', icon: Users },
  { label: 'Avaliações', href: '/admin/avaliacoes', icon: Star },
  { label: 'Blog', href: '/admin/blog', icon: FileText },
  { label: 'Banners', href: '/admin/configuracoes#banners', icon: Image },
  { label: 'Cupons', href: '/admin/cupons', icon: Ticket },
  { label: 'Romaneios', href: '/admin/romaneios', icon: ClipboardList },
  { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className='w-64 min-h-screen bg-gray-900 text-white flex flex-col'>
      <div className='p-6 border-b border-gray-700'>
        <h2 className='text-lg font-bold'>Surfers Paradise</h2>
        <p className='text-sm text-gray-400'>Painel Admin</p>
      </div>

      <nav className='flex-1 py-4'>
        {menuItems.map(item => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-6 py-3 text-sm transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white',
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className='p-4 border-t border-gray-700'>
        <button
          onClick={() => signOut({ callbackUrl: '/admin-login' })}
          className='flex items-center gap-3 px-2 py-2 text-sm text-gray-300 hover:text-white transition-colors w-full'
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
