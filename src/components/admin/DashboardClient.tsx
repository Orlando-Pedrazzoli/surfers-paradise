'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Search,
  PackagePlus,
  PackageOpen,
  AlertCircle,
  PackageX,
  Clock,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  Tag,
  FolderTree,
  Truck,
  Users,
} from 'lucide-react';

interface DashboardStats {
  alerts: {
    lowStock: number;
    outOfStock: number;
    pendingOrders: number;
    readyToPublish: number;
  };
  today: {
    revenue: number;
    ordersCount: number;
  };
  month: {
    revenue: number;
    ordersCount: number;
    vsPrevPercent: number;
  };
  catalog: {
    products: number;
    brands: number;
    categories: number;
    suppliers: number;
  };
  customers: {
    total: number;
  };
  chart: { date: string; total: number; orders: number }[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(): string {
  const now = new Date();
  return now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

function getTime(): string {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(getTime());

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/dashboard-stats');
        const data = await res.json();
        if (data.success) setStats(data.stats);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    // Atualiza relógio a cada minuto
    const interval = setInterval(() => setTime(getTime()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#FF6600]' />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className='p-12 text-center text-gray-500'>
        Erro ao carregar estatísticas. Tente recarregar a página.
      </div>
    );
  }

  const hasAlerts =
    stats.alerts.lowStock > 0 ||
    stats.alerts.outOfStock > 0 ||
    stats.alerts.pendingOrders > 0 ||
    stats.alerts.readyToPublish > 0;

  // Máximo do gráfico (para escalar barras)
  const chartMax = Math.max(...stats.chart.map(d => d.total), 1);

  return (
    <div className='space-y-6'>
      {/* ═══════════════ HEADER ═══════════════ */}
      <div className='flex items-center justify-between flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Bem-vindo!</h1>
          <p className='text-sm text-gray-500 capitalize'>
            {formatDate()} · {time}
          </p>
        </div>
      </div>

      {/* ═══════════════ ZONA 1: ALERTAS ═══════════════ */}
      {hasAlerts ? (
        <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-5'>
          <div className='flex items-center gap-2 mb-3'>
            <AlertCircle size={18} className='text-orange-600' />
            <h2 className='font-semibold text-gray-900'>Precisam de atenção</h2>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
            {stats.alerts.outOfStock > 0 && (
              <Link
                href='/admin/produtos?context=admin&outOfStock=true'
                className='flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors'
              >
                <PackageX size={24} className='text-red-600 flex-shrink-0' />
                <div>
                  <p className='text-2xl font-bold text-red-700'>
                    {stats.alerts.outOfStock}
                  </p>
                  <p className='text-xs text-red-700'>Produtos esgotados</p>
                </div>
              </Link>
            )}
            {stats.alerts.lowStock > 0 && (
              <Link
                href='/admin/produtos?context=admin&lowStock=true'
                className='flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors'
              >
                <AlertCircle
                  size={24}
                  className='text-orange-600 flex-shrink-0'
                />
                <div>
                  <p className='text-2xl font-bold text-orange-700'>
                    {stats.alerts.lowStock}
                  </p>
                  <p className='text-xs text-orange-700'>Estoque baixo (≤3)</p>
                </div>
              </Link>
            )}
            {stats.alerts.pendingOrders > 0 && (
              <Link
                href='/admin/pedidos'
                className='flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors'
              >
                <Clock size={24} className='text-yellow-700 flex-shrink-0' />
                <div>
                  <p className='text-2xl font-bold text-yellow-700'>
                    {stats.alerts.pendingOrders}
                  </p>
                  <p className='text-xs text-yellow-700'>Pedidos pendentes</p>
                </div>
              </Link>
            )}
            {stats.alerts.readyToPublish > 0 && (
              <Link
                href='/admin/produtos?context=admin&completionStatus=complete&isPublishedOnline=false'
                className='flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors'
              >
                <Sparkles size={24} className='text-blue-600 flex-shrink-0' />
                <div>
                  <p className='text-2xl font-bold text-blue-700'>
                    {stats.alerts.readyToPublish}
                  </p>
                  <p className='text-xs text-blue-700'>Prontos para publicar</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className='bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3'>
          <Sparkles size={20} className='text-green-600' />
          <p className='text-sm text-green-800 font-medium'>
            Tudo em ordem. Nenhum alerta no momento.
          </p>
        </div>
      )}

      {/* ═══════════════ ZONA 2: AÇÕES RÁPIDAS ═══════════════ */}
      <div>
        <h2 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3'>
          Ações Rápidas
        </h2>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          {/* Abrir POS — placeholder que vai para /produtos por enquanto */}
          <Link
            href='/pos'
            className='group bg-gradient-to-br from-[#FF6600] to-[#e55b00] text-white rounded-lg p-5 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5'
          >
            <ShoppingCart size={28} className='mb-2' />
            <p className='font-bold text-base'>Abrir POS</p>
            <p className='text-xs opacity-90 mt-0.5'>Nova venda no balcão</p>
          </Link>

          <Link
            href='/admin/produtos'
            className='group bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all hover:-translate-y-0.5'
          >
            <Search size={28} className='mb-2 text-gray-700' />
            <p className='font-bold text-base text-gray-900'>Buscar Produto</p>
            <p className='text-xs text-gray-500 mt-0.5'>Por nome, SKU ou tag</p>
          </Link>

          <Link
            href='/admin/produtos/novo'
            className='group bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all hover:-translate-y-0.5'
          >
            <PackagePlus size={28} className='mb-2 text-gray-700' />
            <p className='font-bold text-base text-gray-900'>
              Cadastrar Produto
            </p>
            <p className='text-xs text-gray-500 mt-0.5'>Adicionar novo item</p>
          </Link>

          <Link
            href='/admin/produtos'
            className='group bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all hover:-translate-y-0.5'
          >
            <PackageOpen size={28} className='mb-2 text-gray-700' />
            <p className='font-bold text-base text-gray-900'>
              Entrada Mercadoria
            </p>
            <p className='text-xs text-gray-500 mt-0.5'>Atualizar estoque</p>
            <p className='text-[10px] text-gray-400 mt-2 italic'>em breve</p>
          </Link>
        </div>
      </div>

      {/* ═══════════════ ZONA 3: KPIs HOJE/MÊS ═══════════════ */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* HOJE */}
        <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-5'>
          <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
            Vendas Hoje
          </p>
          <p className='text-3xl font-black text-gray-900'>
            {formatCurrency(stats.today.revenue)}
          </p>
          <p className='text-sm text-gray-500 mt-1'>
            {stats.today.ordersCount}{' '}
            {stats.today.ordersCount === 1 ? 'venda' : 'vendas'}
          </p>
        </div>

        {/* MÊS */}
        <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-5'>
          <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
            Vendas Este Mês
          </p>
          <p className='text-3xl font-black text-gray-900'>
            {formatCurrency(stats.month.revenue)}
          </p>
          <div className='flex items-center gap-2 mt-1'>
            <span className='text-sm text-gray-500'>
              {stats.month.ordersCount}{' '}
              {stats.month.ordersCount === 1 ? 'venda' : 'vendas'}
            </span>
            {stats.month.vsPrevPercent !== 0 && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
                  stats.month.vsPrevPercent > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {stats.month.vsPrevPercent > 0 ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {Math.abs(stats.month.vsPrevPercent).toFixed(0)}%
              </span>
            )}
            {stats.month.vsPrevPercent === 0 && (
              <span className='inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600'>
                <Minus size={12} />
                vs mês anterior
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════ ZONA 4: GRÁFICO 7 DIAS ═══════════════ */}
      <div className='bg-white rounded-lg border border-gray-200 shadow-sm p-5'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='font-semibold text-gray-900'>
            Vendas dos últimos 7 dias
          </h2>
          <p className='text-xs text-gray-500'>
            Total:{' '}
            {formatCurrency(stats.chart.reduce((s, d) => s + d.total, 0))}
          </p>
        </div>
        {stats.chart.every(d => d.total === 0) ? (
          <div className='py-12 text-center text-gray-400 text-sm'>
            Sem vendas no período. Os dados aparecerão aqui assim que houver
            pedidos.
          </div>
        ) : (
          <div className='flex items-end justify-between gap-2 h-40 mt-2'>
            {stats.chart.map(d => {
              const heightPercent = (d.total / chartMax) * 100;
              const dayLabel = new Date(d.date).toLocaleDateString('pt-BR', {
                weekday: 'short',
              });
              return (
                <div
                  key={d.date}
                  className='flex-1 flex flex-col items-center gap-1 group'
                >
                  <div className='text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                    {formatCurrency(d.total)}
                  </div>
                  <div
                    className='w-full bg-gradient-to-t from-[#FF6600] to-[#FF884D] rounded-t hover:opacity-80 transition-opacity min-h-[2px]'
                    style={{ height: `${Math.max(heightPercent, 2)}%` }}
                  />
                  <div className='text-[10px] text-gray-500 capitalize'>
                    {dayLabel}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════ ZONA 5: CATÁLOGO (footer) ═══════════════ */}
      <div>
        <h2 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3'>
          Catálogo
        </h2>
        <div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
          <Link
            href='/admin/produtos'
            className='bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all'
          >
            <Package size={18} className='text-gray-400 mb-2' />
            <p className='text-2xl font-bold text-gray-900'>
              {stats.catalog.products}
            </p>
            <p className='text-xs text-gray-500'>Produtos</p>
          </Link>
          <Link
            href='/admin/marcas'
            className='bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all'
          >
            <Tag size={18} className='text-gray-400 mb-2' />
            <p className='text-2xl font-bold text-gray-900'>
              {stats.catalog.brands}
            </p>
            <p className='text-xs text-gray-500'>Marcas</p>
          </Link>
          <Link
            href='/admin/categorias'
            className='bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all'
          >
            <FolderTree size={18} className='text-gray-400 mb-2' />
            <p className='text-2xl font-bold text-gray-900'>
              {stats.catalog.categories}
            </p>
            <p className='text-xs text-gray-500'>Categorias</p>
          </Link>
          <Link
            href='/admin/fornecedores'
            className='bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all'
          >
            <Truck size={18} className='text-gray-400 mb-2' />
            <p className='text-2xl font-bold text-gray-900'>
              {stats.catalog.suppliers}
            </p>
            <p className='text-xs text-gray-500'>Fornecedores</p>
          </Link>
          <div className='bg-white border border-gray-200 rounded-lg p-4'>
            <Users size={18} className='text-gray-400 mb-2' />
            <p className='text-2xl font-bold text-gray-900'>
              {stats.customers.total}
            </p>
            <p className='text-xs text-gray-500'>Clientes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
