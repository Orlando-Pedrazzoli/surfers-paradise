'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  company,
  getFormattedAddress,
  getShortAddress,
} from '@/lib/config/company';

type Format = '80mm' | 'a4';

interface OrderCupom {
  _id: string;
  orderNumber: string;
  channel: 'online' | 'pos';
  status: string;
  customerSnapshot: {
    name: string;
    cpf: string;
    phone: string;
    email: string;
  };
  items: {
    sku: string;
    name: string;
    quantity: number;
    price: number;
    discountPercent?: number;
    discountValue?: number;
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
  };
  payment: {
    method: string;
    status: string;
    installments: number;
    cashReceived: number;
    cashChange: number;
  };
  notes: string;
  createdAt: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
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
  return new Date(date).toLocaleString('pt-BR');
}

export default function CupomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const format = (searchParams.get('format') as Format) || '80mm';

  const [order, setOrder] = useState<OrderCupom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (data.success) setOrder(data.order);
      else setError(data.error || 'Pedido não encontrado');
    } catch {
      setError('Erro ao carregar pedido');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Auto-imprime se ?autoprint=1 está na URL
  useEffect(() => {
    if (!loading && order && searchParams.get('autoprint') === '1') {
      const t = setTimeout(() => window.print(), 500);
      return () => clearTimeout(t);
    }
  }, [loading, order, searchParams]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        <Loader2 size={32} className='animate-spin text-[#FF6600]' />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        <div className='text-center'>
          <p className='text-red-600 mb-4'>{error}</p>
          <Link
            href={`/admin/pedidos/${id}`}
            className='text-[#FF6600] hover:underline'
          >
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* CSS global para impressão */}
      <style jsx global>{`
        @page {
          margin: ${format === '80mm' ? '0' : '15mm'};
          size: ${format === '80mm' ? '80mm auto' : 'A4 portrait'};
        }
        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          body * {
            visibility: hidden;
          }
          .cupom-container,
          .cupom-container * {
            visibility: visible;
          }
          .cupom-container {
            position: absolute;
            left: 0;
            top: 0;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className='cupom-page min-h-screen bg-gray-100 py-6'>
        {/* TOOLBAR (não imprime) */}
        <div className='no-print max-w-3xl mx-auto mb-4 flex items-center justify-between gap-3 flex-wrap px-4'>
          <Link
            href={`/admin/pedidos/${id}`}
            className='inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900'
          >
            <ArrowLeft size={16} />
            Voltar ao pedido
          </Link>

          <div className='flex gap-2'>
            <Link
              href={`/admin/pedidos/${id}/cupom?format=80mm`}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                format === '80mm'
                  ? 'bg-[#FF6600] text-white border-[#FF6600]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              80mm (Térmica)
            </Link>
            <Link
              href={`/admin/pedidos/${id}/cupom?format=a4`}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                format === 'a4'
                  ? 'bg-[#FF6600] text-white border-[#FF6600]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              A4
            </Link>
            <button
              onClick={handlePrint}
              className='inline-flex items-center gap-2 px-4 py-1.5 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] text-sm font-medium'
            >
              <Printer size={14} />
              Imprimir
            </button>
          </div>
        </div>

        {/* CUPOM */}
        {format === '80mm' ? (
          <Cupom80mm order={order} />
        ) : (
          <CupomA4 order={order} />
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// CUPOM 80mm (térmica)
// ═══════════════════════════════════════════════════════════════
function Cupom80mm({ order }: { order: OrderCupom }) {
  return (
    <div
      className='cupom-container bg-white mx-auto p-3 font-mono text-[11px] leading-tight shadow-sm border border-gray-200'
      style={{ width: '80mm', minHeight: 'auto' }}
    >
      {/* HEADER */}
      <div className='text-center border-b border-dashed border-gray-400 pb-2 mb-2'>
        <p className='font-bold text-[13px]'>{company.name.toUpperCase()}</p>
        <p className='text-[10px]'>{getShortAddress()}</p>
        {company.cnpj && <p className='text-[10px]'>CNPJ: {company.cnpj}</p>}
        {company.phone && <p className='text-[10px]'>{company.phone}</p>}
      </div>

      {/* INFO PEDIDO */}
      <div className='text-center mb-2'>
        <p className='font-bold uppercase'>
          {order.channel === 'pos' ? 'CUPOM DE VENDA' : 'COMPROVANTE DE PEDIDO'}
        </p>
        <p className='text-[10px]'>NÃO É DOCUMENTO FISCAL</p>
      </div>

      <div className='border-b border-dashed border-gray-400 pb-2 mb-2'>
        <p>
          <span className='font-bold'>Pedido:</span> {order.orderNumber}
        </p>
        <p>
          <span className='font-bold'>Data:</span>{' '}
          {formatDateTime(order.createdAt)}
        </p>
        {order.customerSnapshot?.name && (
          <p>
            <span className='font-bold'>Cliente:</span>{' '}
            {order.customerSnapshot.name}
          </p>
        )}
        {order.customerSnapshot?.cpf && (
          <p>
            <span className='font-bold'>CPF:</span> {order.customerSnapshot.cpf}
          </p>
        )}
      </div>

      {/* ITEMS */}
      <div className='border-b border-dashed border-gray-400 pb-2 mb-2'>
        <div className='flex justify-between font-bold mb-1'>
          <span>ITEM</span>
          <span>VALOR</span>
        </div>
        {order.items.map((item, idx) => {
          const lineGross = item.price * item.quantity;
          const hasDiscount = (item.discountPercent ?? 0) > 0;
          const lineNet = lineGross - (item.discountValue ?? 0);
          return (
            <div key={idx} className='mb-1.5'>
              <p className='font-medium leading-tight'>{item.name}</p>
              <div className='flex justify-between text-[10px]'>
                <span>
                  {item.quantity} x {formatPrice(item.price)}
                  {hasDiscount ? ` (-${item.discountPercent}%)` : ''}
                </span>
                {hasDiscount ? (
                  <span className='font-bold'>
                    <span className='line-through font-normal mr-1'>
                      {formatPrice(lineGross)}
                    </span>
                    {formatPrice(lineNet)}
                  </span>
                ) : (
                  <span className='font-bold'>{formatPrice(lineGross)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TOTAIS */}
      <div className='border-b border-dashed border-gray-400 pb-2 mb-2 space-y-0.5'>
        <div className='flex justify-between'>
          <span>Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className='flex justify-between'>
            <span>Desconto{order.coupon ? ` (${order.coupon})` : ''}</span>
            <span>-{formatPrice(order.discount)}</span>
          </div>
        )}
        {order.shippingCost > 0 && (
          <div className='flex justify-between'>
            <span>Frete</span>
            <span>{formatPrice(order.shippingCost)}</span>
          </div>
        )}
        <div className='flex justify-between font-bold text-[13px] pt-1 border-t border-gray-300'>
          <span>TOTAL</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* PAGAMENTO */}
      <div className='border-b border-dashed border-gray-400 pb-2 mb-2'>
        <p className='font-bold uppercase mb-1'>PAGAMENTO</p>
        <div className='flex justify-between'>
          <span>
            {PAYMENT_LABELS[order.payment.method] || order.payment.method}
          </span>
          <span>{formatPrice(order.total)}</span>
        </div>
        {order.payment.installments > 1 && (
          <p className='text-[10px]'>
            {order.payment.installments}x de{' '}
            {formatPrice(order.total / order.payment.installments)}
          </p>
        )}
        {order.payment.method === 'cash' && order.payment.cashReceived > 0 && (
          <>
            <div className='flex justify-between text-[10px] mt-1'>
              <span>Recebido</span>
              <span>{formatPrice(order.payment.cashReceived)}</span>
            </div>
            <div className='flex justify-between font-bold'>
              <span>TROCO</span>
              <span>{formatPrice(order.payment.cashChange)}</span>
            </div>
          </>
        )}
      </div>

      {/* ENDEREÇO (só se houver) */}
      {order.shippingAddress?.street && (
        <div className='border-b border-dashed border-gray-400 pb-2 mb-2'>
          <p className='font-bold uppercase mb-1'>ENTREGA</p>
          <p className='text-[10px]'>
            {order.shippingAddress.street}, {order.shippingAddress.number}
          </p>
          {order.shippingAddress.complement && (
            <p className='text-[10px]'>{order.shippingAddress.complement}</p>
          )}
          <p className='text-[10px]'>
            {order.shippingAddress.neighborhood} · {order.shippingAddress.city}{' '}
            - {order.shippingAddress.state}
          </p>
          <p className='text-[10px]'>CEP: {order.shippingAddress.cep}</p>
        </div>
      )}

      {/* FOOTER */}
      <div className='text-center text-[10px] mt-2'>
        <p>Obrigado pela preferência!</p>
        <p className='mt-1'>{company.url.replace(/^https?:\/\//, '')}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CUPOM A4
// ═══════════════════════════════════════════════════════════════
function CupomA4({ order }: { order: OrderCupom }) {
  return (
    <div
      className='cupom-container bg-white mx-auto p-8 shadow-sm border border-gray-200'
      style={{ width: '210mm', minHeight: '297mm' }}
    >
      {/* HEADER */}
      <div className='flex items-start justify-between pb-6 border-b-2 border-[#FF6600] mb-6'>
        <div>
          <h1 className='text-2xl font-black text-[#1A1A1A]'>
            {company.name.toUpperCase()}
          </h1>
          {company.legalName && (
            <p className='text-xs text-gray-500 mt-0.5'>{company.legalName}</p>
          )}
          <p className='text-sm text-gray-600 mt-1'>{getFormattedAddress()}</p>
          {company.cnpj && (
            <p className='text-sm text-gray-600'>
              CNPJ: {company.cnpj}
              {company.ie && ` · IE: ${company.ie}`}
            </p>
          )}
          {company.phone && (
            <p className='text-sm text-gray-600'>{company.phone}</p>
          )}
          {company.email && (
            <p className='text-sm text-gray-600'>{company.email}</p>
          )}
        </div>
        <div className='text-right'>
          <p className='text-xs uppercase text-gray-500 tracking-wide'>
            {order.channel === 'pos'
              ? 'Cupom de Venda'
              : 'Comprovante de Pedido'}
          </p>
          <p className='font-mono text-lg font-bold text-[#FF6600] mt-1'>
            {order.orderNumber}
          </p>
          <p className='text-xs text-gray-500 mt-1'>
            {formatDateTime(order.createdAt)}
          </p>
          <p className='text-[10px] text-gray-400 mt-2 italic'>
            NÃO É DOCUMENTO FISCAL
          </p>
        </div>
      </div>

      {/* INFO BLOCKS */}
      <div className='grid grid-cols-2 gap-6 mb-6'>
        {/* CLIENTE */}
        <div className='border border-gray-200 rounded p-4'>
          <p className='text-xs font-bold text-gray-500 uppercase tracking-wide mb-2'>
            Cliente
          </p>
          <p className='font-semibold text-gray-900'>
            {order.customerSnapshot?.name || 'Consumidor'}
          </p>
          {order.customerSnapshot?.cpf && (
            <p className='text-sm text-gray-600 font-mono mt-0.5'>
              CPF: {order.customerSnapshot.cpf}
            </p>
          )}
          {order.customerSnapshot?.phone && (
            <p className='text-sm text-gray-600 mt-0.5'>
              Tel: {order.customerSnapshot.phone}
            </p>
          )}
          {order.customerSnapshot?.email && (
            <p className='text-sm text-gray-600 mt-0.5'>
              {order.customerSnapshot.email}
            </p>
          )}
        </div>

        {/* PAGAMENTO */}
        <div className='border border-gray-200 rounded p-4'>
          <p className='text-xs font-bold text-gray-500 uppercase tracking-wide mb-2'>
            Pagamento
          </p>
          <p className='font-semibold text-gray-900'>
            {PAYMENT_LABELS[order.payment.method] || order.payment.method}
          </p>
          {order.payment.installments > 1 && (
            <p className='text-sm text-gray-600'>
              {order.payment.installments}x de{' '}
              {formatPrice(order.total / order.payment.installments)}
            </p>
          )}
          {order.payment.method === 'cash' &&
            order.payment.cashReceived > 0 && (
              <div className='mt-2 pt-2 border-t border-gray-100 space-y-0.5'>
                <p className='text-sm text-gray-600'>
                  Recebido: {formatPrice(order.payment.cashReceived)}
                </p>
                <p className='text-sm font-bold text-[#FF6600]'>
                  Troco: {formatPrice(order.payment.cashChange)}
                </p>
              </div>
            )}
        </div>
      </div>

      {/* ENDEREÇO (só se houver) */}
      {order.shippingAddress?.street && (
        <div className='border border-gray-200 rounded p-4 mb-6'>
          <p className='text-xs font-bold text-gray-500 uppercase tracking-wide mb-2'>
            Endereço de Entrega
          </p>
          <p className='text-sm text-gray-900'>
            {order.shippingAddress.street}, {order.shippingAddress.number}
            {order.shippingAddress.complement &&
              ` · ${order.shippingAddress.complement}`}
          </p>
          <p className='text-sm text-gray-600'>
            {order.shippingAddress.neighborhood} · {order.shippingAddress.city}{' '}
            - {order.shippingAddress.state}
          </p>
          <p className='text-sm text-gray-600 font-mono'>
            CEP: {order.shippingAddress.cep}
          </p>
        </div>
      )}

      {/* ITEMS */}
      <table className='w-full text-sm mb-6'>
        <thead>
          <tr className='border-b-2 border-gray-300'>
            <th className='text-left py-2 px-2 font-bold text-gray-700'>SKU</th>
            <th className='text-left py-2 px-2 font-bold text-gray-700'>
              Produto
            </th>
            <th className='text-center py-2 px-2 font-bold text-gray-700'>
              Qtd
            </th>
            <th className='text-right py-2 px-2 font-bold text-gray-700'>
              Unitário
            </th>
            <th className='text-right py-2 px-2 font-bold text-gray-700'>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => {
            const lineGross = item.price * item.quantity;
            const hasDiscount = (item.discountPercent ?? 0) > 0;
            const lineNet = lineGross - (item.discountValue ?? 0);
            return (
              <tr key={idx} className='border-b border-gray-100'>
                <td className='py-2 px-2 font-mono text-xs text-gray-500'>
                  {item.sku}
                </td>
                <td className='py-2 px-2 text-gray-900'>
                  {item.name}
                  {hasDiscount && (
                    <span className='block text-xs text-green-700'>
                      desconto {item.discountPercent}%
                    </span>
                  )}
                </td>
                <td className='py-2 px-2 text-center'>{item.quantity}</td>
                <td className='py-2 px-2 text-right'>
                  {formatPrice(item.price)}
                </td>
                <td className='py-2 px-2 text-right font-medium'>
                  {hasDiscount ? (
                    <>
                      <span className='line-through text-gray-400 text-xs mr-1'>
                        {formatPrice(lineGross)}
                      </span>
                      {formatPrice(lineNet)}
                    </>
                  ) : (
                    formatPrice(lineGross)
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* TOTAIS */}
      <div className='flex justify-end mb-6'>
        <div className='w-72 space-y-1.5 text-sm'>
          <div className='flex justify-between text-gray-600'>
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className='flex justify-between text-green-700'>
              <span>Desconto{order.coupon ? ` (${order.coupon})` : ''}</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          {order.shippingCost > 0 && (
            <div className='flex justify-between text-gray-600'>
              <span>Frete</span>
              <span>{formatPrice(order.shippingCost)}</span>
            </div>
          )}
          <div className='flex justify-between font-bold text-lg text-gray-900 pt-2 border-t-2 border-gray-300'>
            <span>TOTAL</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* OBSERVAÇÕES */}
      {order.notes && (
        <div className='border-t pt-4 mb-4'>
          <p className='text-xs font-bold text-gray-500 uppercase tracking-wide mb-1'>
            Observações
          </p>
          <p className='text-sm text-gray-600 whitespace-pre-line'>
            {order.notes}
          </p>
        </div>
      )}

      {/* FOOTER */}
      <div className='text-center text-xs text-gray-400 pt-6 mt-auto border-t'>
        <p>Obrigado pela preferência!</p>
        <p className='mt-1'>{company.url.replace(/^https?:\/\//, '')}</p>
      </div>
    </div>
  );
}
