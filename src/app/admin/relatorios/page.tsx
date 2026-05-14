'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Package,
  Store,
  Globe,
  Users,
  Loader2,
  Calendar,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DailyPoint {
  date: string;
  revenue: number;
  count: number;
}

interface ReportData {
  period: { from: string; to: string; days: number };
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
  dailySeries: DailyPoint[];
  byChannel: {
    pos: { count: number; revenue: number };
    online: { count: number; revenue: number };
  };
  byPaymentMethod: { [key: string]: { count: number; revenue: number } };
  topProducts: {
    name: string;
    sku: string;
    quantity: number;
    revenue: number;
  }[];
  topCustomers: {
    name: string;
    cpf: string;
    count: number;
    revenue: number;
  }[];
}

type Preset = 'today' | 'week' | 'month' | 'custom';

const PAYMENT_LABELS: { [key: string]: string } = {
  cash: 'Dinheiro',
  pix: 'PIX',
  debit_card: 'Débito',
  credit_card: 'Crédito',
  boleto: 'Boleto',
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Calcula intervalo baseado no preset
function getRangeForPreset(preset: Preset): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);

  if (preset === 'today') {
    return { from: new Date(now), to };
  }
  if (preset === 'week') {
    const from = new Date(now);
    from.setDate(from.getDate() - 6); // últimos 7 dias incluindo hoje
    return { from, to };
  }
  if (preset === 'month') {
    const from = new Date(now);
    from.setDate(1); // dia 1 do mês corrente
    return { from, to };
  }
  // custom default: últimos 30 dias
  const from = new Date(now);
  from.setDate(from.getDate() - 29);
  return { from, to };
}

export default function RelatoriosPage() {
  const [preset, setPreset] = useState<Preset>('week');
  const [fromDate, setFromDate] = useState(
    () => getRangeForPreset('week').from,
  );
  const [toDate, setToDate] = useState(() => getRangeForPreset('week').to);
  const [channel, setChannel] = useState<'all' | 'pos' | 'online'>('all');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const handlePresetChange = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') {
      const range = getRangeForPreset(p);
      setFromDate(range.from);
      setToDate(range.to);
    }
  };

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('from', toDateInputValue(fromDate));
      params.set('to', toDateInputValue(toDate));
      if (channel !== 'all') params.set('channel', channel);

      const res = await fetch(`/api/admin/reports?${params}`);
      const data = await res.json();
      if (data.success) setReport(data.report);
      else toast.error(data.error);
    } catch {
      toast.error('Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, channel]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Encontra valor máximo no gráfico para escalar
  const maxRevenue = report
    ? Math.max(...report.dailySeries.map(d => d.revenue), 1)
    : 1;

  return (
    <div>
      {/* HEADER */}
      <div className='flex items-start justify-between mb-6 flex-wrap gap-3'>
        <div>
          <h1 className='text-2xl font-bold'>Relatórios</h1>
          <p className='text-sm text-gray-500 mt-1'>
            Análise consolidada de vendas
          </p>
        </div>

        {/* Channel Filter */}
        <select
          value={channel}
          onChange={e => setChannel(e.target.value as 'all' | 'pos' | 'online')}
          className='text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
        >
          <option value='all'>Todos os canais</option>
          <option value='pos'>🏪 Balcão</option>
          <option value='online'>🌐 Site</option>
        </select>
      </div>

      {/* PRESETS */}
      <div className='bg-white rounded-lg shadow-sm p-3 mb-4 flex items-center gap-2 flex-wrap'>
        <Calendar size={14} className='text-gray-400 ml-1' />
        <button
          onClick={() => handlePresetChange('today')}
          className={`text-sm px-3 py-1.5 rounded-md transition-colors ${preset === 'today' ? 'bg-[#FF6600] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Hoje
        </button>
        <button
          onClick={() => handlePresetChange('week')}
          className={`text-sm px-3 py-1.5 rounded-md transition-colors ${preset === 'week' ? 'bg-[#FF6600] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Últimos 7 dias
        </button>
        <button
          onClick={() => handlePresetChange('month')}
          className={`text-sm px-3 py-1.5 rounded-md transition-colors ${preset === 'month' ? 'bg-[#FF6600] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Mês atual
        </button>
        <button
          onClick={() => handlePresetChange('custom')}
          className={`text-sm px-3 py-1.5 rounded-md transition-colors ${preset === 'custom' ? 'bg-[#FF6600] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Personalizado
        </button>

        {preset === 'custom' && (
          <div className='flex items-center gap-2 ml-2'>
            <input
              type='date'
              value={toDateInputValue(fromDate)}
              onChange={e => {
                const [y, m, d] = e.target.value.split('-').map(Number);
                setFromDate(new Date(y, m - 1, d));
              }}
              className='text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
            />
            <span className='text-sm text-gray-400'>até</span>
            <input
              type='date'
              value={toDateInputValue(toDate)}
              onChange={e => {
                const [y, m, d] = e.target.value.split('-').map(Number);
                setToDate(new Date(y, m - 1, d));
              }}
              className='text-sm px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
            />
          </div>
        )}

        <div className='ml-auto text-xs text-gray-500'>
          {report?.period.days || 0} dia{report?.period.days !== 1 && 's'}
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
        <div className='bg-white rounded-lg shadow-sm p-12 text-center'>
          <Calendar
            size={48}
            className='mx-auto mb-3 opacity-30 text-gray-400'
          />
          <p className='text-lg font-medium text-gray-700'>
            Nenhuma venda no período
          </p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-3 mb-4'>
            <div className='bg-white rounded-lg shadow-sm p-4 border-l-4 border-[#FF6600]'>
              <div className='flex items-center gap-2 mb-1'>
                <DollarSign size={14} className='text-[#FF6600]' />
                <p className='text-xs uppercase font-semibold text-gray-500 tracking-wide'>
                  Receita Total
                </p>
              </div>
              <p className='text-2xl font-black text-gray-900'>
                {formatPrice(report.summary.totalRevenue)}
              </p>
              <p className='text-xs text-gray-500 mt-0.5'>
                {report.summary.orderCount} vendas
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
                {report.summary.totalItems} itens
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

          {/* GRÁFICO DE VENDAS POR DIA */}
          <div className='bg-white rounded-lg shadow-sm p-5 mb-4'>
            <h2 className='text-sm font-bold text-gray-700 uppercase tracking-wide mb-4'>
              Vendas por Dia
            </h2>
            {report.dailySeries.length === 0 ? (
              <p className='text-sm text-gray-400'>Sem dados</p>
            ) : (
              <div className='flex items-end justify-between gap-1 h-48 px-2'>
                {report.dailySeries.map((d, idx) => {
                  const heightPct = (d.revenue / maxRevenue) * 100;
                  return (
                    <div
                      key={idx}
                      className='flex-1 flex flex-col items-center gap-1 group relative'
                      title={`${formatShortDate(d.date)}: ${formatPrice(d.revenue)} · ${d.count} vendas`}
                    >
                      <div className='w-full bg-gray-100 rounded-t flex items-end overflow-hidden h-full'>
                        <div
                          className='w-full bg-gradient-to-t from-[#FF6600] to-[#ff8533] rounded-t transition-all hover:opacity-80'
                          style={{
                            height: `${heightPct}%`,
                            minHeight: d.revenue > 0 ? '2px' : '0',
                          }}
                        />
                      </div>
                      <p className='text-[9px] text-gray-500 font-mono'>
                        {formatShortDate(d.date)}
                      </p>

                      {/* Tooltip on hover */}
                      <div className='hidden group-hover:block absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10'>
                        {formatPrice(d.revenue)} · {d.count}{' '}
                        {d.count === 1 ? 'venda' : 'vendas'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4'>
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
                          {report.byChannel.pos.count} vendas
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
                          {report.byChannel.online.count} vendas
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

            {/* POR PAGAMENTO */}
            <div className='bg-white rounded-lg shadow-sm p-5'>
              <h2 className='text-sm font-bold text-gray-700 uppercase tracking-wide mb-3'>
                Por Forma de Pagamento
              </h2>
              <div className='space-y-1.5'>
                {Object.entries(report.byPaymentMethod)
                  .sort((a, b) => b[1].revenue - a[1].revenue)
                  .map(([method, data]) => {
                    if (data.count === 0) return null;
                    return (
                      <div
                        key={method}
                        className='flex items-center justify-between p-2.5 bg-gray-50 rounded-md'
                      >
                        <div>
                          <p className='text-sm font-medium text-gray-900'>
                            {PAYMENT_LABELS[method] || method}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {data.count} vendas
                          </p>
                        </div>
                        <p className='font-bold text-gray-900'>
                          {formatPrice(data.revenue)}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            {/* TOP PRODUTOS */}
            <div className='bg-white rounded-lg shadow-sm p-5'>
              <h2 className='text-sm font-bold text-gray-700 uppercase tracking-wide mb-3'>
                Top Produtos do Período
              </h2>
              {report.topProducts.length === 0 ? (
                <p className='text-sm text-gray-400'>Sem dados</p>
              ) : (
                <div className='space-y-1.5'>
                  {report.topProducts.slice(0, 10).map((p, idx) => (
                    <div
                      key={idx}
                      className='flex items-center gap-3 p-2 hover:bg-gray-50 rounded'
                    >
                      <span className='text-xs font-bold text-gray-400 w-6'>
                        #{idx + 1}
                      </span>
                      <Package
                        size={14}
                        className='text-gray-300 flex-shrink-0'
                      />
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-900 line-clamp-1'>
                          {p.name}
                        </p>
                        <p className='text-[10px] text-gray-400 font-mono'>
                          {p.sku}
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

            {/* TOP CLIENTES */}
            <div className='bg-white rounded-lg shadow-sm p-5'>
              <h2 className='text-sm font-bold text-gray-700 uppercase tracking-wide mb-3'>
                Top Clientes do Período
              </h2>
              {report.topCustomers.length === 0 ? (
                <p className='text-sm text-gray-400 text-center py-4'>
                  Nenhum cliente identificado.
                  <br />
                  <span className='text-xs'>
                    Vendas anônimas (&quot;Consumidor&quot;) não aparecem aqui.
                  </span>
                </p>
              ) : (
                <div className='space-y-1.5'>
                  {report.topCustomers.map((c, idx) => (
                    <div
                      key={idx}
                      className='flex items-center gap-3 p-2 hover:bg-gray-50 rounded'
                    >
                      <span className='text-xs font-bold text-gray-400 w-6'>
                        #{idx + 1}
                      </span>
                      <Users
                        size={14}
                        className='text-gray-300 flex-shrink-0'
                      />
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-900 line-clamp-1'>
                          {c.name}
                        </p>
                        {c.cpf && (
                          <p className='text-[10px] text-gray-400 font-mono'>
                            {c.cpf}
                          </p>
                        )}
                      </div>
                      <div className='text-right'>
                        <p className='text-sm font-bold text-gray-900'>
                          {c.count}x
                        </p>
                        <p className='text-[10px] text-gray-500'>
                          {formatPrice(c.revenue)}
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
