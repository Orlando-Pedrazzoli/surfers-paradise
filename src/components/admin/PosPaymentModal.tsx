'use client';

import { useState, useEffect } from 'react';
import { X, Banknote, CreditCard, QrCode, Loader2 } from 'lucide-react';

type PaymentMethod = 'cash' | 'pix' | 'debit_card' | 'credit_card';

interface PosPaymentModalProps {
  total: number;
  subtotal?: number; // opcional — se houver desconto, mostra o detalhamento
  discount?: number; // desconto total aplicado (linhas + carrinho)
  saving: boolean;
  onClose: () => void;
  onConfirm: (data: {
    method: PaymentMethod;
    cashReceived?: number;
    installments?: number;
    customerName?: string;
    customerCpf?: string;
  }) => void;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function PosPaymentModal({
  total,
  subtotal,
  discount = 0,
  saving,
  onClose,
  onConfirm,
}: PosPaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [installments, setInstallments] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');

  const cashReceivedNum = parseFloat(cashReceived.replace(',', '.')) || 0;
  const cashChange = method === 'cash' ? cashReceivedNum - total : 0;
  const canConfirm =
    method !== 'cash' || (cashReceivedNum >= total && cashReceivedNum > 0);

  const hasDiscount = discount > 0 && subtotal !== undefined;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfirm || saving) return;
    onConfirm({
      method,
      cashReceived: method === 'cash' ? cashReceivedNum : undefined,
      installments: method === 'credit_card' ? installments : undefined,
      customerName: customerName.trim() || undefined,
      customerCpf: customerCpf.trim() || undefined,
    });
  };

  const cashSuggestions = [
    total,
    Math.ceil(total / 50) * 50,
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 200) * 200,
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between p-4 border-b'>
          <div>
            <h2 className='text-lg font-bold'>Finalizar Venda</h2>
            <p className='text-sm text-gray-500'>
              Total a pagar:{' '}
              <span className='font-bold text-[#FF6600] text-xl'>
                {formatPrice(total)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600'
            disabled={saving}
          >
            <X size={24} />
          </button>
        </div>

        {/* Detalhamento quando há desconto */}
        {hasDiscount && (
          <div className='px-4 pt-3'>
            <div className='bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm space-y-1'>
              <div className='flex justify-between text-gray-600'>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal!)}</span>
              </div>
              <div className='flex justify-between text-green-700 font-medium'>
                <span>Desconto</span>
                <span>-{formatPrice(discount)}</span>
              </div>
              <div className='flex justify-between font-bold text-gray-900 pt-1 border-t border-orange-200'>
                <span>Total</span>
                <span className='text-[#FF6600]'>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className='p-4 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Forma de Pagamento
            </label>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
              <PaymentOption
                icon={<Banknote size={20} />}
                label='Dinheiro'
                active={method === 'cash'}
                onClick={() => setMethod('cash')}
              />
              <PaymentOption
                icon={<QrCode size={20} />}
                label='PIX'
                active={method === 'pix'}
                onClick={() => setMethod('pix')}
              />
              <PaymentOption
                icon={<CreditCard size={20} />}
                label='Débito'
                active={method === 'debit_card'}
                onClick={() => setMethod('debit_card')}
              />
              <PaymentOption
                icon={<CreditCard size={20} />}
                label='Crédito'
                active={method === 'credit_card'}
                onClick={() => setMethod('credit_card')}
              />
            </div>
          </div>

          {method === 'cash' && (
            <div className='bg-gray-50 rounded-lg p-3'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Valor Recebido (R$)
              </label>
              <input
                type='text'
                value={cashReceived}
                onChange={e =>
                  setCashReceived(e.target.value.replace(/[^\d,.]/g, ''))
                }
                placeholder='0,00'
                autoFocus
                className='w-full px-3 py-3 text-xl font-bold border-2 border-gray-300 rounded-md focus:outline-none focus:border-[#FF6600] font-mono'
              />
              <div className='flex gap-2 mt-2 flex-wrap'>
                {cashSuggestions.map(value => (
                  <button
                    key={value}
                    type='button'
                    onClick={() =>
                      setCashReceived(value.toFixed(2).replace('.', ','))
                    }
                    className='px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:border-[#FF6600] hover:text-[#FF6600] transition-colors'
                  >
                    {formatPrice(value)}
                  </button>
                ))}
              </div>
              {cashReceivedNum > 0 && (
                <div className='mt-3 pt-3 border-t flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Troco:</span>
                  <span
                    className={`text-2xl font-bold font-mono ${cashChange < 0 ? 'text-red-600' : 'text-green-700'}`}
                  >
                    {formatPrice(cashChange)}
                  </span>
                </div>
              )}
              {cashReceivedNum > 0 && cashReceivedNum < total && (
                <p className='text-xs text-red-600 mt-1'>
                  Valor insuficiente para o total.
                </p>
              )}
            </div>
          )}

          {method === 'credit_card' && (
            <div className='bg-gray-50 rounded-lg p-3'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Parcelas
              </label>
              <select
                value={installments}
                onChange={e => setInstallments(parseInt(e.target.value))}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600]'
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>
                    {n}x de {formatPrice(total / n)}
                    {n === 1 ? ' à vista' : ' sem juros'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {method === 'pix' && (
            <div className='bg-gray-50 rounded-lg p-3 text-sm text-gray-600'>
              <p>O cliente paga pelo terminal/maquininha.</p>
              <p className='mt-1 text-xs'>
                Confirme aqui após o pagamento ser aprovado.
              </p>
            </div>
          )}

          {method === 'debit_card' && (
            <div className='bg-gray-50 rounded-lg p-3 text-sm text-gray-600'>
              <p>Cobre o valor pela maquininha.</p>
              <p className='mt-1 text-xs'>
                Confirme aqui após o pagamento ser aprovado.
              </p>
            </div>
          )}

          <div className='border-t pt-4'>
            <p className='text-xs text-gray-500 mb-2 uppercase tracking-wide'>
              Cliente (opcional)
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <input
                type='text'
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder='Nome do cliente'
                className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600] text-sm'
              />
              <input
                type='text'
                value={customerCpf}
                onChange={e => setCustomerCpf(e.target.value)}
                placeholder='CPF (para nota)'
                className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6600] text-sm font-mono'
              />
            </div>
          </div>

          <div className='flex gap-3 pt-2'>
            <button
              type='button'
              onClick={onClose}
              disabled={saving}
              className='px-4 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={!canConfirm || saving}
              className='flex-1 px-6 py-3 bg-[#FF6600] text-white font-bold rounded-md hover:bg-[#e55b00] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg'
            >
              {saving ? (
                <>
                  <Loader2 size={20} className='animate-spin' />
                  Processando...
                </>
              ) : (
                <>Confirmar Venda — {formatPrice(total)}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentOption({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
        active
          ? 'border-[#FF6600] bg-orange-50 text-[#FF6600]'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
      }`}
    >
      {icon}
      <span className='text-xs font-medium'>{label}</span>
    </button>
  );
}
