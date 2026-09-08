// 📄 src/components/admin/ShippingLabel.tsx
// Etiqueta Melhor Envio no detalhe do pedido (admin).
//
// Fluxo (API v2 do Melhor Envio, executado pela rota /api/shipping/label):
//   carrinho (cart-write) → checkout c/ saldo (shipping-checkout) →
//   generate (shipping-generate) → print (shipping-print).
//
// Estados do componente:
//   • Sem etiqueta → volume editável (pré-preenchido pelos produtos),
//     cotação das transportadoras (pré-seleciona a escolhida no checkout)
//     e botão "Gerar etiqueta".
//   • Com etiqueta → status do envio, código de rastreio (auto-sincronizado
//     pela rota GET assim que os Correios geram), botão "Imprimir PDF"
//     (sempre pede URL fresca — as URLs do /print expiram) e cancelamento
//     com recuperação de saldo.
//
// v1: primeira versão funcional (substitui o placeholder).
// v2 (GAP 2): PDF DENTRO do painel — modal com <iframe> alimentado pelo
//     proxy /api/shipping/label/pdf/[orderId] (blob same-origin), botões
//     Imprimir (iframe.print com fallback), Baixar e Fechar (revoga o
//     objectURL). Substitui os window.open de aba externa.

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Ticket,
  Printer,
  Loader2,
  RefreshCw,
  XCircle,
  Copy,
  ExternalLink,
  AlertTriangle,
  Download,
  X,
} from 'lucide-react';

interface Quote {
  id: number;
  name: string;
  price: number;
  deliveryDays: number;
  company: string;
  companyLogo?: string;
}

interface PackageData {
  weight: number; // kg
  height: number; // cm
  width: number; // cm
  length: number; // cm
}

interface Tracking {
  status: string;
  trackingCode: string | null;
  meTrackingUrl: string | null;
  postedAt: string | null;
  deliveredAt: string | null;
}

interface LabelState {
  hasLabel: boolean;
  // hasLabel = true
  shipmentId?: string;
  printUrl?: string | null;
  tracking?: Tracking | null;
  trackingCode?: string | null;
  // hasLabel = false
  paid?: boolean;
  suggestedPackage?: PackageData;
  insuranceValue?: number;
  quotes?: Quote[];
  selectedAtCheckout?: number | null;
  checkoutMethod?: string | null;
}

const ME_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: {
    label: 'Aguardando pagamento',
    color: 'bg-yellow-100 text-yellow-700',
  },
  released: {
    label: 'Paga — pronta p/ postagem',
    color: 'bg-blue-100 text-blue-700',
  },
  generated: { label: 'Etiqueta gerada', color: 'bg-blue-100 text-blue-700' },
  posted: { label: 'Postada', color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-700' },
  canceled: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
  undelivered: { label: 'Não entregue', color: 'bg-red-100 text-red-700' },
};

function formatPrice(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ShippingLabel({
  orderId,
  onUpdated,
}: {
  orderId: string;
  /** Chamado após gerar/cancelar para a página recarregar o pedido */
  onUpdated?: () => void;
}) {
  const [state, setState] = useState<LabelState | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [pkg, setPkg] = useState<PackageData | null>(null);
  const [serviceId, setServiceId] = useState<number | null>(null);

  // v2 (GAP 2): visualizador de PDF embutido
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // ── Carrega status/cotação (opcionalmente com volume editado) ──
  const load = useCallback(
    async (customPkg?: PackageData) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ orderId });
        if (customPkg) {
          params.set('weight', String(customPkg.weight));
          params.set('height', String(customPkg.height));
          params.set('width', String(customPkg.width));
          params.set('length', String(customPkg.length));
        }
        const res = await fetch(`/api/shipping/label?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Erro ao consultar etiqueta');
          setState(null);
          return;
        }
        setState(data);
        if (!data.hasLabel) {
          setPkg(customPkg || data.suggestedPackage);
          // Pré-seleciona: serviço do checkout > mais barato
          setServiceId(
            data.selectedAtCheckout ?? (data.quotes?.[0]?.id || null),
          );
        }
      } catch {
        toast.error('Erro de rede ao consultar o Melhor Envio');
      } finally {
        setLoading(false);
      }
    },
    [orderId],
  );

  useEffect(() => {
    load();
  }, [load]);

  // ── Gerar etiqueta (carrinho → checkout → generate → print) ──
  const handleGenerate = async () => {
    if (!serviceId || !pkg) return;
    if (
      !window.confirm(
        'Gerar a etiqueta agora?\n\nO valor do frete será debitado do saldo da carteira Melhor Envio.',
      )
    ) {
      return;
    }
    setWorking(true);
    try {
      const res = await fetch('/api/shipping/label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, serviceId, package: pkg }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao gerar etiqueta');
        return;
      }
      toast.success('Etiqueta gerada com sucesso!');
      await load();
      // Abre o PDF direto no painel (a geração do ME é assíncrona — o
      // proxy devolve 503 amigável se ainda não estiver pronto)
      await openPdf();
      onUpdated?.();
    } catch {
      toast.error('Erro de rede ao gerar etiqueta');
    } finally {
      setWorking(false);
    }
  };

  // ── v2 (GAP 2): PDF no painel — o proxy re-solicita URL fresca ao ME
  // (as URLs do /print expiram), baixa server-side e devolve um blob
  // same-origin para o <iframe> e a impressão. ──
  const openPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/shipping/label/pdf/${orderId}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || 'Não foi possível obter o PDF da etiqueta');
        return;
      }
      const blob = await res.blob();
      setPdfUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch {
      toast.error('Erro de rede ao obter o PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const closePdf = () => {
    setPdfUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const printPdf = () => {
    // Impressão via iframe; alguns browsers bloqueiam print de blob em
    // iframe — fallback: abre o próprio blob em nova aba
    try {
      const win = iframeRef.current?.contentWindow;
      if (win) {
        win.focus();
        win.print();
        return;
      }
    } catch {
      /* fallback abaixo */
    }
    if (pdfUrl) window.open(pdfUrl, '_blank', 'noopener');
  };

  // ── Cancelar etiqueta (recupera saldo se ainda não postada) ──
  const handleCancel = async () => {
    if (
      !window.confirm(
        'Cancelar esta etiqueta?\n\nO valor pago volta para o saldo da carteira Melhor Envio (apenas se ainda não foi postada). Depois será possível gerar uma nova etiqueta.',
      )
    ) {
      return;
    }
    setWorking(true);
    try {
      const res = await fetch(`/api/shipping/label?orderId=${orderId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erro ao cancelar etiqueta');
        return;
      }
      toast.success('Etiqueta cancelada — saldo devolvido à carteira');
      await load();
      onUpdated?.();
    } catch {
      toast.error('Erro de rede ao cancelar');
    } finally {
      setWorking(false);
    }
  };

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado');
  };

  const updatePkg = (field: keyof PackageData, value: string) => {
    if (!pkg) return;
    setPkg({ ...pkg, [field]: parseFloat(value) || 0 });
  };

  // ────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────

  if (loading && !state) {
    return (
      <div className='bg-white rounded-lg shadow-sm p-4'>
        <div className='flex items-center gap-2 text-gray-500 text-sm'>
          <Loader2 size={16} className='animate-spin' />
          Consultando Melhor Envio...
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className='bg-white rounded-lg shadow-sm p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2 text-sm text-red-600'>
            <AlertTriangle size={16} />
            Não foi possível consultar o Melhor Envio
          </div>
          <button
            onClick={() => load()}
            className='text-sm text-[#FF6600] hover:underline flex items-center gap-1'
          >
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // ── ESTADO: etiqueta já emitida ──
  if (state.hasLabel) {
    const meStatus = state.tracking?.status || '';
    const badge = ME_STATUS_LABELS[meStatus] || {
      label: meStatus || 'Desconhecido',
      color: 'bg-gray-100 text-gray-600',
    };
    const code = state.trackingCode || state.tracking?.trackingCode || null;
    const isCancelled = meStatus === 'canceled' || meStatus === 'cancelled';

    return (
      <div className='bg-white rounded-lg shadow-sm p-4'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <Ticket size={16} className='text-gray-400' />
            <h2 className='font-semibold'>Etiqueta Melhor Envio</h2>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
          >
            {badge.label}
          </span>
        </div>

        <div className='space-y-2 text-sm'>
          {code ? (
            <div className='flex items-center gap-2'>
              <span className='text-gray-500'>Rastreio:</span>
              <span className='font-mono font-medium'>{code}</span>
              <button
                onClick={() => handleCopyTracking(code)}
                className='text-gray-400 hover:text-gray-600'
                title='Copiar código'
              >
                <Copy size={13} />
              </button>
            </div>
          ) : (
            !isCancelled && (
              <p className='text-xs text-gray-500'>
                Código de rastreio ainda não emitido pela transportadora —
                atualize após a postagem.
              </p>
            )
          )}
          {state.tracking?.meTrackingUrl && (
            <a
              href={state.tracking.meTrackingUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1 text-[#FF6600] hover:underline text-xs'
            >
              Acompanhar no Melhor Rastreio <ExternalLink size={12} />
            </a>
          )}
        </div>

        <div className='flex flex-wrap gap-2 mt-4'>
          {!isCancelled && (
            <button
              onClick={openPdf}
              disabled={working || pdfLoading}
              className='px-4 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] disabled:opacity-50 flex items-center gap-1.5 text-sm'
            >
              {working || pdfLoading ? (
                <Loader2 size={14} className='animate-spin' />
              ) : (
                <Printer size={14} />
              )}
              Ver / imprimir etiqueta (PDF)
            </button>
          )}
          <button
            onClick={() => load()}
            disabled={working}
            className='px-3 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5 text-sm'
          >
            <RefreshCw size={14} />
            Atualizar rastreio
          </button>
          {!isCancelled && (
            <button
              onClick={handleCancel}
              disabled={working}
              className='px-3 py-2 border border-red-200 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50 flex items-center gap-1.5 text-sm ml-auto'
            >
              <XCircle size={14} />
              Cancelar etiqueta
            </button>
          )}
        </div>

        {/* v2 (GAP 2): MODAL DO PDF — visualizador embutido no painel */}
        {pdfUrl && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
            <div className='flex h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl'>
              <div className='flex items-center justify-between border-b px-4 py-3'>
                <h3 className='font-semibold text-gray-900 flex items-center gap-2'>
                  <Ticket size={16} className='text-gray-400' />
                  Etiqueta Melhor Envio
                </h3>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={printPdf}
                    className='px-3 py-1.5 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] flex items-center gap-1.5 text-sm'
                  >
                    <Printer size={14} />
                    Imprimir
                  </button>
                  <a
                    href={pdfUrl}
                    download={`etiqueta-${state.trackingCode || orderId}.pdf`}
                    className='px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-1.5 text-sm'
                  >
                    <Download size={14} />
                    Baixar
                  </a>
                  <button
                    onClick={closePdf}
                    className='p-1.5 text-gray-400 hover:text-gray-600'
                    title='Fechar'
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <iframe
                ref={iframeRef}
                src={pdfUrl}
                title='Etiqueta Melhor Envio (PDF)'
                className='w-full flex-1 rounded-b-xl'
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── ESTADO: sem etiqueta — volume + cotação + geração ──
  return (
    <div className='bg-white rounded-lg shadow-sm p-4'>
      <div className='flex items-center gap-2 mb-3'>
        <Ticket size={16} className='text-gray-400' />
        <h2 className='font-semibold'>Etiqueta Melhor Envio</h2>
      </div>

      {state.paid === false && (
        <div className='mb-3 p-2.5 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800 flex items-center gap-2'>
          <AlertTriangle size={14} className='shrink-0' />O pedido ainda não foi
          pago — a etiqueta só pode ser gerada após a confirmação do pagamento.
        </div>
      )}

      {/* VOLUME (pré-preenchido pelas dimensões dos produtos) */}
      {pkg && (
        <div className='mb-4'>
          <p className='text-xs font-medium text-gray-500 mb-1.5'>
            Volume (pré-calculado pelos produtos — ajuste se necessário)
          </p>
          <div className='grid grid-cols-4 gap-2'>
            {(
              [
                ['weight', 'Peso (kg)', '0.001'],
                ['length', 'Comp. (cm)', '1'],
                ['width', 'Larg. (cm)', '1'],
                ['height', 'Alt. (cm)', '1'],
              ] as [keyof PackageData, string, string][]
            ).map(([field, label, step]) => (
              <div key={field}>
                <label className='block text-[11px] text-gray-500 mb-0.5'>
                  {label}
                </label>
                <input
                  type='number'
                  min='0'
                  step={step}
                  value={pkg[field]}
                  onChange={e => updatePkg(field, e.target.value)}
                  className='w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => load(pkg)}
            disabled={loading}
            className='mt-2 text-xs text-[#FF6600] hover:underline flex items-center gap-1'
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Recotar com este volume
          </button>
        </div>
      )}

      {/* COTAÇÃO */}
      {state.quotes && state.quotes.length > 0 ? (
        <div className='space-y-1.5 mb-4'>
          <p className='text-xs font-medium text-gray-500'>
            Serviço de envio
            {state.checkoutMethod && (
              <span className='font-normal'>
                {' '}
                — cliente escolheu <strong>{state.checkoutMethod}</strong> no
                checkout
              </span>
            )}
          </p>
          {state.quotes.map(q => (
            <label
              key={q.id}
              className={`flex items-center gap-3 p-2.5 border rounded-md cursor-pointer transition-colors ${
                serviceId === q.id
                  ? 'border-[#FF6600] bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type='radio'
                name='me-service'
                checked={serviceId === q.id}
                onChange={() => setServiceId(q.id)}
                className='accent-[#FF6600]'
              />
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium truncate'>
                  {q.company} — {q.name}
                  {state.selectedAtCheckout === q.id && (
                    <span className='ml-2 text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full'>
                      escolha do cliente
                    </span>
                  )}
                </p>
                <p className='text-xs text-gray-500'>
                  até {q.deliveryDays} dia{q.deliveryDays === 1 ? '' : 's'} útil
                  {q.deliveryDays === 1 ? '' : 'eis'}
                </p>
              </div>
              <span className='text-sm font-semibold whitespace-nowrap'>
                {formatPrice(q.price)}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className='text-sm text-gray-500 mb-4'>
          Nenhuma transportadora disponível para este volume/CEP.
        </p>
      )}

      <button
        onClick={handleGenerate}
        disabled={working || !serviceId || state.paid === false}
        className='w-full px-4 py-2.5 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium'
      >
        {working ? (
          <Loader2 size={16} className='animate-spin' />
        ) : (
          <Ticket size={16} />
        )}
        {working
          ? 'Gerando etiqueta...'
          : 'Gerar etiqueta (debita da carteira)'}
      </button>
      <p className='text-[11px] text-gray-400 mt-1.5 text-center'>
        Fluxo: carrinho → pagamento com saldo → geração → PDF para impressão
      </p>
    </div>
  );
}
