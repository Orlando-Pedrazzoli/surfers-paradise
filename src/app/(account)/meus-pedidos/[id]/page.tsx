// 📄 src/app/(account)/meus-pedidos/[id]/page.tsx
// Detalhe do pedido do cliente — consome GET /api/orders/[id] (protegido:
// dono ou admin). Mostra itens, totais, pagamento (com PIX/boleto pendente),
// rastreio e endereço de entrega.
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';

interface OrderItem {
  name: string;
  variant?: string;
  quantity: number;
  price: number;
  image?: string;
  slug?: string;
}

interface OrderDetail {
  _id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  coupon?: string;
  total: number;
  payment: {
    method: string;
    status: string;
    installments?: number;
    boletoUrl?: string;
    boletoBarcode?: string;
    pixCopyPaste?: string;
    paidAt?: string;
  };
  shipping?: {
    carrier?: string;
    method?: string;
    trackingCode?: string;
    estimatedDays?: number;
  };
  shippingAddress?: {
    name?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    cep?: string;
  };
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: {
    label: 'Aguardando pagamento',
    color: 'bg-yellow-100 text-yellow-800',
  },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  processing: {
    label: 'Em Preparação',
    color: 'bg-indigo-100 text-indigo-800',
  },
  shipped: { label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

const PAYMENT_LABEL: Record<string, string> = {
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  pix: 'PIX',
  boleto: 'Boleto',
  cash: 'Dinheiro',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        if (data.success) setOrder(data.order);
        else setError(data.error || 'Pedido não encontrado.');
      } catch {
        setError('Erro ao carregar o pedido.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const copyTracking = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading)
    return (
      <div className='flex justify-center py-12'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#FF6600]' />
      </div>
    );

  if (error || !order)
    return (
      <div className='bg-white rounded-lg shadow-sm p-12 text-center'>
        <Package size={48} className='mx-auto mb-4 text-gray-200' />
        <p className='text-gray-500 mb-6'>
          {error || 'Pedido não encontrado.'}
        </p>
        <Link
          href='/meus-pedidos'
          className='text-sm font-medium text-[#FF6600] hover:underline'
        >
          ← Voltar para Meus Pedidos
        </Link>
      </div>
    );

  const status = statusLabels[order.status] || {
    label: order.status,
    color: 'bg-gray-100 text-gray-800',
  };
  const addr = order.shippingAddress;

  return (
    <div className='space-y-4'>
      <Link
        href='/meus-pedidos'
        className='inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#FF6600]'
      >
        <ArrowLeft size={14} /> Meus Pedidos
      </Link>

      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h1 className='text-2xl font-bold text-gray-900'>
          Pedido #{order.orderNumber}
        </h1>
        <span
          className={`text-xs font-medium px-3 py-1.5 rounded-full ${status.color}`}
        >
          {status.label}
        </span>
      </div>
      <p className='text-sm text-gray-500 -mt-2'>
        Realizado em{' '}
        {new Date(order.createdAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })}
      </p>

      {/* Itens */}
      <div className='bg-white rounded-lg shadow-sm p-5'>
        <h2 className='text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2'>
          <Package size={16} /> Itens ({order.items.length})
        </h2>
        <div className='divide-y divide-gray-100'>
          {order.items.map((item, idx) => (
            <div key={idx} className='flex items-center gap-3 py-3'>
              <div className='w-14 h-14 bg-gray-100 rounded flex-shrink-0 overflow-hidden'>
                {item.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.name}
                    className='h-full w-full object-cover'
                  />
                )}
              </div>
              <div className='flex-1 min-w-0'>
                {item.slug ? (
                  <Link
                    href={`/produtos/${item.slug}`}
                    className='text-sm text-gray-900 hover:text-[#FF6600] line-clamp-2'
                  >
                    {item.name}
                  </Link>
                ) : (
                  <p className='text-sm text-gray-900 line-clamp-2'>
                    {item.name}
                  </p>
                )}
                <p className='text-xs text-gray-500'>
                  {item.variant ? `${item.variant} · ` : ''}Qtd: {item.quantity}
                </p>
              </div>
              <p className='text-sm font-medium text-gray-900 whitespace-nowrap'>
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className='border-t border-gray-100 pt-3 mt-1 space-y-1.5 text-sm'>
          <div className='flex justify-between text-gray-600'>
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className='flex justify-between text-gray-600'>
            <span>Frete</span>
            <span>
              {order.shippingCost > 0
                ? formatCurrency(order.shippingCost)
                : 'Grátis'}
            </span>
          </div>
          {order.discount > 0 && (
            <div className='flex justify-between text-green-600'>
              <span>Desconto{order.coupon ? ` (${order.coupon})` : ''}</span>
              <span>- {formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className='flex justify-between font-bold text-gray-900 text-base pt-1'>
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Pagamento */}
        <div className='bg-white rounded-lg shadow-sm p-5'>
          <h2 className='text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2'>
            <CreditCard size={16} /> Pagamento
          </h2>
          <p className='text-sm text-gray-700'>
            {PAYMENT_LABEL[order.payment.method] || order.payment.method}
            {order.payment.installments && order.payment.installments > 1
              ? ` em ${order.payment.installments}x`
              : ''}
          </p>
          <p
            className={`mt-1 text-xs font-medium ${
              order.payment.status === 'paid'
                ? 'text-green-600'
                : order.payment.status === 'refunded'
                  ? 'text-gray-500'
                  : order.payment.status === 'failed'
                    ? 'text-red-600'
                    : 'text-yellow-600'
            }`}
          >
            {order.payment.status === 'paid'
              ? `✓ Pago${order.payment.paidAt ? ` em ${new Date(order.payment.paidAt).toLocaleDateString('pt-BR')}` : ''}`
              : order.payment.status === 'refunded'
                ? 'Reembolsado'
                : order.payment.status === 'failed'
                  ? 'Pagamento não aprovado'
                  : 'Aguardando pagamento'}
          </p>
          {order.payment.status === 'pending' &&
            order.payment.method === 'boleto' &&
            order.payment.boletoUrl && (
              <a
                href={order.payment.boletoUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='mt-3 inline-block text-sm font-medium text-[#FF6600] hover:underline'
              >
                Abrir boleto para pagamento →
              </a>
            )}
        </div>

        {/* Entrega */}
        <div className='bg-white rounded-lg shadow-sm p-5'>
          <h2 className='text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2'>
            <Truck size={16} /> Entrega
          </h2>
          {order.shipping?.carrier && (
            <p className='text-sm text-gray-700'>
              {order.shipping.carrier}
              {order.shipping.method ? ` — ${order.shipping.method}` : ''}
            </p>
          )}
          {order.shipping?.trackingCode ? (
            <div className='mt-2'>
              <p className='text-xs text-gray-500 mb-1'>Código de rastreio:</p>
              <button
                type='button'
                onClick={() => copyTracking(order.shipping!.trackingCode!)}
                className='inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-mono font-semibold text-gray-800 hover:bg-gray-200'
              >
                {order.shipping.trackingCode}
                {copied ? (
                  <Check size={14} className='text-green-600' />
                ) : (
                  <Copy size={14} className='text-gray-400' />
                )}
              </button>
            </div>
          ) : (
            <p className='mt-1 text-xs text-gray-400'>
              O código de rastreio aparecerá aqui quando o pedido for
              despachado.
            </p>
          )}
          {addr?.street && (
            <div className='mt-3 border-t border-gray-100 pt-3'>
              <p className='text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1'>
                <MapPin size={12} /> Endereço
              </p>
              <p className='text-xs text-gray-600 leading-relaxed'>
                {addr.name && (
                  <>
                    {addr.name}
                    <br />
                  </>
                )}
                {addr.street}, {addr.number}
                {addr.complement ? ` - ${addr.complement}` : ''}
                <br />
                {addr.neighborhood} · {addr.city} - {addr.state}
                <br />
                CEP {addr.cep}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
