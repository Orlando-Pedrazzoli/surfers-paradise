// 📄 src/app/(account)/meus-pedidos/page.tsx
// v3 (GAP 5 — retomar pagamento): pedidos com pagamento pendente ganham
//     ação direta no card — "Pagar com PIX" (→ /pagamento/pix?orderId=) e
//     "Ver Boleto" (→ detalhe, que já tem o link do boleto). O card virou
//     <div onClick> (padrão do admin) para permitir botões internos sem
//     <a> aninhado.
// v2: consome GET /api/orders (a rota /api/orders/my-orders NUNCA existiu —
//     a listagem estava quebrada). O backend agora força o escopo ao dono
//     para clientes, então a chamada é direta.
// v2: itemCount derivado de items (não é campo da API).
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  ChevronRight,
  QrCode,
  FileText,
} from 'lucide-react';
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
  payment?: { method: string; status: string };
  createdAt: string;
}

// ⚠️ Manter em sincronia com PIX_EXPIRES_SECONDS em src/lib/services/checkout.ts
const PIX_EXPIRES_MS = 3600 * 1000;

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
  const router = useRouter();
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
            // Retomada de pagamento: pedido ativo aguardando PIX/boleto
            const awaitingPayment =
              order.status === 'pending' && order.payment?.status === 'pending';
            const pixStillValid =
              Date.now() - new Date(order.createdAt).getTime() < PIX_EXPIRES_MS;
            const canResumePix =
              awaitingPayment &&
              order.payment?.method === 'pix' &&
              pixStillValid;
            const pixExpired =
              awaitingPayment &&
              order.payment?.method === 'pix' &&
              !pixStillValid;
            const canResumeBoleto =
              awaitingPayment && order.payment?.method === 'boleto';

            return (
              <div
                key={order._id}
                onClick={() => router.push(`/meus-pedidos/${order._id}`)}
                className='bg-white rounded-lg shadow-sm p-4 cursor-pointer transition hover:shadow-md'
              >
                <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
                  <div className='flex items-center gap-3 flex-1'>
                    <div className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center'>
                      <Package size={20} className='text-gray-400' />
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        Pedido #{order.orderNumber}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}{' '}
                        — {itemCount} {itemCount === 1 ? 'item' : 'itens'}
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
                </div>

                {/* Retomada de pagamento pendente */}
                {(canResumePix || canResumeBoleto || pixExpired) && (
                  <div className='mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3'>
                    {canResumePix && (
                      <button
                        type='button'
                        onClick={e => {
                          e.stopPropagation();
                          router.push(`/pagamento/pix?orderId=${order._id}`);
                        }}
                        className='inline-flex items-center gap-1.5 rounded-lg bg-[#FF6600] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#e55b00]'
                      >
                        <QrCode size={14} />
                        Pagar com PIX
                      </button>
                    )}
                    {canResumeBoleto && (
                      <button
                        type='button'
                        onClick={e => {
                          e.stopPropagation();
                          router.push(`/meus-pedidos/${order._id}`);
                        }}
                        className='inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-gray-800'
                      >
                        <FileText size={14} />
                        Ver Boleto
                      </button>
                    )}
                    {pixExpired && (
                      <p className='text-xs text-gray-500'>
                        Código PIX expirado — o pedido será cancelado
                        automaticamente. Faça um novo pedido para concluir a
                        compra.
                      </p>
                    )}
                    {(canResumePix || canResumeBoleto) && (
                      <p className='text-xs text-yellow-700'>
                        Pague logo — pedidos não pagos são cancelados
                        automaticamente.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
