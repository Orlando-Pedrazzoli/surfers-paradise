// 📄 src/components/checkout/CreditCardForm.tsx
// v4 (revisão de aprovação de cartão):
// - BANDEIRA RESOLVIDA PELO MP: ao digitar 6 dígitos consultamos
//   GET /v1/payment_methods/search?bins= com a Public Key. Devolve o
//   payment_method.id REAL (visa/master/elo/debvisa/debmaster…) e o tipo
//   (credit_card/debit_card). A regex local vira apenas fallback — antes um
//   BIN de débito ou Elo fora da lista ia como "visa/credit_card" e o MP
//   recusava ("other_reason" / "bad_filled").
// - DÉBITO suportado: aviso + parcela única. Cartão multifunção (BIN com
//   crédito E débito) ganha seletor para o cliente escolher a função.
// - CPF DO TITULAR: campo próprio (pré-preenchido com o do comprador, mas
//   editável). Antes o CPF do comprador ia como CPF do titular — quem paga
//   com o cartão de outra pessoa era recusado por dado divergente.
// - DEVICE ID: antes de tokenizar esperamos até ~2,5s o security.js definir
//   window.MP_DEVICE_SESSION_ID. Sem isso quem pagava rápido mandava
//   deviceId undefined e perdia pontos no antifraude.
// - COOLDOWN pós-recusa: tentativas imediatas com os mesmos dados são o
//   gatilho documentado de "high_risk"/"duplicated_payment". Após uma
//   recusa o botão fica bloqueado por alguns segundos e o texto orienta a
//   trocar o cartão / usar PIX.
// - Últimos 4 dígitos (devolvidos pela tokenização) sobem para diagnóstico.
// v3: device fingerprint via security.js (mantido; agora também no layout).
// v2: tokenização via POST /v1/card_tokens com a Public Key.
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CreditCard, Lock, Loader2, Info } from 'lucide-react';
import { company } from '@/lib/config/company';
import { isValidCPF } from '@/lib/utils/validators';

export type CardType = 'credit_card' | 'debit_card';

export interface CardTokenData {
  cardToken: string;
  paymentMethodId: string; // id do MP (visa, master, elo, debvisa…)
  cardType: CardType;
  cardBrand: string; // nome de exibição (Visa, Mastercard, Elo…)
  cardLast4?: string;
  installments: number;
  holderName: string;
  deviceId?: string; // window.MP_DEVICE_SESSION_ID (security.js do MP)
}

export interface CardFailure {
  message: string; // texto para o cliente
  retryable: boolean; // vale a pena tentar com o MESMO cartão?
  at: number; // Date.now() da recusa
}

interface CreditCardFormProps {
  amount: number; // total em REAIS (para calcular as parcelas)
  holderDocument?: string; // CPF do comprador (pré-preenche o do titular)
  loading?: boolean; // estado externo (envio para a rota de pagamento)
  /** Última recusa devolvida pelo backend — ativa o cooldown e a dica. */
  failure?: CardFailure | null;
  onToken: (data: CardTokenData) => void | Promise<void>;
}

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
const MP_API = 'https://api.mercadopago.com';
const MP_SECURITY_SRC = 'https://www.mercadopago.com/v2/security.js';

/** Quanto esperar pelo device ID antes de seguir sem ele. */
const DEVICE_ID_WAIT_MS = 2500;
/** Bloqueio após recusa (segundos). */
const RETRY_COOLDOWN_S = 12;

declare global {
  interface Window {
    MP_DEVICE_SESSION_ID?: string;
  }
}

/** Injeta o script de device fingerprint do MP uma única vez (fallback —
 *  o layout do checkout já o carrega com next/script). */
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

/** Espera o security.js definir o device ID (até maxMs). */
function waitForDeviceId(maxMs: number): Promise<string | undefined> {
  return new Promise(resolve => {
    const started = Date.now();
    const tick = () => {
      const id = window.MP_DEVICE_SESSION_ID;
      if (id) return resolve(id);
      if (Date.now() - started >= maxMs) return resolve(undefined);
      setTimeout(tick, 100);
    };
    tick();
  });
}

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const onlyDigits = (s: string) => s.replace(/\D/g, '');

const maskCpf = (v: string) =>
  onlyDigits(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

/** Nome de exibição por id do MP. */
const MP_ID_TO_BRAND: Record<string, string> = {
  visa: 'Visa',
  master: 'Mastercard',
  amex: 'Amex',
  elo: 'Elo',
  hipercard: 'Hipercard',
  diners: 'Diners',
  debvisa: 'Visa Débito',
  debmaster: 'Mastercard Débito',
  debelo: 'Elo Débito',
  maestro: 'Maestro',
  cabal: 'Cabal',
  debcabal: 'Cabal Débito',
};

/** Fallback local (quando a consulta ao MP falha): bandeira → id de CRÉDITO. */
function detectBrandLocally(num: string): { id: string; brand: string } | null {
  const n = onlyDigits(num);
  // Ordem importa: os BINs da Elo colidem com faixas Visa (4xxx) e
  // Mastercard (50xx) — Elo e Hipercard são testados PRIMEIRO.
  if (
    /^(401178|401179|431274|438935|451416|457393|457631|457632|504175|506699|5067|509|627780|636297|636368|650|6516|6550)/.test(
      n,
    )
  )
    return { id: 'elo', brand: 'Elo' };
  if (/^(606282|3841)/.test(n)) return { id: 'hipercard', brand: 'Hipercard' };
  if (/^3[47]/.test(n)) return { id: 'amex', brand: 'Amex' };
  if (/^4/.test(n)) return { id: 'visa', brand: 'Visa' };
  if (/^(5[0-5]|2[2-7])/.test(n)) return { id: 'master', brand: 'Mastercard' };
  return null;
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

interface MpMethodOption {
  id: string;
  type: CardType;
  brand: string;
  cvvLength: number;
}

/** Subconjunto da resposta de GET /v1/payment_methods/search que usamos. */
interface MpSearchResult {
  id?: string;
  name?: string;
  payment_type_id?: string;
  settings?: Array<{
    bin?: { pattern?: string; exclusion_pattern?: string };
    security_code?: { length?: number };
  }>;
}

/** Consulta os meios de pagamento do MP pelo BIN (6 primeiros dígitos). */
async function lookupBin(bin: string): Promise<MpMethodOption[]> {
  if (!PUBLIC_KEY) return [];
  const url =
    `${MP_API}/v1/payment_methods/search?public_key=${encodeURIComponent(PUBLIC_KEY)}` +
    `&bins=${bin}&marketplace=NONE&status=active&site_id=MLB`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`bin lookup ${res.status}`);
  const data = await res.json();
  const results: MpSearchResult[] = data?.results || [];
  const opts: MpMethodOption[] = [];
  for (const r of results) {
    const type = r?.payment_type_id;
    if (type !== 'credit_card' && type !== 'debit_card') continue;
    // Respeita exclusion_pattern quando presente (BINs que o MP tira da faixa)
    const settings = r?.settings?.[0];
    const excl = settings?.bin?.exclusion_pattern;
    if (excl) {
      try {
        if (new RegExp(excl).test(bin)) continue;
      } catch {
        /* padrão inválido → ignora */
      }
    }
    opts.push({
      id: String(r.id),
      type,
      brand: MP_ID_TO_BRAND[String(r.id)] || String(r.name || r.id),
      cvvLength: Number(settings?.security_code?.length || 3),
    });
  }
  return opts;
}

export default function CreditCardForm({
  amount,
  holderDocument,
  loading = false,
  failure = null,
  onToken,
}: CreditCardFormProps) {
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [holderCpf, setHolderCpf] = useState(maskCpf(holderDocument || ''));
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');
  const [installments, setInstallments] = useState(1);
  const [tokenizing, setTokenizing] = useState(false);
  const [error, setError] = useState('');

  // Resolução de bandeira/tipo via MP
  const [binOptions, setBinOptions] = useState<MpMethodOption[]>([]);
  const [binLookupFailed, setBinLookupFailed] = useState(false);
  const [chosenType, setChosenType] = useState<CardType>('credit_card');
  const lastBinRef = useRef('');

  // Cooldown pós-recusa
  const [now, setNow] = useState(() => Date.now());

  useMpDeviceId();

  // Mantém o CPF do titular sincronizado se o comprador mudar o seu antes
  // de mexer no campo.
  const holderTouched = useRef(false);
  useEffect(() => {
    if (!holderTouched.current) setHolderCpf(maskCpf(holderDocument || ''));
  }, [holderDocument]);

  // Tick de 1s enquanto houver cooldown ativo
  useEffect(() => {
    if (!failure) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [failure]);

  const cooldownLeft = failure
    ? Math.max(0, RETRY_COOLDOWN_S - Math.floor((now - failure.at) / 1000))
    : 0;

  // BIN lookup ao atingir 6 dígitos (e refaz se o BIN mudar)
  useEffect(() => {
    const digits = onlyDigits(number);
    const bin = digits.slice(0, 6);
    if (bin.length < 6) {
      lastBinRef.current = '';
      setBinOptions([]);
      setBinLookupFailed(false);
      return;
    }
    if (bin === lastBinRef.current) return;
    lastBinRef.current = bin;
    let cancelled = false;
    lookupBin(bin)
      .then(opts => {
        if (cancelled) return;
        setBinOptions(opts);
        setBinLookupFailed(false);
        // Preferência: crédito quando existir; só débito → débito
        const hasCredit = opts.some(o => o.type === 'credit_card');
        const hasDebit = opts.some(o => o.type === 'debit_card');
        setChosenType(hasCredit ? 'credit_card' : hasDebit ? 'debit_card' : 'credit_card');
      })
      .catch(() => {
        if (cancelled) return;
        setBinOptions([]);
        setBinLookupFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [number]);

  /** Meio de pagamento efetivo (MP → fallback local). */
  const resolved = useMemo<MpMethodOption | null>(() => {
    const fromMp =
      binOptions.find(o => o.type === chosenType) || binOptions[0] || null;
    if (fromMp) return fromMp;
    const local = detectBrandLocally(number);
    if (!local) return null;
    return { id: local.id, type: 'credit_card', brand: local.brand, cvvLength: local.id === 'amex' ? 4 : 3 };
  }, [binOptions, chosenType, number]);

  const isDebit = resolved?.type === 'debit_card';
  const multiFunction =
    binOptions.some(o => o.type === 'credit_card') &&
    binOptions.some(o => o.type === 'debit_card');

  const installmentOptions = useMemo(() => {
    const { maxInstallments, minInstallmentValue } = company.payment;
    const opts: { n: number; per: number }[] = [];
    const max = isDebit ? 1 : maxInstallments;
    for (let n = 1; n <= max; n++) {
      const per = amount / n;
      if (n > 1 && per < minInstallmentValue) break;
      opts.push({ n, per });
    }
    return opts;
  }, [amount, isDebit]);

  useEffect(() => {
    if (isDebit && installments !== 1) setInstallments(1);
  }, [isDebit, installments]);

  const handleNumber = (v: string) => {
    const digits = onlyDigits(v).slice(0, 19);
    setNumber(digits.replace(/(.{4})/g, '$1 ').trim());
  };

  const handleValidade = (v: string) => {
    const d = onlyDigits(v).slice(0, 4);
    setValidade(d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
  };

  async function tokenizeCard(): Promise<{ id: string; last4?: string }> {
    if (!PUBLIC_KEY)
      throw new Error('Chave pública do Mercado Pago não configurada.');

    const [mmRaw, yyRaw] = validade.split('/');
    const expMonth = parseInt(mmRaw || '', 10);
    let expYear = parseInt(yyRaw || '', 10);
    if (expYear < 100) expYear += 2000;

    const cpf = onlyDigits(holderCpf);

    const res = await fetch(
      `${MP_API}/v1/card_tokens?public_key=${encodeURIComponent(PUBLIC_KEY)}`,
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
            identification: cpf
              ? { type: cpf.length > 11 ? 'CNPJ' : 'CPF', number: cpf }
              : undefined,
          },
        }),
      },
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.id) {
      // Mensagens do MP para erro de tokenização são em inglês — traduzimos
      // as mais comuns.
      const raw = String(data?.message || data?.cause?.[0]?.description || '');
      if (/security_code|cvv/i.test(raw))
        throw new Error('Código de segurança (CVV) inválido.');
      if (/expiration/i.test(raw))
        throw new Error('Data de validade inválida.');
      if (/card_number|invalid card/i.test(raw))
        throw new Error('Número de cartão inválido.');
      if (/identification/i.test(raw))
        throw new Error('CPF do titular inválido.');
      throw new Error('Não foi possível validar o cartão. Confira os dados.');
    }
    return { id: data.id as string, last4: data.last_four_digits };
  }

  function validate(): string | null {
    if (!luhnValid(number)) return 'Número de cartão inválido.';
    if (!resolved)
      return 'Bandeira não reconhecida. Use Visa, Mastercard, Amex, Elo ou Hipercard.';
    if (name.trim().length < 3) return 'Informe o nome como está no cartão.';
    if (!isValidCPF(holderCpf)) return 'CPF do titular inválido.';
    const [mm, yy] = validade.split('/');
    const month = parseInt(mm || '', 10);
    let year = parseInt(yy || '', 10);
    if (year < 100) year += 2000;
    if (!month || month < 1 || month > 12) return 'Mês de validade inválido.';
    const nowDate = new Date();
    const exp = new Date(year, month, 0, 23, 59, 59);
    if (exp < nowDate) return 'Cartão vencido.';
    const cvvLen = resolved.cvvLength || 3;
    if (cvv.trim().length !== cvvLen)
      return `CVV deve ter ${cvvLen} dígitos para ${resolved.brand}.`;
    return null;
  }

  async function handlePay() {
    setError('');
    if (cooldownLeft > 0) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setTokenizing(true);
      // Device ID primeiro: se o security.js ainda não respondeu, damos até
      // ~2,5s — sem ele a taxa de aprovação do MP cai bastante.
      const deviceId = await waitForDeviceId(DEVICE_ID_WAIT_MS);
      const { id: cardToken, last4 } = await tokenizeCard();
      await onToken({
        cardToken,
        paymentMethodId: resolved!.id,
        cardType: resolved!.type,
        cardBrand: resolved!.brand,
        cardLast4: last4,
        installments: isDebit ? 1 : installments,
        holderName: name.trim(),
        deviceId,
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
  const blocked = busy || cooldownLeft > 0;

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <CreditCard className='h-5 w-5' />
        <h3 className='font-semibold'>Cartão</h3>
        {resolved && (
          <span className='ml-auto rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600'>
            {resolved.brand}
          </span>
        )}
      </div>

      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Número do cartão
        </label>
        <input
          inputMode='numeric'
          autoComplete='cc-number'
          value={number}
          onChange={e => handleNumber(e.target.value)}
          placeholder='0000 0000 0000 0000'
          className='w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900'
        />
        {binLookupFailed && onlyDigits(number).length >= 6 && (
          <p className='mt-1 text-xs text-gray-400'>
            Não foi possível confirmar a bandeira com o Mercado Pago — usando
            detecção local.
          </p>
        )}
      </div>

      {multiFunction && (
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Função do cartão
          </label>
          <div className='grid grid-cols-2 gap-2'>
            {(['credit_card', 'debit_card'] as CardType[]).map(t => (
              <button
                key={t}
                type='button'
                onClick={() => setChosenType(t)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  chosenType === t
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                {t === 'credit_card' ? 'Crédito' : 'Débito'}
              </button>
            ))}
          </div>
        </div>
      )}

      {isDebit && (
        <p className='flex items-start gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700'>
          <Info className='mt-0.5 h-3.5 w-3.5 shrink-0' />
          Cartão de débito: pagamento à vista. Alguns bancos exigem liberar
          compras online no app antes de usar o débito.
        </p>
      )}

      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Nome impresso no cartão
        </label>
        <input
          autoComplete='cc-name'
          value={name}
          onChange={e => setName(e.target.value.toUpperCase())}
          placeholder='COMO ESTÁ NO CARTÃO'
          className='w-full rounded-lg border border-gray-300 px-3 py-2 uppercase outline-none focus:border-gray-900'
        />
      </div>

      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          CPF do titular do cartão
        </label>
        <input
          inputMode='numeric'
          value={holderCpf}
          onChange={e => {
            holderTouched.current = true;
            setHolderCpf(maskCpf(e.target.value));
          }}
          placeholder='000.000.000-00'
          className='w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900'
        />
        <p className='mt-1 text-xs text-gray-400'>
          Se o cartão for de outra pessoa, informe o CPF dela.
        </p>
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Validade
          </label>
          <input
            inputMode='numeric'
            autoComplete='cc-exp'
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
            autoComplete='cc-csc'
            value={cvv}
            onChange={e => setCvv(onlyDigits(e.target.value).slice(0, 4))}
            placeholder={resolved?.cvvLength === 4 ? '0000' : '000'}
            className='w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900'
          />
        </div>
      </div>

      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Parcelamento
        </label>
        <select
          value={isDebit ? 1 : installments}
          disabled={isDebit}
          onChange={e => setInstallments(Number(e.target.value))}
          className='w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500'
        >
          {installmentOptions.map(({ n, per }) => (
            <option key={n} value={n}>
              {n}x de {brl(per)}
              {n > 1 ? ' sem juros' : isDebit ? ' (débito à vista)' : ' à vista'}
            </option>
          ))}
        </select>
      </div>

      {(error || failure) && (
        <div className='space-y-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600'>
          {error && <p>{error}</p>}
          {!error && failure && <p>{failure.message}</p>}
          {failure && (
            <p className='text-xs text-red-500'>
              {failure.retryable
                ? 'Revise os dados antes de tentar de novo.'
                : 'Recomendamos usar outro cartão ou pagar com PIX (com desconto).'}
              {cooldownLeft > 0 && ` Nova tentativa em ${cooldownLeft}s.`}
            </p>
          )}
        </div>
      )}

      <button
        type='button'
        onClick={handlePay}
        disabled={blocked}
        className='flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60'
      >
        {busy ? (
          <>
            <Loader2 className='h-4 w-4 animate-spin' /> Processando...
          </>
        ) : cooldownLeft > 0 ? (
          <>
            <Lock className='h-4 w-4' /> Aguarde {cooldownLeft}s
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
