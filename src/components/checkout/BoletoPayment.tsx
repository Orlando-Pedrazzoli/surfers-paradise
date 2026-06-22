// 📄 src/components/checkout/BoletoPayment.tsx
'use client';

import { useState } from 'react';
import { Copy, Check, FileText, ExternalLink } from 'lucide-react';

interface BoletoPaymentProps {
  url: string;
  line: string; // linha digitável
  barcode: string;
  dueAt?: string;
  orderNumber: string;
}

export default function BoletoPayment({
  url,
  line,
  dueAt,
  orderNumber,
}: BoletoPaymentProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(line);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const due = dueAt ? new Date(dueAt).toLocaleDateString('pt-BR') : null;

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-center gap-2 font-semibold'>
        <FileText className='h-5 w-5' /> Boleto bancário
      </div>

      <p className='text-center text-sm text-gray-500'>
        Pedido <span className='font-semibold'>{orderNumber}</span>
        {due && (
          <>
            {' '}
            · vence em <span className='font-semibold'>{due}</span>
          </>
        )}
      </p>

      <div>
        <p className='mb-1 text-sm text-gray-500'>Linha digitável:</p>
        <div className='flex items-center gap-2'>
          <input
            readOnly
            value={line}
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

      <a
        href={url}
        target='_blank'
        rel='noopener noreferrer'
        className='flex w-full items-center justify-center gap-2 rounded-lg border border-gray-900 px-4 py-3 font-semibold transition hover:bg-gray-900 hover:text-white'
      >
        <ExternalLink className='h-4 w-4' /> Abrir / imprimir boleto
      </a>

      <p className='text-center text-xs text-gray-400'>
        A compensação pode levar até 2 dias úteis. Você receberá um e-mail
        quando for confirmado.
      </p>
    </div>
  );
}
