// src/components/admin/adminNav.ts
// Itens de navegação do painel admin — fonte única usada pela sidebar
// (desktop) e pela barra inferior + menu "Mais" (mobile).
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  DollarSign,
  BarChart3,
  Package,
  FolderTree,
  Tags,
  Truck,
  Ticket,
  Image as ImageIcon,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const ADMIN_MENU: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'POS Balcão', href: '/pos', icon: ShoppingCart },
  { label: 'Pedidos', href: '/admin/pedidos', icon: Receipt },
  { label: 'Caixa', href: '/admin/caixa', icon: DollarSign },
  { label: 'Relatórios', href: '/admin/relatorios', icon: BarChart3 },
  { label: 'Produtos', href: '/admin/produtos', icon: Package },
  { label: 'Categorias', href: '/admin/categorias', icon: FolderTree },
  { label: 'Marcas', href: '/admin/marcas', icon: Tags },
  { label: 'Fornecedores', href: '/admin/fornecedores', icon: Truck },
  { label: 'Cupons', href: '/admin/cupons', icon: Ticket },
  { label: 'Banners', href: '/admin/configuracoes', icon: ImageIcon },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(href + '/');
}

// Título curto da página atual (header mobile)
export function getAdminPageTitle(pathname: string): string {
  if (pathname === '/admin/produtos/novo') return 'Novo Produto';
  if (/^\/admin\/produtos\/[^/]+$/.test(pathname)) return 'Editar Produto';
  if (/^\/admin\/pedidos\/[^/]+$/.test(pathname)) return 'Pedido';
  const match = [...ADMIN_MENU]
    .sort((a, b) => b.href.length - a.href.length)
    .find(i => isNavActive(pathname, i.href));
  return match?.label || 'Painel Admin';
}
