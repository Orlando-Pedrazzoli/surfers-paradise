// src/components/admin/AdminBottomNav.tsx
// Barra de navegação fixa inferior (mobile, < lg) — estilo app.
//   Início · Pedidos (badge "a preparar") · [+ Novo produto] · Produtos · Mais
// "Mais" abre um bottom sheet com o resto do menu, Ver Loja e Sair.
// Altura fixa ADMIN_BOTTOM_NAV_HEIGHT (+ safe-area do iPhone); o layout
// reserva esse espaço no <main> via a classe .admin-main (globals.css).
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Plus,
  Menu,
  X,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { ADMIN_MENU, isNavActive } from './adminNav';

export const ADMIN_BOTTOM_NAV_HEIGHT = 64;

const ORANGE = '#FF6600';

export default function AdminBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  // O sheet fica aberto só na rota em que foi aberto → fecha ao navegar
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const moreOpen = openedAt === pathname;
  const setMoreOpen = (open: boolean) => setOpenedAt(open ? pathname : null);
  const [toPrepare, setToPrepare] = useState(0);

  // Trava o scroll do body com o sheet aberto
  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [moreOpen]);

  // Badge: pedidos online pagos aguardando preparo (status confirmed)
  useEffect(() => {
    let cancelled = false;
    fetch('/api/orders?status=confirmed&channel=online&limit=1')
      .then(r => r.json())
      .then(d => {
        if (!cancelled && d?.success) setToPrepare(d.pagination?.total || 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const tabs = [
    { label: 'Início', href: '/admin', icon: LayoutDashboard },
    {
      label: 'Pedidos',
      href: '/admin/pedidos',
      icon: Receipt,
      badge: toPrepare,
    },
    { label: 'Produtos', href: '/admin/produtos', icon: Package },
  ];

  const mainHrefs = new Set(tabs.map(t => t.href));
  const moreItems = ADMIN_MENU.filter(i => !mainHrefs.has(i.href));
  const moreActive = moreItems.some(i => isNavActive(pathname, i.href));

  const renderTab = (t: (typeof tabs)[number]) => {
    const active =
      t.href === '/admin/produtos'
        ? isNavActive(pathname, t.href) && pathname !== '/admin/produtos/novo'
        : isNavActive(pathname, t.href);
    return (
      <Link
        key={t.href}
        href={t.href}
        className='flex-1 flex flex-col items-center justify-center gap-0.5 relative'
        style={{ color: active ? ORANGE : '#6B7280' }}
      >
        <span className='relative'>
          <t.icon size={22} strokeWidth={active ? 2.4 : 2} />
          {!!t.badge && t.badge > 0 && (
            <span
              className='absolute -top-1.5 -right-2.5 rounded-full text-white text-[10px] font-bold flex items-center justify-center'
              style={{
                background: '#DC2626',
                minWidth: 18,
                height: 18,
                padding: '0 4px',
              }}
            >
              {t.badge > 99 ? '99+' : t.badge}
            </span>
          )}
        </span>
        <span className='text-[10px] font-medium leading-none'>{t.label}</span>
      </Link>
    );
  };

  const newActive = pathname === '/admin/produtos/novo';

  return (
    <>
      {/* BARRA INFERIOR */}
      <nav
        className='lg:hidden fixed left-0 right-0 bottom-0 bg-white border-t border-gray-200'
        style={{
          zIndex: 45,
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        }}
        aria-label='Navegação do painel'
      >
        <div
          className='flex items-stretch'
          style={{ height: ADMIN_BOTTOM_NAV_HEIGHT }}
        >
          {renderTab(tabs[0])}
          {renderTab(tabs[1])}

          {/* FAB central — Novo produto */}
          <div className='flex-1 flex items-center justify-center'>
            <Link
              href='/admin/produtos/novo'
              aria-label='Novo produto'
              className='flex items-center justify-center rounded-full text-white'
              style={{
                width: 52,
                height: 52,
                marginTop: -22,
                background: newActive ? '#e55b00' : ORANGE,
                boxShadow: '0 6px 16px rgba(255,102,0,0.35)',
                border: '4px solid #fff',
              }}
            >
              <Plus size={26} strokeWidth={2.6} />
            </Link>
          </div>

          {renderTab(tabs[2])}

          <button
            type='button'
            onClick={() => setMoreOpen(true)}
            className='flex-1 flex flex-col items-center justify-center gap-0.5'
            style={{ color: moreActive || moreOpen ? ORANGE : '#6B7280' }}
          >
            <Menu size={22} strokeWidth={moreActive ? 2.4 : 2} />
            <span className='text-[10px] font-medium leading-none'>Mais</span>
          </button>
        </div>
      </nav>

      {/* SHEET "MAIS" */}
      {moreOpen && (
        <div className='lg:hidden fixed inset-0' style={{ zIndex: 60 }}>
          <button
            type='button'
            aria-label='Fechar menu'
            className='absolute inset-0 w-full h-full'
            style={{ background: 'rgba(0,0,0,0.45)' }}
            onClick={() => setMoreOpen(false)}
          />
          <div
            className='absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl'
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
              maxHeight: '85vh',
              overflowY: 'auto',
              animation: 'adminSheetUp 0.22s ease-out',
            }}
          >
            <div className='flex justify-center pt-2'>
              <span className='block w-10 h-1 rounded-full bg-gray-300' />
            </div>
            <div className='flex items-center justify-between px-5 pt-3 pb-2'>
              <div className='min-w-0'>
                <p className='font-bold text-gray-900 truncate'>
                  {session?.user?.name || 'Admin'}
                </p>
                <p className='text-xs text-gray-400 truncate'>
                  {session?.user?.email || ''}
                </p>
              </div>
              <button
                type='button'
                onClick={() => setMoreOpen(false)}
                className='p-2 -mr-2 text-gray-500'
                aria-label='Fechar'
              >
                <X size={22} />
              </button>
            </div>

            <div className='grid grid-cols-3 gap-2 px-4 py-2'>
              {moreItems.map(item => {
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className='flex flex-col items-center justify-center gap-1.5 rounded-xl text-center'
                    style={{
                      padding: '14px 6px',
                      background: active ? '#FFF1E6' : '#F3F4F6',
                      color: active ? ORANGE : '#374151',
                    }}
                  >
                    <item.icon size={22} />
                    <span className='text-xs font-medium leading-tight'>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className='px-4 pt-3 space-y-2'>
              <Link
                href='/'
                target='_blank'
                className='flex items-center gap-3 rounded-xl text-gray-700 text-sm font-medium'
                style={{ padding: '12px 14px', background: '#F3F4F6' }}
              >
                <ExternalLink size={18} />
                Ver Loja
              </Link>
              <button
                type='button'
                onClick={() => signOut({ callbackUrl: '/' })}
                className='w-full flex items-center gap-3 rounded-xl text-red-600 text-sm font-medium'
                style={{ padding: '12px 14px', background: '#FEF2F2' }}
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
