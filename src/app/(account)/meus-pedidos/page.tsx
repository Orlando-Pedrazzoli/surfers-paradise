// 📄 src/app/(account)/meus-pedidos/page.tsx
// v2: consome GET /api/orders (a rota /api/orders/my-orders NUNCA existiu —
//     a listagem estava quebrada). O backend agora força o escopo ao dono
//     para clientes, então a chamada é direta.
// v2: itemCount derivado de items (não é campo da API).
// v2: card clicável → /meus-pedidos/[id] (detalhe).
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Package, ShoppingCart, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';

interface OrderItem {
  name: string;
  quantity: number;
  image?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  total: number;
  items: OrderItem[];
  createdAt: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  processing: {
    label: 'Em Preparação',
    color: 'bg-indigo-100 text-indigo-800',
  },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export default function MeusPedidosPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders?limit=50');
        const data = await res.json();
        if (data.success) setOrders(data.orders);
      } catch {
        /* empty */
      }
      setLoading(false);
    };
    if (session?.user) fetchOrders();
  }, [session]);

  if (loading)
    return (
      <div className='flex justify-center py-12'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#FF6600]' />
      </div>
    );

  return (
    <div>
      <h1 className='text-2xl font-bold text-gray-900 mb-6'>Meus Pedidos</h1>

      {orders.length === 0 ? (
        <div className='bg-white rounded-lg shadow-sm p-12 text-center'>
          <ShoppingCart size={48} className='mx-auto mb-4 text-gray-200' />
          <h2 className='text-lg font-medium text-gray-900 mb-2'>
            Nenhum pedido ainda
          </h2>
          <p className='text-sm text-gray-500 mb-6'>
            Quando você fizer sua primeira compra, os pedidos aparecerão aqui.
            Comprou sem estar logado? Verifique seu e-mail em{' '}
            <Link
              href='/verificar-email'
              className='text-[#FF6600] hover:underline'
            >
              verificar e-mail
            </Link>{' '}
            para vincular os pedidos à sua conta.
          </p>
          <Link
            href='/produtos'
            className='inline-block px-6 py-2.5 bg-[#FF6600] text-white font-medium text-sm rounded-lg hover:bg-[#e55b00] transition-colors'
          >
            Explorar Produtos
          </Link>
        </div>
      ) : (
        <div className='space-y-4'>
          {orders.map(order => {
            const status = statusLabels[order.status] || {
              label: order.status,
              color: 'bg-gray-100 text-gray-800',
            };
            const itemCount = (order.items || []).reduce(
              (s, i) => s + (i.quantity || 0),
              0,
            );
            return (
              <Link
                key={order._id}
                href={`/meus-pedidos/${order._id}`}
                className='bg-white rounded-lg shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition hover:shadow-md'
              >
                <div className='flex items-center gap-3 flex-1'>
                  <div className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center'>
                    <Package size={20} className='text-gray-400' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-gray-900'>
                      Pedido #{order.orderNumber}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')} —{' '}
                      {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-4'>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}
                  >
                    {status.label}
                  </span>
                  <p className='text-sm font-bold text-gray-900'>
                    {formatCurrency(order.total)}
                  </p>
                  <ChevronRight size={16} className='text-gray-300' />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
