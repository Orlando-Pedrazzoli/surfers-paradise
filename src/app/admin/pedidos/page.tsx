'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Store,
  Globe,
  Loader2,
  Filter,
  X,
} from 'lucide-react';

interface OrderListItem {
  _id: string;
  orderNumber: string;
  channel: 'online' | 'pos';
  status: string;
  total: number;
  customerSnapshot: { name: string; cpf: string; phone: string; email: string };
  user: { _id: string; name: string; email: string } | null;
  payment: { method: string; status: string };
  items: { name: string; quantity: number }[];
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Aguardando', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Preparando', color: 'bg-purple-100 text-purple-700' },
  shipped: { label: 'Enviado', color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Finalizado', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

const PAYMENT_LABELS: Record<string, string> = {
  credit_card: 'Crédito',
  debit_card: 'Débito',
  boleto: 'Boleto',
  pix: 'PIX',
  cash: 'Dinheiro',
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminPedidosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(
    searchParams.get('search') || '',
  );

  const filters = useMemo(
    () => ({
      search: searchParams.get('search') || '',
      channel: searchParams.get('channel') || '',
      status: searchParams.get('status') || '',
      page: parseInt(searchParams.get('page') || '1'),
    }),
    [searchParams],
  );

  const activeFiltersCount =
    (filters.channel ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.search ? 1 : 0);

  const updateURL = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') params.delete(key);
        else params.set(key, value);
      });
      router.push(`/admin/pedidos?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const clearFilters = () => {
    setSearchInput('');
    router.push('/admin/pedidos', { scroll: false });
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', filters.page.toString());
      params.set('limit', '20');
      if (filters.search) params.set('search', filters.search);
      if (filters.channel) params.set('channel', filters.channel);
      if (filters.status) params.set('status', filters.status);

      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();

      if (data.success) {
        setOrders(data.orders);
        setPagination(data.pagination);
      }
    } catch {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL({ search: searchInput || null, page: null });
  };

  return (
    <div>
      <div className='flex items-center justify-between mb-6 flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-bold'>Pedidos</h1>
          <p className='text-sm text-gray-500 mt-1'>
            {pagination.total} pedido{pagination.total !== 1 && 's'} no total
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <form onSubmit={handleSearch} className='flex gap-2 mb-4'>
        <div className='relative flex-1'>
          <Search
            size={18}
            className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
          />
          <input
            type='text'
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder='Buscar por número do pedido, nome, CPF ou e-mail...'
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
          />
        </div>
        <button
          type='submit'
          className='px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors'
        >
          Buscar
        </button>
      </form>

      {/* FILTROS HORIZONTAIS */}
      <div className='bg-white rounded-lg shadow-sm p-3 mb-4 flex items-center gap-3 flex-wrap'>
        <Filter size={14} className='text-gray-400' />

        <select
          value={filters.channel}
          onChange={e =>
            updateURL({ channel: e.target.value || null, page: null })
          }
          className='text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
        >
          <option value=''>Todos os canais</option>
          <option value='pos'>🏪 Balcão (POS)</option>
          <option value='online'>🌐 Online (Site)</option>
        </select>

        <select
          value={filters.status}
          onChange={e =>
            updateURL({ status: e.target.value || null, page: null })
          }
          className='text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
        >
          <option value=''>Todos os status</option>
          <option value='pending'>Aguardando</option>
          <option value='confirmed'>Confirmado</option>
          <option value='processing'>Preparando</option>
          <option value='shipped'>Enviado</option>
          <option value='delivered'>Finalizado</option>
          <option value='cancelled'>Cancelado</option>
        </select>

        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className='text-xs text-[#FF6600] hover:underline flex items-center gap-1'
          >
            <X size={12} />
            Limpar filtros
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
        {loading ? (
          <div className='p-12 flex items-center justify-center'>
            <Loader2 size={32} className='animate-spin text-[#FF6600]' />
          </div>
        ) : orders.length === 0 ? (
          <div className='p-12 text-center text-gray-500'>
            <ShoppingBag size={48} className='mx-auto mb-3 opacity-50' />
            <p className='font-medium'>Nenhum pedido encontrado</p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className='mt-3 text-[#FF6600] hover:underline text-sm'
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead className='bg-gray-50 border-b'>
                  <tr>
                    <th className='text-left p-3 font-medium text-gray-600'>
                      Pedido
                    </th>
                    <th className='text-left p-3 font-medium text-gray-600'>
                      Canal
                    </th>
                    <th className='text-left p-3 font-medium text-gray-600'>
                      Cliente
                    </th>
                    <th className='text-left p-3 font-medium text-gray-600'>
                      Pagamento
                    </th>
                    <th className='text-right p-3 font-medium text-gray-600'>
                      Total
                    </th>
                    <th className='text-left p-3 font-medium text-gray-600'>
                      Status
                    </th>
                    <th className='text-left p-3 font-medium text-gray-600'>
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {orders.map(o => {
                    const statusCfg = STATUS_LABELS[o.status] || {
                      label: o.status,
                      color: 'bg-gray-100 text-gray-600',
                    };
                    const itemsCount = o.items.reduce(
                      (s, i) => s + i.quantity,
                      0,
                    );
                    return (
                      <tr
                        key={o._id}
                        onClick={() => router.push(`/admin/pedidos/${o._id}`)}
                        className='hover:bg-gray-50 cursor-pointer'
                      >
                        <td className='p-3'>
                          <Link
                            href={`/admin/pedidos/${o._id}`}
                            className='font-mono text-xs font-semibold text-[#FF6600] hover:underline'
                            onClick={e => e.stopPropagation()}
                          >
                            {o.orderNumber}
                          </Link>
                          <p className='text-[10px] text-gray-400'>
                            {itemsCount} item{itemsCount !== 1 && 's'}
                          </p>
                        </td>
                        <td className='p-3'>
                          {o.channel === 'pos' ? (
                            <span className='inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded'>
                              <Store size={10} />
                              Balcão
                            </span>
                          ) : (
                            <span className='inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded'>
                              <Globe size={10} />
                              Site
                            </span>
                          )}
                        </td>
                        <td className='p-3'>
                          <p className='text-gray-900 font-medium'>
                            {o.customerSnapshot?.name || 'Consumidor'}
                          </p>
                          {o.customerSnapshot?.cpf && (
                            <p className='text-[10px] text-gray-400 font-mono'>
                              {o.customerSnapshot.cpf}
                            </p>
                          )}
                        </td>
                        <td className='p-3'>
                          <p className='text-xs text-gray-700'>
                            {PAYMENT_LABELS[o.payment.method] ||
                              o.payment.method}
                          </p>
                          {o.payment.status === 'paid' && (
                            <p className='text-[10px] text-green-600 font-medium'>
                              ✓ Pago
                            </p>
                          )}
                          {o.payment.status === 'pending' && (
                            <p className='text-[10px] text-yellow-600 font-medium'>
                              Aguardando
                            </p>
                          )}
                          {o.payment.status === 'refunded' && (
                            <p className='text-[10px] text-purple-600 font-medium'>
                              Estornado
                            </p>
                          )}
                        </td>
                        <td className='p-3 text-right font-bold text-gray-900'>
                          {formatPrice(o.total)}
                        </td>
                        <td className='p-3'>
                          <span
                            className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${statusCfg.color}`}
                          >
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className='p-3 text-xs text-gray-500'>
                          {formatDateTime(o.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className='flex items-center justify-between p-4 border-t bg-gray-50'>
                <p className='text-sm text-gray-500'>
                  Página {pagination.page} de {pagination.pages}
                </p>
                <div className='flex gap-2'>
                  <button
                    onClick={() =>
                      updateURL({ page: (pagination.page - 1).toString() })
                    }
                    disabled={pagination.page <= 1}
                    className='p-2 border rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() =>
                      updateURL({ page: (pagination.page + 1).toString() })
                    }
                    disabled={pagination.page >= pagination.pages}
                    className='p-2 border rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
