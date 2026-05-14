'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Calendar,
  Banknote,
  CreditCard,
  QrCode,
  FileText,
  Store,
  Globe,
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CashReport {
  date: string;
  summary: {
    totalRevenue: number;
    totalDiscount: number;
    totalCost: number;
    grossMargin: number;
    marginPercent: number;
    totalItems: number;
    orderCount: number;
    avgTicket: number;
    cancelledCount: number;
  };
  cash: {
    received: number;
    change: number;
    net: number;
  };
  byChannel: {
    pos: { count: number; revenue: number };
    online: { count: number; revenue: number };
  };
  byPaymentMethod: Record<string, { count: number; revenue: number }>;
  topProducts: {
    name: string;
    sku: string;
    quantity: number;
    revenue: number;
  }[];
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface PaymentConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
}

const PAYMENT_CONFIG: { [key: string]: PaymentConfig } = {
  cash: {
    label: 'Dinheiro',
    icon: <Banknote size={16} />,
    color: 'text-green-700 bg-green-50 border-green-200',
  },
  pix: {
    label: 'PIX',
    icon: <QrCode size={16} />,
    color: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  debit_card: {
    label: 'Débito',
    icon: <CreditCard size={16} />,
    color: 'text-purple-700 bg-purple-50 border-purple-200',
  },
  credit_card: {
    label: 'Crédito',
    icon: <CreditCard size={16} />,
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  },
  boleto: {
    label: 'Boleto',
    icon: <FileText size={16} />,
    color: 'text-gray-700 bg-gray-50 border-gray-200',
  },
};

export default function CaixaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [report, setReport] = useState<CashReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<'all' | 'pos' | 'online'>('all');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('date', toDateInputValue(selectedDate));
      if (channel !== 'all') params.set('channel', channel);

      const res = await fetch(`/api/admin/cash-closing?${params}`);
      const data = await res.json();
      if (data.success) setReport(data.report);
      else toast.error(data.error);
    } catch {
      toast.error('Erro ao carregar fechamento de caixa');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, channel]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const changeDay = (delta: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + delta);
    setSelectedDate(next);
  };

  const goToToday = () => setSelectedDate(new Date());

  const isToday =
    toDateInputValue(selectedDate) === toDateInputValue(new Date());

  return (
    <div>
      {/* HEADER */}
      <div className='flex items-start justify-between mb-6 flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-bold'>Fechamento de Caixa</h1>
          <p className='text-sm text-gray-500 mt-1 capitalize'>
            {formatDateLong(selectedDate)}
            {isToday && (
              <span className='ml-2 inline-block text-xs bg-[#FF6600] text-white px-2 py-0.5 rounded font-bold'>
                HOJE
              </span>
            )}
          </p>
        </div>

        {/* Date Picker + Channel Filter */}
        <div className='flex items-center gap-2 flex-wrap'>
          <select
            value={channel}
            onChange={e =>
              setChannel(e.target.value as 'all' | 'pos' | 'online')
            }
            className='text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
          >
            <option value='all'>Todos os canais</option>
            <option value='pos'>🏪 Balcão</option>
            <option value='online'>🌐 Site</option>
          </select>

          <div className='flex items-center bg-white border border-gray-300 rounded-md'>
            <button
              onClick={() => changeDay(-1)}
              className='p-2 hover:bg-gray-50 transition-colors'
              title='Dia anterior'
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type='date'
              value={toDateInputValue(selectedDate)}
              onChange={e => {
                const [y, m, d] = e.target.value.split('-').map(Number);
                setSelectedDate(new Date(y, m - 1, d));
              }}
              className='px-3 py-1.5 text-sm border-x border-gray-300 focus:outline-none'
            />
            <button
              onClick={() => changeDay(1)}
              disabled={isToday}
              className='p-2 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
              title='Dia seguinte'
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {!isToday && (
            <button
              onClick={goToToday}
              className='text-sm px-3 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] transition-colors'
            >
              Voltar para hoje
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className='flex items-center justify-center h-64'>
          <Loader2 size={32} className='animate-spin text-[#FF6600]' />
        </div>
      ) : !report ? (
        <div className='p-12 text-center text-gray-500'>
          Erro ao carregar relatório
        </div>
      ) : report.summary.orderCount === 0 ? (
        // ESTADO VAZIO
        <div className='bg-white rounded-lg shadow-sm p-12 text-center'>
          <Calendar
            size={48}
            className='mx-auto mb-3 opacity-30 text-gray-400'
          />
          <p className='text-lg font-medium text-gray-700'>
            Nenhuma venda registrada
          </p>
          <p className='text-sm text-gray-500 mt-1'>
            {isToday
              ? 'As vendas aparecerão aqui ao longo do dia.'
              : 'Nenhuma venda foi registrada neste dia.'}
          </p>
        </div>
      ) : (
        <>
          {/* KPIs PRINCIPAIS */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-3 mb-6'>
            <div className='bg-white rounded-lg shadow-sm p-4 border-l-4 border-[#FF6600]'>
              <div className='flex items-center gap-2 mb-1'>
                <DollarSign size={14} className='text-[#FF6600]' />
                <p className='text-xs uppercase font-semibold text-gray-500 tracking-wide'>
                  Vendas
                </p>
              </div>
              <p className='text-2xl font-black text-gray-900'>
                {formatPrice(report.summary.totalRevenue)}
              </p>
              <p className='text-xs text-gray-500 mt-0.5'>
                {report.summary.orderCount}{' '}
                {report.summary.orderCount === 1 ? 'venda' : 'vendas'}
              </p>
            </div>

            <div className='bg-white rounded-lg shadow-sm p-4'>
              <div className='flex items-center gap-2 mb-1'>
                <ShoppingBag size={14} className='text-gray-400' />
                <p className='text-xs uppercase font-semibold text-gray-500 tracking-wide'>
                  Ticket Médio
                </p>
              </div>
              <p className='text-2xl font-black text-gray-900'>
                {formatPrice(report.summary.avgTicket)}
              </p>
              <p className='text-xs text-gray-500 mt-0.5'>
                {report.summary.totalItems} itens vendidos
              </p>
            </div>

            <div className='bg-white rounded-lg shadow-sm p-4'>
              <div className='flex items-center gap-2 mb-1'>
                <TrendingUp size={14} className='text-green-600' />
                <p className='text-xs uppercase font-semibold text-gray-500 tracking-wide'>
                  Margem Bruta
                </p>
              </div>
              <p className='text-2xl font-black text-gray-900'>
                {formatPrice(report.summary.grossMargin)}
              </p>
              <p className='text-xs text-green-600 mt-0.5 font-medium'>
                {report.summary.marginPercent.toFixed(1)}%
              </p>
            </div>

            <div className='bg-white rounded-lg shadow-sm p-4'>
              <div className='flex items-center gap-2 mb-1'>
                <XCircle size={14} className='text-red-500' />
                <p className='text-xs uppercase font-semibold text-gray-500 tracking-wide'>
                  Cancelados
                </p>
              </div>
              <p className='text-2xl font-black text-gray-900'>
                {report.summary.cancelledCount}
              </p>
              <p className='text-xs text-gray-500 mt-0.5'>pedidos cancelados</p>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* COLUNA ESQUERDA */}
            <div className='space-y-6'>
              {/* POR CANAL */}
              {channel === 'all' && (
                <div className='bg-white rounded-lg shadow-sm p-5'>
                  <h2 className='text-sm font-bold text-gray-700 uppercase tracking-wide mb-3'>
                    Por Canal
                  </h2>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between p-3 bg-orange-50 rounded-md border border-orange-100'>
                      <div className='flex items-center gap-2'>
                        <Store size={16} className='text-orange-600' />
                        <div>
                          <p className='text-sm font-medium text-gray-900'>
                            Balcão (POS)
                          </p>
                          <p className='text-xs text-gray-500'>
                            {report.byChannel.pos.count}{' '}
                            {report.byChannel.pos.count === 1
                              ? 'venda'
                              : 'vendas'}
                          </p>
                        </div>
                      </div>
                      <p className='font-bold text-gray-900'>
                        {formatPrice(report.byChannel.pos.revenue)}
                      </p>
                    </div>
                    <div className='flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-100'>
                      <div className='flex items-center gap-2'>
                        <Globe size={16} className='text-blue-600' />
                        <div>
                          <p className='text-sm font-medium text-gray-900'>
                            Site Online
                          </p>
                          <p className='text-xs text-gray-500'>
                            {report.byChannel.online.count}{' '}
                            {report.byChannel.online.count === 1
                              ? 'venda'
                              : 'vendas'}
                          </p>
                        </div>
                      </div>
                      <p className='font-bold text-gray-900'>
                        {formatPrice(report.byChannel.online.revenue)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* POR FORMA DE PAGAMENTO */}
              <div className='bg-white rounded-lg shadow-sm p-5'>
                <h2 className='text-sm font-bold text-gray-700 uppercase tracking-wide mb-3'>
                  Por Forma de Pagamento
                </h2>
                <div className='space-y-1.5'>
                  {Object.entries(report.byPaymentMethod)
                    .sort((a, b) => b[1].revenue - a[1].revenue)
                    .map(([method, data]) => {
                      const config = PAYMENT_CONFIG[method];
                      if (!config) return null;
                      return (
                        <div
                          key={method}
                          className={`flex items-center justify-between p-3 rounded-md border ${config.color} ${data.count === 0 ? 'opacity-40' : ''}`}
                        >
                          <div className='flex items-center gap-2'>
                            {config.icon}
                            <div>
                              <p className='text-sm font-medium'>
                                {config.label}
                              </p>
                              <p className='text-xs opacity-75'>
                                {data.count}{' '}
                                {data.count === 1 ? 'venda' : 'vendas'}
                              </p>
                            </div>
                          </div>
                          <p className='font-bold'>
                            {formatPrice(data.revenue)}
                          </p>
                        </div>
                      );
                    })}
                </div>

                {/* DINHEIRO: Recebido vs Troco */}
                {report.byPaymentMethod.cash?.count > 0 && (
                  <div className='mt-4 pt-4 border-t'>
                    <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'>
                      Detalhamento Dinheiro
                    </p>
                    <div className='space-y-1 text-sm'>
                      <div className='flex justify-between text-gray-700'>
                        <span>Total recebido</span>
                        <span className='font-mono'>
                          {formatPrice(report.cash.received)}
                        </span>
                      </div>
                      <div className='flex justify-between text-gray-700'>
                        <span>Total troco dado</span>
                        <span className='font-mono'>
                          -{formatPrice(report.cash.change)}
                        </span>
                      </div>
                      <div className='flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-200'>
                        <span>Líquido em caixa</span>
                        <span className='font-mono'>
                          {formatPrice(report.cash.net)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* COLUNA DIREITA — TOP PRODUTOS */}
            <div className='bg-white rounded-lg shadow-sm p-5'>
              <h2 className='text-sm font-bold text-gray-700 uppercase tracking-wide mb-3'>
                Top Produtos do Dia
              </h2>
              {report.topProducts.length === 0 ? (
                <p className='text-sm text-gray-400 text-center py-8'>
                  Sem produtos vendidos
                </p>
              ) : (
                <div className='space-y-2'>
                  {report.topProducts.map((p, idx) => (
                    <div
                      key={idx}
                      className='flex items-center gap-3 p-2 hover:bg-gray-50 rounded'
                    >
                      <span className='text-xs font-bold text-gray-400 w-6'>
                        #{idx + 1}
                      </span>
                      <Package
                        size={16}
                        className='text-gray-300 flex-shrink-0'
                      />
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-900 line-clamp-1'>
                          {p.name}
                        </p>
                        <p className='text-[10px] text-gray-400 font-mono'>
                          SKU: {p.sku}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-sm font-bold text-gray-900'>
                          {p.quantity}x
                        </p>
                        <p className='text-[10px] text-gray-500'>
                          {formatPrice(p.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
