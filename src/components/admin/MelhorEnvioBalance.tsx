// 📄 src/components/admin/MelhorEnvioBalance.tsx
// GAP 1 — Card de saldo da carteira Melhor Envio no admin de pedidos.
//
// • Saldo em destaque; VERMELHO abaixo de R$ 20 (etiquetas ~R$ 15-25 —
//   saldo baixo = próxima etiqueta pode falhar no checkout do ME).
// • Refresh manual + modal "Adicionar saldo" com valores rápidos
//   (50/100/200/500) ou valor livre (R$ 5 a R$ 10.000, limites do
//   gateway PIX yapay-transparente).
// • A recarga abre o QR Code PIX em nova aba; "Já paguei — atualizar
//   saldo" refaz o GET (a compensação do PIX leva alguns segundos).
'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Wallet,
  RefreshCw,
  Plus,
  Loader2,
  X,
  AlertTriangle,
} from 'lucide-react';

const LOW_BALANCE_THRESHOLD = 20;
const QUICK_VALUES = [50, 100, 200, 500];

function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function MelhorEnvioBalance() {
  const [balance, setBalance] = useState<number | null>(null);
  const [reserved, setReserved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [value, setValue] = useState<number>(100);
  const [customValue, setCustomValue] = useState('');
  const [working, setWorking] = useState(false);
  const [awaitingPayment, setAwaitingPayment] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shipping/balance');
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        setReserved(data.reserved || 0);
      } else {
        setBalance(null);
      }
    } catch {
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const effectiveValue = customValue ? parseFloat(customValue) : value;

  const handleAdd = async () => {
    if (
      !Number.isFinite(effectiveValue) ||
      effectiveValue < 5 ||
      effectiveValue > 10_000
    ) {
      toast.error('Informe um valor entre R$ 5 e R$ 10.000.');
      return;
    }
    setWorking(true);
    try {
      const res = await fetch('/api/shipping/balance/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: effectiveValue }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Erro ao iniciar a recarga.');
        return;
      }
      window.open(data.paymentUrl, '_blank', 'noopener');
      setAwaitingPayment(true);
      toast.success(
        'QR Code PIX aberto em nova aba. Pague e atualize o saldo.',
      );
    } catch {
      toast.error('Erro de rede ao iniciar a recarga.');
    } finally {
      setWorking(false);
    }
  };

  const handlePaid = async () => {
    setWorking(true);
    await load();
    setWorking(false);
    setAwaitingPayment(false);
    setModalOpen(false);
    toast.success('Saldo atualizado.');
  };

  const isLow = balance !== null && balance < LOW_BALANCE_THRESHOLD;

  return (
    <>
      <div
        className={`rounded-lg shadow-sm p-3 flex items-center gap-3 flex-wrap ${
          isLow ? 'bg-red-50 border border-red-200' : 'bg-white'
        }`}
      >
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isLow ? 'bg-red-100' : 'bg-orange-50'
          }`}
        >
          <Wallet
            size={18}
            className={isLow ? 'text-red-600' : 'text-[#FF6600]'}
          />
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-[11px] uppercase tracking-wide text-gray-500'>
            Saldo Melhor Envio
          </p>
          {loading ? (
            <Loader2 size={16} className='animate-spin text-gray-400 mt-0.5' />
          ) : balance === null ? (
            <p className='text-sm text-red-600 flex items-center gap-1'>
              <AlertTriangle size={13} /> Indisponível
            </p>
          ) : (
            <p
              className={`text-lg font-bold leading-tight ${
                isLow ? 'text-red-600' : 'text-gray-900'
              }`}
            >
              {formatPrice(balance)}
              {reserved > 0 && (
                <span className='ml-2 text-[11px] font-normal text-gray-400'>
                  ({formatPrice(reserved)} reservado)
                </span>
              )}
            </p>
          )}
          {isLow && (
            <p className='text-[11px] text-red-600'>
              Saldo baixo — a próxima etiqueta pode falhar.
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          title='Atualizar saldo'
          className='p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 text-gray-500'
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={() => setModalOpen(true)}
          className='px-3 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] flex items-center gap-1.5 text-sm'
        >
          <Plus size={14} />
          Adicionar saldo
        </button>
      </div>

      {/* Modal de recarga */}
      {modalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-sm rounded-xl bg-white p-6 shadow-xl'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='font-semibold text-gray-900'>
                Adicionar saldo via PIX
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                <X size={18} />
              </button>
            </div>

            <div className='grid grid-cols-4 gap-2 mb-3'>
              {QUICK_VALUES.map(v => (
                <button
                  key={v}
                  onClick={() => {
                    setValue(v);
                    setCustomValue('');
                  }}
                  className={`py-2 rounded-md text-sm font-medium border transition-colors ${
                    !customValue && value === v
                      ? 'bg-[#FF6600] text-white border-[#FF6600]'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  R$ {v}
                </button>
              ))}
            </div>

            <input
              type='number'
              min={5}
              max={10000}
              step='0.01'
              value={customValue}
              onChange={e => setCustomValue(e.target.value)}
              placeholder='Outro valor (R$ 5 a R$ 10.000)'
              className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] mb-4'
            />

            {!awaitingPayment ? (
              <button
                onClick={handleAdd}
                disabled={working}
                className='w-full py-2.5 bg-[#FF6600] text-white font-bold text-sm rounded-lg hover:bg-[#e55b00] disabled:opacity-50 flex items-center justify-center gap-2'
              >
                {working ? (
                  <Loader2 size={14} className='animate-spin' />
                ) : (
                  <Plus size={14} />
                )}
                Gerar QR Code PIX de {formatPrice(effectiveValue || 0)}
              </button>
            ) : (
              <div className='space-y-2'>
                <p className='text-xs text-gray-500 text-center'>
                  Pague o PIX na aba que abriu. A compensação leva alguns
                  segundos.
                </p>
                <button
                  onClick={handlePaid}
                  disabled={working}
                  className='w-full py-2.5 bg-green-600 text-white font-bold text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2'
                >
                  {working ? (
                    <Loader2 size={14} className='animate-spin' />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Já paguei — atualizar saldo
                </button>
                <button
                  onClick={handleAdd}
                  disabled={working}
                  className='w-full py-2 text-xs text-gray-500 hover:text-[#FF6600]'
                >
                  Gerar novo QR Code
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
