// 📄 src/components/checkout/CreditCardForm.tsx
// v2 (Mercado Pago): tokenização via POST /v1/card_tokens com a Public Key;
// a bandeira detectada localmente vira o paymentMethodId exigido pela API
// de Orders (visa | master | amex | elo | hipercard).
// v3: DEVICE FINGERPRINT — carrega o security.js oficial do MP, que define
// window.MP_DEVICE_SESSION_ID; o valor sobe com o token (deviceId) e o
// backend repassa no header X-meli-session-id. Recomendação oficial para
// aumentar a taxa de aprovação de cartão em produção.
'use client';

import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Lock, Loader2 } from 'lucide-react';
import { company } from '@/lib/config/company';

interface CreditCardFormProps {
  amount: number; // total em REAIS (para calcular as parcelas)
  holderDocument?: string; // CPF do titular (opcional, ajuda na autorização)
  loading?: boolean; // estado externo (envio para a rota de pagamento)
  onToken: (data: {
    cardToken: string;
    paymentMethodId: string;
    installments: number;
    holderName: string;
    deviceId?: string; // window.MP_DEVICE_SESSION_ID (security.js do MP)
  }) => void | Promise<void>;
}

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

const MP_SECURITY_SRC = 'https://www.mercadopago.com/v2/security.js';

declare global {
  interface Window {
    MP_DEVICE_SESSION_ID?: string;
  }
}

/** Injeta o script de device fingerprint do MP uma única vez. */
function useMpDeviceId() {
  useEffect(() => {
    if (document.querySelector(`script[src="${MP_SECURITY_SRC}"]`)) return;
    const script = document.createElement('script');
    script.src = MP_SECURITY_SRC;
    script.setAttribute('view', 'checkout');
    script.async = true;
    document.head.appendChild(script);
  }, []);
}

/** Bandeira exibida na UI → payment_method.id da API de Orders do MP. */
const BRAND_TO_MP_ID: Record<string, string> = {
  Visa: 'visa',
  Mastercard: 'master',
  Amex: 'amex',
  Elo: 'elo',
  Hipercard: 'hipercard',
};

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const onlyDigits = (s: string) => s.replace(/\D/g, '');

function detectBrand(num: string): string {
  const n = onlyDigits(num);
  // Ordem importa: os BINs da Elo colidem com faixas Visa (4xxx) e
  // Mastercard (50xx) — Elo e Hipercard são testados PRIMEIRO.
  if (
    /^(401178|401179|431274|438935|451416|457393|457631|457632|504175|506699|5067|509|627780|636297|636368|650|6516|6550)/.test(
      n,
    )
  )
    return 'Elo';
  if (/^(606282|3841)/.test(n)) return 'Hipercard';
  if (/^3[47]/.test(n)) return 'Amex';
  if (/^4/.test(n)) return 'Visa';
  // Mastercard: 51–55, 22–27 e a faixa 50 usada por cartões de teste do MP
  // (ex.: 5031 43...) que não pertence aos BINs Elo já capturados acima.
  if (/^(5[0-5]|2[2-7])/.test(n)) return 'Mastercard';
  return '';
}

function luhnValid(num: string): boolean {
  const n = onlyDigits(num);
  if (n.length < 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = parseInt(n[i], 10);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export default function CreditCardForm({
  amount,
  holderDocument,
  loading = false,
  onToken,
}: CreditCardFormProps) {
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');
  const [installments, setInstallments] = useState(1);
  const [tokenizing, setTokenizing] = useState(false);
  const [error, setError] = useState('');

  useMpDeviceId();

  const brand = useMemo(() => detectBrand(number), [number]);

  const installmentOptions = useMemo(() => {
    const { maxInstallments, minInstallmentValue } = company.payment;
    const opts: { n: number; per: number }[] = [];
    for (let n = 1; n <= maxInstallments; n++) {
      const per = amount / n;
      if (n > 1 && per < minInstallmentValue) break;
      opts.push({ n, per });
    }
    return opts;
  }, [amount]);

  const handleNumber = (v: string) => {
    const digits = onlyDigits(v).slice(0, 16);
    setNumber(digits.replace(/(.{4})/g, '$1 ').trim());
  };

  const handleValidade = (v: string) => {
    const d = onlyDigits(v).slice(0, 4);
    setValidade(d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
  };

  async function tokenizeCard(): Promise<string> {
    if (!PUBLIC_KEY)
      throw new Error('Chave pública do Mercado Pago não configurada.');

    const [mmRaw, yyRaw] = validade.split('/');
    const expMonth = parseInt(mmRaw || '', 10);
    let expYear = parseInt(yyRaw || '', 10);
    if (expYear < 100) expYear += 2000;

    const res = await fetch(
      `https://api.mercadopago.com/v1/card_tokens?public_key=${PUBLIC_KEY}`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          card_number: onlyDigits(number),
          expiration_month: expMonth,
          expiration_year: expYear,
          security_code: cvv.trim(),
          cardholder: {
            name: name.trim(),
            identification: holderDocument
              ? {
                  type: onlyDigits(holderDocument).length > 11 ? 'CNPJ' : 'CPF',
                  number: onlyDigits(holderDocument),
                }
              : undefined,
          },
        }),
      },
    );

    const data = await res.json();
    if (!res.ok || !data?.id) {
      throw new Error(data?.message || 'Não foi possível validar o cartão.');
    }
    return data.id as string;
  }

  function validate(): string | null {
    if (!luhnValid(number)) return 'Número de cartão inválido.';
    if (!BRAND_TO_MP_ID[brand])
      return 'Bandeira não suportada. Use Visa, Mastercard, Amex, Elo ou Hipercard.';
    if (name.trim().length < 3) return 'Informe o nome como está no cartão.';
    const [mm, yy] = validade.split('/');
    const month = parseInt(mm || '', 10);
    let year = parseInt(yy || '', 10);
    if (year < 100) year += 2000;
    if (!month || month < 1 || month > 12) return 'Mês de validade inválido.';
    const now = new Date();
    const exp = new Date(year, month, 0, 23, 59, 59);
    if (exp < now) return 'Cartão vencido.';
    if (cvv.trim().length < 3) return 'CVV inválido.';
    return null;
  }

  async function handlePay() {
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setTokenizing(true);
      const cardToken = await tokenizeCard();
      await onToken({
        cardToken,
        paymentMethodId: BRAND_TO_MP_ID[brand],
        installments,
        holderName: name.trim(),
        deviceId: window.MP_DEVICE_SESSION_ID, // best-effort (pode ser undefined)
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao processar o cartão.',
      );
    } finally {
      setTokenizing(false);
    }
  }

  const busy = tokenizing || loading;

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <CreditCard className='h-5 w-5' />
        <h3 className='font-semibold'>Cartão de crédito</h3>
        {brand && (
          <span className='ml-auto rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600'>
            {brand}
          </span>
        )}
      </div>

      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Número do cartão
        </label>
        <input
          inputMode='numeric'
          value={number}
          onChange={e => handleNumber(e.target.value)}
          placeholder='0000 0000 0000 0000'
          className='w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900'
        />
      </div>

      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Nome impresso no cartão
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value.toUpperCase())}
          placeholder='COMO ESTÁ NO CARTÃO'
          className='w-full rounded-lg border border-gray-300 px-3 py-2 uppercase outline-none focus:border-gray-900'
        />
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Validade
          </label>
          <input
            inputMode='numeric'
            value={validade}
            onChange={e => handleValidade(e.target.value)}
            placeholder='MM/AA'
            className='w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900'
          />
        </div>
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            CVV
          </label>
          <input
            inputMode='numeric'
            value={cvv}
            onChange={e => setCvv(onlyDigits(e.target.value).slice(0, 4))}
            placeholder='000'
            className='w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900'
          />
        </div>
      </div>

      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Parcelamento
        </label>
        <select
          value={installments}
          onChange={e => setInstallments(Number(e.target.value))}
          className='w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900'
        >
          {installmentOptions.map(({ n, per }) => (
            <option key={n} value={n}>
              {n}x de {brl(per)} sem juros
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className='rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600'>
          {error}
        </p>
      )}

      <button
        type='button'
        onClick={handlePay}
        disabled={busy}
        className='flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60'
      >
        {busy ? (
          <>
            <Loader2 className='h-4 w-4 animate-spin' /> Processando...
          </>
        ) : (
          <>
            <Lock className='h-4 w-4' /> Pagar {brl(amount)}
          </>
        )}
      </button>

      <p className='flex items-center justify-center gap-1 text-xs text-gray-400'>
        <Lock className='h-3 w-3' /> Dados protegidos. O cartão é tokenizado
        pelo Mercado Pago e nunca passa pelo nosso servidor.
      </p>
    </div>
  );
}
