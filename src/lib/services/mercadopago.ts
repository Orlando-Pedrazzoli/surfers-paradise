// 📄 src/lib/services/mercadopago.ts
// Cliente da API de Orders do Mercado Pago (Checkout Transparente).
// Substitui a Pagar.me V5 mantendo o MESMO contrato consumido por
// services/checkout.ts: createOrder(input) → resultado normalizado.
//
// Diferenças relevantes vs Pagar.me:
// - Valores em REAIS como string decimal ("150.00"), não centavos.
// - O MP cobra `total_amount` diretamente — não é preciso distribuir o
//   desconto proporcionalmente nos itens (buildPagarmeItems aposentado).
// - Cartão exige a BANDEIRA em payment_method.id (visa/master/amex/elo/
//   hipercard) além do token — o frontend envia paymentMethodId.
// - PIX devolve qr_code (copia-e-cola EMV), qr_code_base64 (imagem) e
//   ticket_url (página hospedada com instruções).
// - Webhook autenticado por HMAC (x-signature: ts=...,v1=...) com secret
//   configurado no painel — validação em tempo constante, FAIL-CLOSED em
//   produção.
//
// Env: MP_ACCESS_TOKEN (backend), MP_WEBHOOK_SECRET (assinatura do webhook).

import crypto from 'crypto';

const MP_API = 'https://api.mercadopago.com';

// ---------------------------------------------------------------------------
// Tipos de entrada (compatíveis com os antigos Pagarme*Input)
// ---------------------------------------------------------------------------

export interface MpCustomerInput {
  name: string;
  email: string;
  document: string; // CPF ou CNPJ, com ou sem máscara
  phone?: string;
}

export interface MpAddressInput {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface MpItemInput {
  name: string;
  quantity: number;
  amount: number; // REAIS, unitário (informativo — o MP cobra o total)
  sku?: string;
}

export type MpPaymentInput =
  | {
      method: 'credit_card';
      cardToken: string;
      paymentMethodId: string; // bandeira: visa | master | amex | elo | hipercard
      installments: number;
    }
  | {
      method: 'pix';
      expiresInSeconds?: number; // padrão 3600 (1h); MP aceita 30min–30d
    }
  | {
      method: 'boleto';
      /** Vencimento em dias (ISO "PnD"). MP aceita 1–30; padrão/recomendado 3. */
      expiresInDays?: number;
    };

export interface CreateOrderInput {
  code: string; // orderNumber interno → external_reference
  totalAmount: number; // REAIS — valor final cobrado (itens - descontos + frete)
  customer: MpCustomerInput;
  shippingAddress?: MpAddressInput;
  items?: MpItemInput[]; // informativo (não usado no MVP do payload)
  payment: MpPaymentInput;
  /**
   * Device fingerprint do comprador (window.MP_DEVICE_SESSION_ID, gerado
   * pelo script security.js do MP no checkout). Enviado no header
   * X-meli-session-id — recomendação oficial para melhorar a taxa de
   * aprovação de cartão em produção. Opcional; omitido se ausente.
   */
  deviceId?: string;
}

// ---------------------------------------------------------------------------
// Resultado normalizado (espelha o PagarmeOrderResult)
// ---------------------------------------------------------------------------

export interface MpOrderResult {
  id: string; // ORD...
  status: string; // created | processed | action_required | failed | ...
  statusDetail?: string; // accredited | waiting_transfer | ...
  /** external_reference devolvido pelo MP (= orderNumber interno). Usado
   *  como vínculo de FALLBACK no webhook quando o mpOrderId ainda não foi
   *  persistido no pedido local (corrida webhook × save). */
  externalReference?: string;
  payment?: {
    id: string; // PAY...
    status: string;
    statusDetail?: string;
  };
  pix?: {
    qrCode: string; // copia-e-cola (EMV)
    qrCodeBase64: string; // imagem PNG em base64 (sem prefixo data:)
    ticketUrl: string; // página hospedada do MP com QR + instruções
  };
  boleto?: {
    ticketUrl: string; // página do MP com o boleto para abrir/imprimir
    digitableLine: string; // linha digitável (o que o cliente copia e paga)
    barcodeContent: string; // código de barras EAN
  };
}

export class MercadoPagoError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'MercadoPagoError';
    this.status = status;
    this.details = details;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAccessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    throw new MercadoPagoError('MP_ACCESS_TOKEN não configurado.', 500);
  }
  return token;
}

function onlyDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

/** Valor em reais → string decimal com 2 casas ("150.00"), formato do MP. */
function toAmountString(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function buildPayer(customer: MpCustomerInput, address?: MpAddressInput) {
  const doc = onlyDigits(customer.document);
  const { first, last } = splitName(customer.name);
  const payer: Record<string, unknown> = {
    email: customer.email,
    first_name: first,
    last_name: last,
    identification: {
      type: doc.length > 11 ? 'CNPJ' : 'CPF',
      number: doc,
    },
  };
  // Endereço do pagador: OBRIGATÓRIO para boleto (zip_code, street_name,
  // street_number, neighborhood, city, state com 2 letras). Para cartão e
  // PIX é opcional, mas ajuda o antifraude do MP — incluímos sempre que
  // disponível.
  if (address) {
    payer.address = {
      zip_code: onlyDigits(address.zipCode),
      street_name: address.street,
      street_number: address.number || 'N/A',
      neighborhood: address.neighborhood,
      city: address.city,
      state: (address.state || '').toUpperCase().slice(0, 2),
    };
  }
  return payer;
}

/** Duração ISO 8601 para expiration_time do PIX (ex.: 3600 → "PT1H"). */
function toIsoDuration(seconds: number): string {
  const s = Math.max(1800, Math.min(seconds, 30 * 24 * 3600)); // 30min–30d
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  let out = 'PT';
  if (h > 0) out += `${h}H`;
  if (m > 0) out += `${m}M`;
  return out === 'PT' ? 'PT30M' : out;
}

/** Duração ISO 8601 em dias para expiration_time do BOLETO ("P3D"). */
function toIsoDayDuration(days: number): string {
  const d = Math.max(1, Math.min(Math.round(days), 30)); // MP aceita 1–30
  return `P${d}D`;
}

async function mpRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  idempotencyKey?: string,
  deviceId?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    accept: 'application/json',
    Authorization: `Bearer ${getAccessToken()}`,
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;
  // Device fingerprint (security.js) — melhora a aprovação de cartão.
  if (deviceId) headers['X-meli-session-id'] = deviceId;

  const res = await fetch(`${MP_API}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (data as Record<string, any>)?.message ||
      (data as Record<string, any>)?.errors?.[0]?.message ||
      `Mercado Pago respondeu ${res.status}`;
    // 🔍 Diagnóstico: loga o payload enviado (token de cartão mascarado)
    // para comparar com os exemplos oficiais quando a API rejeita.
    if (body !== undefined) {
      try {
        const masked = JSON.parse(JSON.stringify(body));
        const pm = masked?.transactions?.payments?.[0]?.payment_method;
        if (pm?.token) pm.token = `${String(pm.token).slice(0, 6)}…`;
        console.error(
          '[MP] request rejeitado',
          res.status,
          path,
          '\npayload:',
          JSON.stringify(masked, null, 2),
          '\nresposta:',
          JSON.stringify(data, null, 2),
        );
      } catch {
        /* log é best-effort */
      }
    }
    throw new MercadoPagoError(message, res.status, data);
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// Normalização
// ---------------------------------------------------------------------------

/** Status (de order OU de payment) que significam pagamento confirmado. */
const PAID_STATUSES = new Set(['processed', 'accredited', 'approved']);
/** Status que significam falha/terminal sem pagamento. */
const FAILED_STATUSES = new Set([
  'failed',
  'rejected',
  'canceled',
  'cancelled',
  'expired',
]);

export function isPaidStatus(result: MpOrderResult): boolean {
  return (
    PAID_STATUSES.has(result.status) ||
    PAID_STATUSES.has(result.payment?.status || '') ||
    result.statusDetail === 'accredited' ||
    result.payment?.statusDetail === 'accredited'
  );
}

export function isFailedStatus(result: MpOrderResult): boolean {
  if (isPaidStatus(result)) return false;
  return (
    FAILED_STATUSES.has(result.status) ||
    FAILED_STATUSES.has(result.payment?.status || '')
  );
}

export function isRefundedStatus(result: MpOrderResult): boolean {
  return result.status === 'refunded' || result.payment?.status === 'refunded';
}

function normalizeOrder(data: Record<string, any>): MpOrderResult {
  const payment = data?.transactions?.payments?.[0];
  const pm = payment?.payment_method;

  const result: MpOrderResult = {
    id: String(data?.id || ''),
    status: String(data?.status || ''),
    statusDetail: data?.status_detail ? String(data.status_detail) : undefined,
    externalReference: data?.external_reference
      ? String(data.external_reference)
      : undefined,
  };

  if (payment?.id) {
    result.payment = {
      id: String(payment.id),
      status: String(payment.status || ''),
      statusDetail: payment.status_detail
        ? String(payment.status_detail)
        : undefined,
    };
  }

  // BOLETO (type ticket): identificado pela linha digitável / barcode.
  // Precisa ser testado ANTES do PIX porque o boleto também tem ticket_url.
  if (pm?.digitable_line || pm?.barcode_content) {
    result.boleto = {
      ticketUrl: String(pm.ticket_url || ''),
      digitableLine: String(pm.digitable_line || ''),
      barcodeContent: String(pm.barcode_content || ''),
    };
  } else if (pm?.qr_code || pm?.qr_code_base64 || pm?.ticket_url) {
    result.pix = {
      qrCode: String(pm.qr_code || ''),
      qrCodeBase64: String(pm.qr_code_base64 || ''),
      ticketUrl: String(pm.ticket_url || ''),
    };
  }

  return result;
}

// ---------------------------------------------------------------------------
// API pública do serviço
// ---------------------------------------------------------------------------

export async function createOrder(
  input: CreateOrderInput,
): Promise<MpOrderResult> {
  const amount = toAmountString(input.totalAmount);

  const paymentNode: Record<string, unknown> = { amount };

  if (input.payment.method === 'credit_card') {
    paymentNode.payment_method = {
      id: input.payment.paymentMethodId,
      type: 'credit_card',
      token: input.payment.cardToken,
      installments: input.payment.installments,
    };
  } else if (input.payment.method === 'pix') {
    paymentNode.payment_method = { id: 'pix', type: 'bank_transfer' };
    paymentNode.expiration_time = toIsoDuration(
      input.payment.expiresInSeconds ?? 3600,
    );
  } else {
    // BOLETO — payload oficial da API de Orders: id "boleto", type "ticket".
    // Vencimento padrão de 3 dias ("P3D", recomendação da documentação para
    // não conflitar com a compensação de até 2h úteis).
    paymentNode.payment_method = { id: 'boleto', type: 'ticket' };
    paymentNode.expiration_time = toIsoDayDuration(
      input.payment.expiresInDays ?? 3,
    );
  }

  const body = {
    type: 'online',
    processing_mode: 'automatic',
    total_amount: amount,
    external_reference: input.code,
    payer: buildPayer(input.customer, input.shippingAddress),
    transactions: { payments: [paymentNode] },
  };

  // Idempotência: mesma order interna + método → mesma chave. Um retry do
  // usuário não duplica a cobrança; um novo PIX após expirar gera pedido novo
  // (orderNumber novo), então ganha chave nova naturalmente.
  const idempotencyKey = `${input.code}-${input.payment.method}`;

  const data = await mpRequest<Record<string, any>>(
    'POST',
    '/v1/orders',
    body,
    idempotencyKey,
    input.deviceId,
  );
  return normalizeOrder(data);
}

export async function getOrder(orderId: string): Promise<MpOrderResult> {
  const data = await mpRequest<Record<string, any>>(
    'GET',
    `/v1/orders/${encodeURIComponent(orderId)}`,
  );
  return normalizeOrder(data);
}

// ---------------------------------------------------------------------------
// Webhook (assinatura x-signature)
// ---------------------------------------------------------------------------

export interface MpWebhookEvent {
  type: string; // "order" | "payment" | ...
  action: string; // "order.processed", "payment.updated", ...
  dataId: string; // id do recurso notificado
}

/**
 * Valida a assinatura HMAC do webhook do Mercado Pago.
 * Header x-signature: "ts=<timestamp>,v1=<hmac>".
 * Manifest: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
 * (partes ausentes são omitidas do manifest, conforme a documentação).
 * FAIL-CLOSED em produção quando MP_WEBHOOK_SECRET está configurado ou
 * ausente; permissivo apenas fora de produção sem secret (dev local).
 */
export function validateWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[MP Webhook] MP_WEBHOOK_SECRET ausente — rejeitando.');
      return false;
    }
    return true; // dev local sem secret
  }

  if (!params.xSignature) return false;

  const parts: Record<string, string> = {};
  for (const piece of params.xSignature.split(',')) {
    const [k, v] = piece.split('=').map(s => s?.trim());
    if (k && v) parts[k] = v;
  }
  const ts = parts['ts'];
  const v1 = parts['v1'];
  if (!ts || !v1) return false;

  let manifest = '';
  if (params.dataId) manifest += `id:${params.dataId.toLowerCase()};`;
  if (params.xRequestId) manifest += `request-id:${params.xRequestId};`;
  manifest += `ts:${ts};`;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Extrai o evento do payload/query do webhook (formatos variam por tópico). */
export function parseWebhookEvent(
  payload: Record<string, any>,
  searchParams?: URLSearchParams,
): MpWebhookEvent {
  const dataId =
    payload?.data?.id ??
    searchParams?.get('data.id') ??
    searchParams?.get('id') ??
    '';
  return {
    type: String(payload?.type ?? searchParams?.get('type') ?? ''),
    action: String(payload?.action ?? ''),
    dataId: String(dataId),
  };
}
