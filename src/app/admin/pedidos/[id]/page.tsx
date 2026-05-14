'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Store,
  Globe,
  Package,
  User,
  MapPin,
  CreditCard,
  Calendar,
  XCircle,
  Truck,
  Loader2,
  Save,
  Receipt,
} from 'lucide-react';

interface OrderDetail {
  _id: string;
  orderNumber: string;
  channel: 'online' | 'pos';
  status: string;
  user: { _id: string; name: string; email: string; phone?: string } | null;
  customerSnapshot: {
    name: string;
    cpf: string;
    phone: string;
    email: string;
  };
  items: {
    _id?: string;
    product:
      | { _id: string; name: string; slug: string; thumbnail?: string }
      | string
      | null;
    sku: string;
    name: string;
    slug: string;
    image: string;
    quantity: number;
    price: number;
    costPrice: number;
  }[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  coupon: string;
  total: number;
  shippingAddress?: {
    name: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
    phone: string;
    cpf: string;
  };
  payment: {
    method: string;
    status: string;
    installments: number;
    cashReceived: number;
    cashChange: number;
    paidAt?: string;
  };
  shipping?: {
    method: string;
    trackingCode: string;
    shippedAt?: string;
    deliveredAt?: string;
  };
  notes: string;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: {
    label: 'Aguardando',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  },
  confirmed: {
    label: 'Confirmado',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  processing: {
    label: 'Preparando',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
  },
  shipped: {
    label: 'Enviado',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  },
  delivered: {
    label: 'Finalizado',
    color: 'bg-green-100 text-green-700 border-green-300',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-700 border-red-300',
  },
};

const PAYMENT_LABELS: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  boleto: 'Boleto Bancário',
  pix: 'PIX',
  cash: 'Dinheiro',
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDateTime(date?: string): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('pt-BR');
}

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [trackingCode, setTrackingCode] = useState('');

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        setNotes(data.order.notes || '');
        setTrackingCode(data.order.shipping?.trackingCode || '');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Erro ao carregar pedido');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    if (newStatus === order.status) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Status atualizado');
        fetchOrder();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Erro ao atualizar status');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTracking = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingCode }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Código de rastreio salvo');
        fetchOrder();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Observações salvas');
        fetchOrder();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    const reason = prompt(
      'Motivo do cancelamento (opcional):',
      'Cancelado pelo admin',
    );
    if (reason === null) return; // Usuário cancelou o prompt

    if (!confirm('Tem certeza? O estoque será devolvido automaticamente.'))
      return;

    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Pedido cancelado e estoque devolvido');
        fetchOrder();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Erro ao cancelar pedido');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 size={32} className='animate-spin text-[#FF6600]' />
      </div>
    );
  }

  if (!order) {
    return (
      <div className='p-12 text-center text-gray-500'>
        Pedido não encontrado.
      </div>
    );
  }

  const statusCfg = STATUS_LABELS[order.status] || {
    label: order.status,
    color: 'bg-gray-100 text-gray-600 border-gray-300',
  };

  const canCancel =
    order.status !== 'cancelled' &&
    (order.channel === 'pos' ||
      !['shipped', 'delivered'].includes(order.status));

  return (
    <div>
      {/* HEADER */}
      <div className='mb-6'>
        <Link
          href='/admin/pedidos'
          className='inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3'
        >
          <ArrowLeft size={16} />
          Voltar para pedidos
        </Link>
        <div className='flex items-start justify-between flex-wrap gap-3'>
          <div>
            <div className='flex items-center gap-3 flex-wrap'>
              <h1 className='text-2xl font-bold font-mono'>
                {order.orderNumber}
              </h1>
              {order.channel === 'pos' ? (
                <span className='inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded'>
                  <Store size={12} />
                  Balcão (POS)
                </span>
              ) : (
                <span className='inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded'>
                  <Globe size={12} />
                  Site (Online)
                </span>
              )}
              <span
                className={`inline-block text-xs font-medium px-2 py-1 rounded border ${statusCfg.color}`}
              >
                {statusCfg.label}
              </span>
            </div>
            <p className='text-sm text-gray-500 mt-1 flex items-center gap-1'>
              <Calendar size={12} />
              Criado em {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className='flex gap-2'>
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={saving}
                className='flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm'
              >
                <XCircle size={16} />
                Cancelar Pedido
              </button>
            )}
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        {/* COLUNA PRINCIPAL */}
        <div className='lg:col-span-2 space-y-4'>
          {/* ITEMS */}
          <div className='bg-white rounded-lg shadow-sm'>
            <div className='p-4 border-b flex items-center gap-2'>
              <Package size={16} className='text-gray-400' />
              <h2 className='font-semibold'>Itens ({order.items.length})</h2>
            </div>
            <div className='divide-y'>
              {order.items.map((item, idx) => (
                <div key={idx} className='p-4 flex items-center gap-3'>
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={48}
                      height={48}
                      className='rounded object-cover'
                    />
                  ) : (
                    <div className='w-12 h-12 bg-gray-100 rounded flex items-center justify-center'>
                      <Package size={16} className='text-gray-400' />
                    </div>
                  )}
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium text-gray-900 line-clamp-1'>
                      {item.name}
                    </p>
                    <p className='text-xs text-gray-400 font-mono'>
                      SKU: {item.sku} · {item.quantity}×{' '}
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className='font-bold text-gray-900'>
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* TOTAIS */}
            <div className='p-4 border-t bg-gray-50 space-y-1.5 text-sm'>
              <div className='flex justify-between text-gray-600'>
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className='flex justify-between text-green-700'>
                  <span>Desconto {order.coupon && `(${order.coupon})`}</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              {order.shippingCost > 0 && (
                <div className='flex justify-between text-gray-600'>
                  <span>Frete</span>
                  <span>{formatPrice(order.shippingCost)}</span>
                </div>
              )}
              <div className='flex justify-between font-bold text-base text-gray-900 pt-1.5 border-t'>
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* TRACKING (só online) */}
          {order.channel === 'online' && order.status !== 'cancelled' && (
            <div className='bg-white rounded-lg shadow-sm p-4'>
              <div className='flex items-center gap-2 mb-3'>
                <Truck size={16} className='text-gray-400' />
                <h2 className='font-semibold'>Rastreio</h2>
              </div>
              <div className='flex gap-2'>
                <input
                  type='text'
                  value={trackingCode}
                  onChange={e => setTrackingCode(e.target.value)}
                  placeholder='Código de rastreio'
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600] font-mono text-sm'
                />
                <button
                  onClick={handleSaveTracking}
                  disabled={saving}
                  className='px-4 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] disabled:opacity-50 flex items-center gap-1.5 text-sm'
                >
                  <Save size={14} />
                  Salvar
                </button>
              </div>
              {order.shipping?.shippedAt && (
                <p className='text-xs text-gray-500 mt-2'>
                  Enviado em {formatDateTime(order.shipping.shippedAt)}
                </p>
              )}
            </div>
          )}

          {/* NOTAS */}
          <div className='bg-white rounded-lg shadow-sm p-4'>
            <h2 className='font-semibold mb-3'>Observações Internas</h2>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder='Notas visíveis apenas para o admin...'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600] text-sm'
            />
            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className='mt-2 px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1.5 text-sm'
            >
              <Save size={14} />
              Salvar observação
            </button>
          </div>

          {/* CANCELAMENTO */}
          {order.status === 'cancelled' && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <XCircle size={16} className='text-red-600' />
                <h2 className='font-semibold text-red-900'>Pedido Cancelado</h2>
              </div>
              {order.cancellationReason && (
                <p className='text-sm text-red-800 mb-1'>
                  Motivo: {order.cancellationReason}
                </p>
              )}
              {order.cancelledAt && (
                <p className='text-xs text-red-600'>
                  Cancelado em {formatDateTime(order.cancelledAt)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* COLUNA LATERAL */}
        <div className='space-y-4'>
          {/* STATUS ACTIONS */}
          {order.status !== 'cancelled' && (
            <div className='bg-white rounded-lg shadow-sm p-4'>
              <h2 className='font-semibold mb-3 text-sm'>Mudar Status</h2>
              <select
                value={order.status}
                onChange={e => handleStatusChange(e.target.value)}
                disabled={saving}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600] text-sm'
              >
                {order.channel === 'online' && (
                  <>
                    <option value='pending'>Aguardando pagamento</option>
                    <option value='confirmed'>Confirmado</option>
                    <option value='processing'>Preparando</option>
                    <option value='shipped'>Enviado</option>
                    <option value='delivered'>Entregue</option>
                  </>
                )}
                {order.channel === 'pos' && (
                  <>
                    <option value='delivered'>Finalizada</option>
                    <option value='pending'>Aguardando</option>
                  </>
                )}
              </select>
              <p className='text-xs text-gray-400 mt-2'>
                Para cancelar, use o botão vermelho no topo.
              </p>
            </div>
          )}

          {/* CLIENTE */}
          <div className='bg-white rounded-lg shadow-sm p-4'>
            <div className='flex items-center gap-2 mb-3'>
              <User size={16} className='text-gray-400' />
              <h2 className='font-semibold text-sm'>Cliente</h2>
            </div>
            <p className='font-medium text-gray-900'>
              {order.customerSnapshot?.name || 'Consumidor'}
            </p>
            {order.customerSnapshot?.cpf && (
              <p className='text-xs text-gray-500 font-mono mt-0.5'>
                CPF: {order.customerSnapshot.cpf}
              </p>
            )}
            {order.customerSnapshot?.phone && (
              <p className='text-xs text-gray-500 mt-0.5'>
                Tel: {order.customerSnapshot.phone}
              </p>
            )}
            {order.customerSnapshot?.email && (
              <p className='text-xs text-gray-500 mt-0.5'>
                {order.customerSnapshot.email}
              </p>
            )}
            {order.user && (
              <p className='text-xs text-blue-600 mt-2'>✓ Cliente cadastrado</p>
            )}
          </div>

          {/* PAGAMENTO */}
          <div className='bg-white rounded-lg shadow-sm p-4'>
            <div className='flex items-center gap-2 mb-3'>
              <CreditCard size={16} className='text-gray-400' />
              <h2 className='font-semibold text-sm'>Pagamento</h2>
            </div>
            <p className='text-sm text-gray-900'>
              {PAYMENT_LABELS[order.payment.method] || order.payment.method}
            </p>
            {order.payment.installments > 1 && (
              <p className='text-xs text-gray-500'>
                {order.payment.installments}x de{' '}
                {formatPrice(order.total / order.payment.installments)}
              </p>
            )}
            <div className='mt-2'>
              {order.payment.status === 'paid' && (
                <span className='inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded'>
                  ✓ Pago
                </span>
              )}
              {order.payment.status === 'pending' && (
                <span className='inline-block text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded'>
                  Aguardando pagamento
                </span>
              )}
              {order.payment.status === 'refunded' && (
                <span className='inline-block text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded'>
                  Estornado
                </span>
              )}
              {order.payment.status === 'failed' && (
                <span className='inline-block text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded'>
                  Falhou
                </span>
              )}
            </div>
            {order.payment.paidAt && (
              <p className='text-xs text-gray-400 mt-2'>
                Pago em {formatDateTime(order.payment.paidAt)}
              </p>
            )}
            {/* DINHEIRO: troco */}
            {order.payment.method === 'cash' &&
              order.payment.cashReceived > 0 && (
                <div className='mt-3 pt-3 border-t text-xs space-y-1'>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Recebido:</span>
                    <span className='font-mono'>
                      {formatPrice(order.payment.cashReceived)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Troco:</span>
                    <span className='font-mono font-bold text-[#FF6600]'>
                      {formatPrice(order.payment.cashChange)}
                    </span>
                  </div>
                </div>
              )}
          </div>

          {/* ENDEREÇO */}
          {order.shippingAddress && (
            <div className='bg-white rounded-lg shadow-sm p-4'>
              <div className='flex items-center gap-2 mb-3'>
                <MapPin size={16} className='text-gray-400' />
                <h2 className='font-semibold text-sm'>Endereço de Entrega</h2>
              </div>
              <p className='text-sm text-gray-900'>
                {order.shippingAddress.street}, {order.shippingAddress.number}
              </p>
              {order.shippingAddress.complement && (
                <p className='text-xs text-gray-500'>
                  {order.shippingAddress.complement}
                </p>
              )}
              <p className='text-xs text-gray-500'>
                {order.shippingAddress.neighborhood}
              </p>
              <p className='text-xs text-gray-500'>
                {order.shippingAddress.city} - {order.shippingAddress.state}
              </p>
              <p className='text-xs text-gray-500 font-mono'>
                CEP: {order.shippingAddress.cep}
              </p>
            </div>
          )}

          {/* IMPRIMIR */}
          <div className='space-y-2'>
            <Link
              href={`/admin/pedidos/${id}/cupom?format=80mm`}
              target='_blank'
              className='w-full bg-gray-900 text-white py-2 rounded-md flex items-center justify-center gap-2 text-sm hover:bg-gray-800 transition-colors'
            >
              <Receipt size={16} />
              Cupom 80mm (Térmica)
            </Link>
            <Link
              href={`/admin/pedidos/${id}/cupom?format=a4`}
              target='_blank'
              className='w-full bg-gray-200 text-gray-700 py-2 rounded-md flex items-center justify-center gap-2 text-sm hover:bg-gray-300 transition-colors'
            >
              <Receipt size={16} />
              Cupom A4
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
