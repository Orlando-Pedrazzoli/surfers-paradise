// 📄 src/components/checkout/PixPayment.tsx
// v2: estado de EXPIRADO — quando o countdown zera, o polling para, o QR
//     morto some e o cliente vê o botão "Gerar novo PIX" (onExpired volta
//     à seleção de pagamento). Antes ficava "aguardando" para sempre.
// v2: polling por orderId (ObjectId, não-enumerável) quando disponível,
//     com fallback para orderNumber.
'use client';

import { useEffect, useState } from 'react';
import { Copy, Check, Loader2, QrCode, Clock } from 'lucide-react';

interface PixPaymentProps {
  qrCode: string; // copia-e-cola
  qrCodeUrl: string; // imagem
  expiresAt?: string;
  orderNumber: string;
  orderId?: string; // preferido para o polling (não-enumerável)
  onPaid?: () => void;
  onExpired?: () => void; // volta à seleção de método para gerar novo PIX
}

export default function PixPayment({
  qrCode,
  qrCodeUrl,
  expiresAt,
  orderNumber,
  orderId,
  onPaid,
  onExpired,
}: PixPaymentProps) {
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [paid, setPaid] = useState(false);

  const expired = remaining !== null && remaining <= 0 && !paid;

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

  // polling de confirmação (para quando paga OU quando expira)
  useEffect(() => {
    if (paid || expired) return;
    const query = orderId ? `orderId=${orderId}` : `orderNumber=${orderNumber}`;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status?${query}`);
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
  }, [orderId, orderNumber, paid, expired, onPaid]);

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

  if (expired) {
    return (
      <div className='space-y-4 rounded-lg bg-amber-50 p-6 text-center'>
        <Clock className='mx-auto h-10 w-10 text-amber-500' />
        <div>
          <p className='font-semibold text-amber-700'>Este PIX expirou</p>
          <p className='mt-1 text-sm text-amber-600'>
            Não se preocupe — nada foi cobrado. Gere um novo código para
            concluir a compra.
          </p>
        </div>
        <button
          type='button'
          onClick={onExpired}
          className='w-full rounded-lg bg-[#FF6600] px-4 py-3 font-semibold text-white transition hover:bg-[#e55b00]'
        >
          Gerar novo PIX
        </button>
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
