// 📄 src/lib/services/pagarme.ts
// Cliente Pagar.me API V5 — Surfers Paradise
// Auth: HTTP Basic (User = Secret Key, Password = vazio). Endpoint único teste/produção;
// o ambiente é definido pelo prefixo da chave (sk_test_ = sandbox, sk_ = produção).
//
// v4: pagarmeRequest com parse seguro (resposta não-JSON vira PagarmeError 502,
//     não exceção genérica).
// v4: validateWebhookAuth FAIL-CLOSED em produção — sem PAGARME_WEBHOOK_USER/PASS
//     configurados, webhook é rejeitado (em dev continua liberado para testes locais).

import crypto from 'crypto';

const PAGARME_API_URL = 'https://api.pagar.me/core/v5';

// ───────────────────────── Tipos de entrada ─────────────────────────

export interface PagarmeCustomerInput {
  name: string;
  email: string;
  document: string; // CPF/CNPJ (com ou sem máscara)
  type?: 'individual' | 'company';
  phone?: string; // ex: "+5511999998888" ou "11999998888"
}

export interface PagarmeAddressInput {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string; // UF, ex: "SP"
  country?: string; // default "BR"
}

export interface PagarmeItemInput {
  name: string;
  quantity: number;
  amount: number; // em CENTAVOS
  code?: string; // SKU
}

export type PagarmePaymentInput =
  | {
      method: 'credit_card';
      cardToken: string;
      installments: number;
      statementDescriptor?: string;
    }
  | { method: 'pix'; expiresIn?: number } // segundos (default 3600)
  | { method: 'boleto'; dueInDays?: number; instructions?: string };

export interface CreateOrderInput {
  code?: string; // seu ID interno do pedido (rastreabilidade/idempotência)
  customer: PagarmeCustomerInput;
  billingAddress: PagarmeAddressInput;
  shippingAddress?: PagarmeAddressInput;
  shippingAmount?: number; // em CENTAVOS
  items: PagarmeItemInput[];
  payment: PagarmePaymentInput;
}

// ───────────────────────── Tipos de saída ─────────────────────────

export interface PagarmeOrderResult {
  id: string; // or_...
  code?: string;
  status: string; // pending | paid | canceled | failed | processing
  amount: number;
  charge?: { id: string; status: string; paymentMethod: string };
  pix?: { qrCode: string; qrCodeUrl: string; expiresAt?: string };
  boleto?: {
    url: string;
    pdf?: string;
    line: string;
    barcode: string;
    dueAt?: string;
  };
  raw: Record<string, unknown>;
}

export interface PagarmeWebhookEvent {
  type: string; // order.paid | order.payment_failed | charge.paid | ...
  orderId?: string;
  orderCode?: string;
  status?: string;
  raw: Record<string, unknown>;
}

// ───────────────────────── Erro tipado ─────────────────────────

export class PagarmeError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown,
    public raw?: unknown,
  ) {
    super(message);
    this.name = 'PagarmeError';
  }
}

// ───────────────────────── Helpers internos ─────────────────────────

function getAuthHeader(): string {
  const key = process.env.PAGARME_SECRET_KEY;
  if (!key) throw new Error('PAGARME_SECRET_KEY não configurada no ambiente.');
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`;
}

function onlyDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

function buildDocument(doc: string): {
  document: string;
  type: 'individual' | 'company';
} {
  const digits = onlyDigits(doc);
  return {
    document: digits,
    type: digits.length > 11 ? 'company' : 'individual',
  };
}

function buildPhones(raw?: string) {
  if (!raw) return undefined;
  let digits = onlyDigits(raw);
  if (digits.startsWith('55') && digits.length > 11) digits = digits.slice(2);
  if (digits.length < 10) return undefined;
  return {
    mobile_phone: {
      country_code: '55',
      area_code: digits.slice(0, 2),
      number: digits.slice(2),
    },
  };
}

function buildAddress(a: PagarmeAddressInput) {
  return {
    line_1: `${a.number}, ${a.street}, ${a.neighborhood}`,
    line_2: a.complement || '',
    zip_code: onlyDigits(a.zipCode),
    city: a.city,
    state: a.state,
    country: a.country || 'BR',
  };
}

function buildPayment(input: CreateOrderInput) {
  const p = input.payment;

  if (p.method === 'credit_card') {
    return {
      payment_method: 'credit_card',
      credit_card: {
        installments: p.installments,
        statement_descriptor: (p.statementDescriptor || 'SURFERSPAR').slice(
          0,
          13,
        ),
        card_token: p.cardToken,
        card: { billing_address: buildAddress(input.billingAddress) },
      },
    };
  }

  if (p.method === 'pix') {
    return {
      payment_method: 'pix',
      pix: {
        expires_in: p.expiresIn ?? 3600,
        additional_information: input.code
          ? [{ name: 'Pedido', value: input.code }]
          : undefined,
      },
    };
  }

  // boleto
  const due = new Date();
  due.setDate(due.getDate() + (p.dueInDays ?? 3));
  return {
    payment_method: 'boleto',
    boleto: {
      instructions: p.instructions || 'Pagar até a data de vencimento.',
      due_at: due.toISOString(),
      document_number: input.code,
      type: 'DM',
    },
  };
}

async function pagarmeRequest<T>(
  endpoint: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${PAGARME_API_URL}${endpoint}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  const text = await res.text();

  // Parse seguro: instabilidade no gateway/proxy pode devolver HTML.
  // Sem isto, JSON.parse estoura uma exceção genérica (500 cru pro cliente)
  // em vez de um PagarmeError tratável com mensagem amigável.
  let data: Record<string, any> = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new PagarmeError(
        'Resposta inválida da Pagar.me. Tente novamente em instantes.',
        res.status || 502,
        undefined,
        text.slice(0, 500),
      );
    }
  }

  if (!res.ok) {
    const message =
      (data?.message as string) || 'Erro na comunicação com a Pagar.me.';
    throw new PagarmeError(message, res.status, data?.errors, data);
  }
  return data as T;
}

function normalizeOrder(data: Record<string, any>): PagarmeOrderResult {
  const charge = Array.isArray(data.charges) ? data.charges[0] : undefined;
  const lt = charge?.last_transaction;

  const result: PagarmeOrderResult = {
    id: data.id,
    code: data.code,
    status: data.status,
    amount: data.amount,
    raw: data,
  };

  if (charge) {
    result.charge = {
      id: charge.id,
      status: charge.status,
      paymentMethod: charge.payment_method,
    };

    if (charge.payment_method === 'pix' && lt) {
      result.pix = {
        qrCode: lt.qr_code, // copia-e-cola (EMV)
        qrCodeUrl: lt.qr_code_url, // imagem do QR
        expiresAt: lt.expires_at,
      };
    }

    if (charge.payment_method === 'boleto' && lt) {
      result.boleto = {
        url: lt.url,
        pdf: lt.pdf,
        line: lt.line, // linha digitável
        barcode: lt.barcode,
        dueAt: lt.due_at,
      };
    }
  }

  return result;
}

// ───────────────────────── API pública ─────────────────────────

/** Cria um pedido (cartão, PIX ou boleto) na Orders API V5. */
export async function createOrder(
  input: CreateOrderInput,
): Promise<PagarmeOrderResult> {
  const doc = buildDocument(input.customer.document);

  const body = {
    code: input.code,
    items: input.items.map(i => ({
      amount: i.amount,
      description: i.name,
      quantity: i.quantity,
      code: i.code,
    })),
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      document: doc.document,
      type: input.customer.type || doc.type,
      phones: buildPhones(input.customer.phone),
      address: buildAddress(input.billingAddress),
    },
    shipping: input.shippingAddress
      ? {
          amount: input.shippingAmount ?? 0,
          description: 'Frete',
          recipient_name: input.customer.name,
          address: buildAddress(input.shippingAddress),
        }
      : undefined,
    payments: [buildPayment(input)],
  };

  const data = await pagarmeRequest<Record<string, any>>('/orders', {
    method: 'POST',
    body,
  });
  return normalizeOrder(data);
}

/** Consulta um pedido por ID (or_...). Use no fallback de status, nunca como fonte única. */
export async function getOrder(orderId: string): Promise<PagarmeOrderResult> {
  const data = await pagarmeRequest<Record<string, any>>(`/orders/${orderId}`);
  return normalizeOrder(data);
}

/** Cancela uma cobrança (ch_...). Útil para estornos/admin. */
export async function cancelCharge(
  chargeId: string,
): Promise<Record<string, unknown>> {
  return pagarmeRequest(`/charges/${chargeId}`, { method: 'DELETE' });
}

/**
 * Valida o Basic Auth que a Pagar.me envia no webhook.
 *
 * FAIL-CLOSED em produção: se PAGARME_WEBHOOK_USER/PASS não estiverem
 * configurados no ambiente, o webhook é REJEITADO. Sem isto, esquecer as
 * vars na Vercel deixaria qualquer pessoa marcar pedidos como pagos com um
 * simples POST { type: "order.paid", data: { code: "SP-XXXX" } }.
 *
 * Em desenvolvimento (NODE_ENV !== 'production') continua liberado quando
 * não configurado, para facilitar testes locais com o dashboard sandbox.
 *
 * Os MESMOS valores devem estar cadastrados na autenticação Basic do
 * webhook no painel Pagar.me (Configurações → Webhooks).
 */
export function validateWebhookAuth(
  authorizationHeader: string | null,
): boolean {
  const user = process.env.PAGARME_WEBHOOK_USER;
  const pass = process.env.PAGARME_WEBHOOK_PASS;

  if (!user || !pass) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[Pagar.me Webhook] PAGARME_WEBHOOK_USER/PASS ausentes em produção — webhook rejeitado (fail-closed).',
      );
      return false;
    }
    console.warn(
      '[Pagar.me Webhook] Auth não configurada — liberado apenas em desenvolvimento.',
    );
    return true;
  }

  if (!authorizationHeader?.startsWith('Basic ')) return false;

  const expected = Buffer.from(`${user}:${pass}`).toString('base64');
  const received = authorizationHeader.slice(6).trim();

  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Extrai os campos essenciais do payload do webhook V5. */
export function parseWebhookEvent(
  payload: Record<string, any>,
): PagarmeWebhookEvent {
  const data = payload?.data ?? {};
  return {
    type: payload?.type,
    orderId: data?.id,
    orderCode: data?.code,
    status: data?.status,
    raw: payload,
  };
}
