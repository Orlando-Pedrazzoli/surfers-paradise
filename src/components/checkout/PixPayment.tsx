// 📄 src/components/checkout/PixPayment.tsx
'use client';

import { useEffect, useState } from 'react';
import { Copy, Check, Loader2, QrCode } from 'lucide-react';

interface PixPaymentProps {
  qrCode: string; // copia-e-cola
  qrCodeUrl: string; // imagem
  expiresAt?: string;
  orderNumber: string;
  onPaid?: () => void;
}

export default function PixPayment({
  qrCode,
  qrCodeUrl,
  expiresAt,
  orderNumber,
  onPaid,
}: PixPaymentProps) {
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [paid, setPaid] = useState(false);

  // contagem regressiva
  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();
    const tick = () =>
      setRemaining(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  // polling de confirmação
  useEffect(() => {
    if (paid) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payments/status?orderNumber=${orderNumber}`,
        );
        const data = await res.json();
        if (data.paymentStatus === 'paid') {
          setPaid(true);
          clearInterval(id);
          onPaid?.();
        }
      } catch {
        /* silencioso */
      }
    }, 5000);
    return () => clearInterval(id);
  }, [orderNumber, paid, onPaid]);

  const copy = async () => {
    await navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mmss =
    remaining != null
      ? `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`
      : null;

  if (paid) {
    return (
      <div className='rounded-lg bg-green-50 p-6 text-center'>
        <Check className='mx-auto mb-2 h-10 w-10 text-green-600' />
        <p className='font-semibold text-green-700'>Pagamento confirmado!</p>
      </div>
    );
  }

  return (
    <div className='space-y-4 text-center'>
      <div className='flex items-center justify-center gap-2 font-semibold'>
        <QrCode className='h-5 w-5' /> Pague com PIX
      </div>

      {qrCodeUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrCodeUrl}
          alt='QR Code PIX'
          className='mx-auto h-56 w-56 rounded-lg border'
        />
      )}

      <div>
        <p className='mb-1 text-sm text-gray-500'>Ou copie o código:</p>
        <div className='flex items-center gap-2'>
          <input
            readOnly
            value={qrCode}
            className='w-full truncate rounded-lg border border-gray-300 px-3 py-2 text-xs'
          />
          <button
            onClick={copy}
            className='flex shrink-0 items-center gap-1 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white'
          >
            {copied ? (
              <Check className='h-4 w-4' />
            ) : (
              <Copy className='h-4 w-4' />
            )}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      {mmss && (
        <p className='text-sm text-gray-500'>
          Expira em <span className='font-semibold'>{mmss}</span>
        </p>
      )}

      <p className='flex items-center justify-center gap-1 text-xs text-gray-400'>
        <Loader2 className='h-3 w-3 animate-spin' /> Aguardando confirmação
        automática...
      </p>
    </div>
  );
}
