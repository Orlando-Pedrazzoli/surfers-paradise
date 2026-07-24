// 📄 src/components/checkout/PaymentForm.tsx
// v4: BOLETO reativado (API de Orders do MP) — aba de volta na UI, com
//     desconto boletoDiscountPercent e tela BoletoPayment após a emissão.
// v4: deviceId (fingerprint do security.js) repassado no payload do cartão.
// v3 (Mercado Pago): cartão envia paymentMethodId (bandeira) junto com o
//     cardToken para /api/payments/card.
// v2: trata o 409 PRICES_CHANGED do backend (preços revalidados no banco) —
//     mostra a mensagem do servidor e notifica onPricesChanged para o
//     carrinho sincronizar os valores novos.
// v2: cartão recusado (402, paymentStatus 'failed') ganha mensagem específica
//     — o cliente entende que é o cartão, não um bug do site.
// v2: orderId propagado ao PixPayment para o polling de status usar o
//     ObjectId (não-enumerável) em vez do orderNumber.
// v2: guarda contra duplo submit no postCheckout.
'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, QrCode, FileText } from 'lucide-react';
import { company } from '@/lib/config/company';
import CreditCardForm from './CreditCardForm';
import PixPayment from './PixPayment';
import BoletoPayment from './BoletoPayment';
import type {
  PaymentCustomer,
  PaymentAddress,
  PaymentItem,
  CheckoutShipping,
  CheckoutResponse,
  PixResult,
  BoletoResult,
} from '@/lib/types/payment';

type Method = 'credit_card' | 'pix' | 'boleto';

export interface UpdatedPrice {
  productId?: string;
  sku?: string;
  price: number;
}

/** Campos extras do backend v4/v5 que podem não estar no CheckoutResponse. */
type CheckoutResponseExt = CheckoutResponse & {
  code?: string;
  updatedPrices?: UpdatedPrice[];
  paymentStatus?: string;
  orderId?: string;
};

interface PaymentFormProps {
  customer: PaymentCustomer;
  shippingAddress: PaymentAddress;
  items: PaymentItem[];
  subtotal: number; // REAIS — soma cheia dos itens
  shippingCost: number;
  shipping?: CheckoutShipping;
  coupon?: string;
  couponDiscount?: number;
  userId?: string;
  onOrderCreated?: (orderNumber: string) => void;
  /** Chamado quando o servidor detecta preços desatualizados no carrinho
   *  (409 PRICES_CHANGED). Use para sincronizar o CartProvider. */
  onPricesChanged?: (updatedPrices: UpdatedPrice[]) => void;
}

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PaymentForm({
  customer,
  shippingAddress,
  items,
  subtotal,
  shippingCost,
  shipping,
  coupon = '',
  couponDiscount = 0,
  userId,
  onOrderCreated,
  onPricesChanged,
}: PaymentFormProps) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>('credit_card');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pix, setPix] = useState<
    (PixResult & { orderNumber: string; orderId?: string }) | null
  >(null);
  const [boleto, setBoleto] = useState<
    (BoletoResult & { orderNumber: string }) | null
  >(null);
  const { pixDiscountPercent, boletoDiscountPercent } = company.payment;
  const base = Math.max(0, subtotal - couponDiscount);

  const totals = useMemo(
    () => ({
      credit_card: base + shippingCost,
      pix: base * (1 - pixDiscountPercent / 100) + shippingCost,
      boleto: base * (1 - boletoDiscountPercent / 100) + shippingCost,
    }),
    [base, shippingCost, pixDiscountPercent, boletoDiscountPercent],
  );

  const basePayload = {
    userId,
    customer,
    shippingAddress,
    items,
    shippingCost,
    shipping,
    coupon,
    couponDiscount,
  };

  async function postCheckout(
    endpoint: string,
    extra: Record<string, unknown> = {},
  ): Promise<CheckoutResponseExt | null> {
    if (submitting) return null; // guarda contra duplo clique
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...basePayload, ...extra }),
      });
      const data: CheckoutResponseExt = await res.json();

      // Carrinho com preços desatualizados: servidor recusa e devolve os
      // valores novos — sincroniza o carrinho e pede reconfirmação.
      if (res.status === 409 && data.code === 'PRICES_CHANGED') {
        if (data.updatedPrices) onPricesChanged?.(data.updatedPrices);
        setError(
          data.error ||
            'Os preços foram atualizados. Revise o carrinho e confirme novamente.',
        );
        return null;
      }

      if (!data.success) {
        // 402 do cartão recusado vem sem campo error — mensagem específica
        // para o cliente entender que é o cartão, não o site.
        if (data.paymentStatus === 'failed') {
          setError(
            'Pagamento não autorizado pelo emissor do cartão. Confira os dados ou tente outro cartão.',
          );
        } else {
          setError(data.error || 'Não foi possível processar o pagamento.');
        }
        return null;
      }
      return data;
    } catch {
      setError('Erro de conexão. Tente novamente.');
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCardToken({
    cardToken,
    paymentMethodId,
    installments,
    deviceId,
  }: {
    cardToken: string;
    paymentMethodId: string;
    installments: number;
    deviceId?: string;
  }) {
    const data = await postCheckout('/api/payments/card', {
      cardToken,
      paymentMethodId,
      installments,
      deviceId,
    });
    if (data?.success && data.orderNumber) {
      onOrderCreated?.(data.orderNumber);
      router.push(`/pedido-confirmado?pedido=${data.orderNumber}`);
    }
  }

  async function handlePix() {
    const data = await postCheckout('/api/payments/pix');
    if (data?.pix && data.orderNumber) {
      setPix({
        ...data.pix,
        orderNumber: data.orderNumber,
        orderId: data.orderId,
      });
    }
  }

  async function handleBoleto() {
    const data = await postCheckout('/api/payments/boleto');
    if (data?.boleto && data.orderNumber) {
      // NÃO limpar o carrinho aqui: clearCart faz o checkout renderizar
      // "carrinho vazio" e desmonta a tela do boleto antes de aparecer.
      // Mesmo comportamento do PIX pendente.
      setBoleto({ ...data.boleto, orderNumber: data.orderNumber });
    }
  }

  if (boleto) {
    return (
      <BoletoPayment
        url={boleto.url}
        line={boleto.line}
        barcode={boleto.barcode}
        dueAt={boleto.dueAt}
        orderNumber={boleto.orderNumber}
      />
    );
  }

  if (pix) {
    return (
      <PixPayment
        {...pix}
        onPaid={() => {
          onOrderCreated?.(pix.orderNumber);
          router.push(`/pedido-confirmado?pedido=${pix.orderNumber}`);
        }}
        onExpired={() => setPix(null)} // volta à seleção para gerar novo PIX
      />
    );
  }
  const tabs: { id: Method; label: string; icon: ReactNode }[] = [
    {
      id: 'credit_card',
      label: 'Cartão',
      icon: <CreditCard className='h-4 w-4' />,
    },
    { id: 'pix', label: 'PIX', icon: <QrCode className='h-4 w-4' /> },
    { id: 'boleto', label: 'Boleto', icon: <FileText className='h-4 w-4' /> },
  ];

  return (
    <div className='space-y-5'>
      <div className='grid grid-cols-3 gap-2'>
        {tabs.map(t => (
          <button
            key={t.id}
            type='button'
            onClick={() => {
              setMethod(t.id);
              setError('');
            }}
            className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-3 text-sm font-medium transition ${
              method === t.id
                ? 'border-[#FF6600] bg-[#FF6600] text-white'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p className='rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600'>
          {error}
        </p>
      )}

      {method === 'credit_card' && (
        <CreditCardForm
          amount={totals.credit_card}
          holderDocument={customer.document}
          loading={submitting}
          onToken={handleCardToken}
        />
      )}

      {method === 'boleto' && (
        <div className='space-y-4 text-center'>
          <p className='text-sm text-gray-600'>
            Valor no boleto:{' '}
            <span className='font-semibold'>{brl(totals.boleto)}</span>{' '}
            <span className='text-green-600'>
              ({boletoDiscountPercent}% de desconto)
            </span>
          </p>
          <p className='text-xs text-gray-500'>
            Vencimento em 3 dias. A compensação pode levar até 2 dias úteis após
            o pagamento.
          </p>
          <button
            type='button'
            onClick={handleBoleto}
            disabled={submitting}
            className='w-full rounded-lg bg-[#FF6600] px-4 py-3 font-semibold text-white transition hover:bg-[#e55b00] disabled:opacity-60'
          >
            {submitting
              ? 'Gerando boleto...'
              : `Gerar boleto de ${brl(totals.boleto)}`}
          </button>
        </div>
      )}

      {method === 'pix' && (
        <div className='space-y-4 text-center'>
          <p className='text-sm text-gray-600'>
            Valor no PIX:{' '}
            <span className='font-semibold'>{brl(totals.pix)}</span>{' '}
            <span className='text-green-600'>
              ({pixDiscountPercent}% de desconto)
            </span>
          </p>
          <button
            type='button'
            onClick={handlePix}
            disabled={submitting}
            className='w-full rounded-lg bg-[#FF6600] px-4 py-3 font-semibold text-white transition hover:bg-[#e55b00] disabled:opacity-60'
          >
            {submitting ? 'Gerando PIX...' : `Gerar PIX de ${brl(totals.pix)}`}
          </button>
        </div>
      )}
    </div>
  );
}
