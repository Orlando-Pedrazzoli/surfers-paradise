// 📄 src/lib/services/mercadopago.ts
// Cliente da API de Orders do Mercado Pago (Checkout Transparente).
// Substitui a Pagar.me V5 mantendo o MESMO contrato consumido por
// services/checkout.ts: createOrder(input) → resultado normalizado.
//
// v2 (revisão de aprovação de cartão):
// - RECUSA NÃO É MAIS OPACA: o status_detail do MP (insufficient_amount,
//   high_risk, bad_filled_card_data, …) é normalizado em `failure`
//   {code, message, customerMessage} e devolvido ao checkout para ser
//   PERSISTIDO no pedido e mostrado no admin + ao cliente.
// - HTTP 402 (documentado como "order criada, transação falhou") deixa de
//   virar exceção: o corpo traz a order com status failed e é normalizado
//   como resultado normal. Só erros reais (400/401/5xx) lançam.
// - Payload enriquecido para o antifraude: items (title/unit_price/
//   quantity/external_code/picture_url/category_id), description,
//   payer.phone (area_code/number) e statement_descriptor. Todos os
//   campos vêm do exemplo oficial da referência POST /v1/orders.
// - Cartão de DÉBITO suportado: payment_method.type 'debit_card' com o id
//   resolvido pelo BIN no front (debvisa/debmaster/debelo…), parcela única.
//
// Diferenças relevantes vs Pagar.me:
// - Valores em REAIS como string decimal ("150.00"), não centavos.
// - O MP cobra `total_amount` diretamente — items são informativos.
// - Cartão exige a BANDEIRA em payment_method.id além do token.
// - PIX devolve qr_code, qr_code_base64 e ticket_url.
// - Webhook autenticado por HMAC (x-signature) — FAIL-CLOSED em produção.
//
// Env: MP_ACCESS_TOKEN (backend), MP_WEBHOOK_SECRET (assinatura do webhook).

import crypto from 'crypto';

const MP_API = 'https://api.mercadopago.com';

// ---------------------------------------------------------------------------
// Tipos de entrada
// ---------------------------------------------------------------------------

export interface MpCustomerInput {
  name: string;
  email: string;
  document: string; // CPF ou CNPJ, com ou sem máscara
  phone?: string; // qualquer máscara — normalizado para area_code/number
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
  amount: number; // REAIS, unitário
  sku?: string;
  description?: string;
  pictureUrl?: string; // precisa ser URL absoluta para ser enviada
}

export type MpCardType = 'credit_card' | 'debit_card';

export type MpPaymentInput =
  | {
      method: 'credit_card';
      cardToken: string;
      paymentMethodId: string; // visa | master | amex | elo | hipercard | debvisa | debmaster …
      /** 'credit_card' (padrão) ou 'debit_card' — resolvido pelo BIN no front. */
      cardType?: MpCardType;
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
  items?: MpItemInput[];
  /** Descrição curta da compra (aparece no painel do MP e ajuda o antifraude). */
  description?: string;
  /** Texto na fatura do cartão (≤ 22 chars, só letras/números/espaço). */
  statementDescriptor?: string;
  payment: MpPaymentInput;
  /**
   * Device fingerprint do comprador (window.MP_DEVICE_SESSION_ID, gerado
   * pelo script security.js do MP no checkout). Enviado no header
   * X-meli-session-id — recomendação oficial para melhorar a taxa de
   * aprovação de cartão em produção. Opcional; omitido se ausente.
   */
  deviceId?: string;
  /**
   * Sufixo da chave de idempotência. Uma NOVA tentativa do mesmo pedido
   * (novo token de cartão) precisa de chave nova — repetir a chave com
   * payload diferente faz o MP responder idempotency_key_already_used.
   */
  attempt?: number;
}

// ---------------------------------------------------------------------------
// Resultado normalizado
// ---------------------------------------------------------------------------

export interface MpFailure {
  /** status_detail cru do MP (ex.: cc_rejected_insufficient_amount). */
  code: string;
  /** Explicação para o ADMIN (pt-BR). */
  message: string;
  /** Mensagem segura para mostrar ao CLIENTE (pt-BR). */
  customerMessage: string;
  /** Se faz sentido o cliente tentar de novo com o MESMO cartão. */
  retryable: boolean;
}

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
  /** Preenchido quando a order/pagamento está em estado terminal de falha. */
  failure?: MpFailure;
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

/**
 * Telefone BR em qualquer máscara → {area_code, number} do MP.
 * Aceita com ou sem DDI 55. Devolve undefined se não houver DDD + número.
 */
export function splitPhone(
  raw?: string,
): { area_code: string; number: string } | undefined {
  let d = onlyDigits(raw || '');
  if (d.startsWith('55') && d.length >= 12) d = d.slice(2);
  if (d.length < 10 || d.length > 11) return undefined;
  return { area_code: d.slice(0, 2), number: d.slice(2) };
}

/** Descritor de fatura: ≤ 22 chars, só A–Z, 0–9 e espaço (regra do MP). */
export function toStatementDescriptor(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 22);
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
  // Telefone: opcional, mas é um dos dados que o antifraude do MP usa para
  // cruzar com o emissor. Só enviamos se estiver bem formado.
  const phone = splitPhone(customer.phone);
  if (phone) payer.phone = phone;

  // Endereço do pagador: OBRIGATÓRIO para boleto (zip_code, street_name,
  // street_number, neighborhood, city, state com 2 letras). Para cartão e
  // PIX é opcional, mas ajuda o antifraude do MP — incluímos sempre que
  // disponível. street_number precisa ser numérico-ish: "S/N" vira "0".
  if (address) {
    const streetNumber = onlyDigits(address.number) || '0';
    payer.address = {
      zip_code: onlyDigits(address.zipCode),
      street_name: address.street,
      street_number: streetNumber,
      neighborhood: address.neighborhood,
      city: address.city,
      state: (address.state || '').toUpperCase().slice(0, 2),
      ...(address.complement ? { complement: address.complement } : {}),
    };
  }
  return payer;
}

/** Categoria informativa dos itens (lista fixa do MP). Loja de surf → others. */
const MP_ITEM_CATEGORY = 'others';

function buildItems(items?: MpItemInput[]) {
  if (!items?.length) return undefined;
  return items.map(i => {
    const item: Record<string, unknown> = {
      title: String(i.name || 'Produto').slice(0, 256),
      unit_price: toAmountString(i.amount),
      quantity: Math.max(1, Math.round(i.quantity)),
      category_id: MP_ITEM_CATEGORY,
    };
    if (i.sku) item.external_code = String(i.sku).slice(0, 256);
    if (i.description) item.description = String(i.description).slice(0, 256);
    if (i.pictureUrl && /^https?:\/\//i.test(i.pictureUrl)) {
      item.picture_url = i.pictureUrl;
    }
    return item;
  });
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

function maskForLog(body: unknown): unknown {
  try {
    const masked = JSON.parse(JSON.stringify(body));
    const pm = masked?.transactions?.payments?.[0]?.payment_method;
    if (pm?.token) pm.token = `${String(pm.token).slice(0, 6)}…`;
    return masked;
  } catch {
    return '[unserializable]';
  }
}

interface MpHttpResult<T> {
  ok: boolean;
  status: number;
  data: T;
}

async function mpRequestRaw<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  idempotencyKey?: string,
  deviceId?: string,
): Promise<MpHttpResult<T>> {
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

  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

function extractErrorMessage(data: Record<string, any>, status: number) {
  return (
    data?.message ||
    data?.errors?.[0]?.message ||
    data?.errors?.[0]?.code ||
    `Mercado Pago respondeu ${status}`
  );
}

async function mpRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  idempotencyKey?: string,
  deviceId?: string,
): Promise<T> {
  const { ok, status, data } = await mpRequestRaw<Record<string, any>>(
    method,
    path,
    body,
    idempotencyKey,
    deviceId,
  );

  if (!ok) {
    const message = extractErrorMessage(data, status);
    if (body !== undefined) {
      console.error(
        '[MP] request rejeitado',
        status,
        path,
        '\npayload:',
        JSON.stringify(maskForLog(body), null, 2),
        '\nresposta:',
        JSON.stringify(data, null, 2),
      );
    }
    throw new MercadoPagoError(message, status, data);
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// Normalização de status
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

// ---------------------------------------------------------------------------
// Motivos de recusa (status_detail → mensagens)
// ---------------------------------------------------------------------------

interface FailureSpec {
  message: string;
  customerMessage: string;
  retryable: boolean;
}

const GENERIC_CUSTOMER =
  'O emissor do cartão não autorizou o pagamento. Confira os dados, tente outro cartão ou pague com PIX.';

/**
 * Tabela de status_detail do MP. A Orders API usa tanto os códigos
 * "clássicos" (cc_rejected_*) quanto formas curtas (insufficient_amount,
 * high_risk…). A busca é por CHAVE CONTIDA no código, após remover o
 * prefixo cc_rejected_, então as duas famílias caem na mesma linha.
 */
const FAILURE_TABLE: Array<[string, FailureSpec]> = [
  [
    'bad_filled_card_number',
    {
      message: 'Número do cartão inválido (bad_filled_card_number).',
      customerMessage: 'Número do cartão inválido. Confira e tente novamente.',
      retryable: true,
    },
  ],
  [
    'bad_filled_date',
    {
      message: 'Validade do cartão inválida (bad_filled_date).',
      customerMessage: 'Data de validade inválida. Confira e tente novamente.',
      retryable: true,
    },
  ],
  [
    'bad_filled_security_code',
    {
      message: 'CVV inválido (bad_filled_security_code).',
      customerMessage:
        'Código de segurança (CVV) inválido. Confira e tente novamente.',
      retryable: true,
    },
  ],
  [
    'bad_filled',
    {
      message:
        'Dados do cartão incorretos — geralmente CPF do titular ou nome divergente do emissor (bad_filled_other / bad_filled_card_data).',
      customerMessage:
        'Algum dado do cartão não confere (nome, CPF do titular, validade ou CVV). Revise e tente novamente.',
      retryable: true,
    },
  ],
  [
    'insufficient_amount',
    {
      message: 'Saldo/limite insuficiente no cartão (insufficient_amount).',
      customerMessage:
        'O cartão não tem limite disponível para este valor. Tente outro cartão, menos parcelas ou PIX.',
      retryable: false,
    },
  ],
  [
    'invalid_installments',
    {
      message:
        'Emissor não aceita o número de parcelas escolhido (invalid_installments).',
      customerMessage:
        'O emissor não aceitou esse parcelamento. Tente com menos parcelas.',
      retryable: true,
    },
  ],
  [
    'call_for_authorize',
    {
      message:
        'Emissor pede autorização por telefone (call_for_authorize). O cliente precisa ligar para o banco e liberar a compra.',
      customerMessage:
        'O banco pede que você autorize esta compra. Ligue para o emissor do cartão e tente novamente, ou pague com PIX.',
      retryable: true,
    },
  ],
  [
    'card_disabled',
    {
      message: 'Cartão bloqueado/inativo no emissor (card_disabled).',
      customerMessage:
        'Este cartão está bloqueado ou inativo. Fale com o banco ou use outro cartão.',
      retryable: false,
    },
  ],
  [
    'card_error',
    {
      message: 'Erro genérico do emissor ao processar o cartão (card_error).',
      customerMessage: GENERIC_CUSTOMER,
      retryable: true,
    },
  ],
  [
    'duplicated_payment',
    {
      message:
        'O emissor detectou pagamento duplicado (duplicated_payment) — mesmo cartão, valor e intervalo curto.',
      customerMessage:
        'Já existe um pagamento igual em processamento. Aguarde alguns minutos antes de tentar de novo.',
      retryable: false,
    },
  ],
  [
    'high_risk',
    {
      message:
        'Recusado pelo antifraude do Mercado Pago (high_risk). Causas típicas: várias tentativas seguidas, dados do comprador/titular inconsistentes, device ID ausente.',
      customerMessage:
        'Não foi possível aprovar este pagamento por segurança. Tente pagar com PIX ou use outro cartão.',
      retryable: false,
    },
  ],
  [
    'rejected_by_issuer',
    {
      message: 'Recusado pelo emissor por suspeita de fraude (rejected_by_issuer).',
      customerMessage: GENERIC_CUSTOMER,
      retryable: false,
    },
  ],
  [
    'blacklist',
    {
      message: 'Cartão em lista restritiva do MP (blacklist).',
      customerMessage: GENERIC_CUSTOMER,
      retryable: false,
    },
  ],
  [
    'max_attempts',
    {
      message:
        'Limite de tentativas atingido no emissor/MP (max_attempts). O cliente deve esperar antes de tentar novamente.',
      customerMessage:
        'Muitas tentativas com este cartão. Aguarde alguns minutos ou pague com PIX.',
      retryable: false,
    },
  ],
  [
    '3ds',
    {
      message:
        'Recusa relacionada a autenticação 3DS (challenge obrigatório ou falhou). A integração ainda não executa o desafio 3DS.',
      customerMessage: GENERIC_CUSTOMER,
      retryable: false,
    },
  ],
  [
    'other_reason',
    {
      message:
        'Recusa genérica do emissor sem motivo detalhado (other_reason). Frequentemente: cartão de débito/virtual sem função crédito online, ou compra internacional bloqueada.',
      customerMessage: GENERIC_CUSTOMER,
      retryable: false,
    },
  ],
  [
    'expired',
    {
      message: 'Order/pagamento expirado no MP (expired).',
      customerMessage: 'O pagamento expirou. Gere um novo pagamento.',
      retryable: true,
    },
  ],
  [
    'cancel',
    {
      message: 'Order cancelada no MP (cancelled).',
      customerMessage: 'O pagamento foi cancelado.',
      retryable: true,
    },
  ],
];

/** Traduz o status_detail do MP para mensagens de admin e de cliente. */
export function describeFailure(rawCode?: string, fallback?: string): MpFailure {
  const code = String(rawCode || fallback || 'unknown').trim();
  const key = code.toLowerCase().replace(/^cc_rejected_/, '');
  for (const [needle, spec] of FAILURE_TABLE) {
    if (key.includes(needle)) return { code, ...spec };
  }
  return {
    code,
    message: `Recusa não catalogada: ${code}${fallback && fallback !== code ? ` — ${fallback}` : ''}.`,
    customerMessage: GENERIC_CUSTOMER,
    retryable: true,
  };
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

  // Falha terminal → motivo normalizado. Prioridade: status_detail do
  // PAGAMENTO (é onde vem cc_rejected_*), depois o da order, depois o
  // primeiro erro do corpo (formato 402: {errors:[{code,message}]}).
  if (isFailedStatus(result) || data?.errors?.length) {
    const errCode = data?.errors?.[0]?.code;
    const errMsg = data?.errors?.[0]?.message;
    const detail =
      payment?.status_detail ||
      (result.statusDetail && result.statusDetail !== 'rejected'
        ? result.statusDetail
        : undefined) ||
      errCode ||
      result.statusDetail;
    result.failure = describeFailure(detail, errMsg || errCode);
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
    const cardType: MpCardType = input.payment.cardType || 'credit_card';
    const pmNode: Record<string, unknown> = {
      id: input.payment.paymentMethodId,
      type: cardType,
      token: input.payment.cardToken,
      // Débito não parcela.
      installments: cardType === 'debit_card' ? 1 : input.payment.installments,
    };
    if (input.statementDescriptor) {
      pmNode.statement_descriptor = input.statementDescriptor;
    }
    paymentNode.payment_method = pmNode;
  } else if (input.payment.method === 'pix') {
    paymentNode.payment_method = { id: 'pix', type: 'bank_transfer' };
    paymentNode.expiration_time = toIsoDuration(
      input.payment.expiresInSeconds ?? 3600,
    );
  } else {
    // BOLETO — payload oficial da API de Orders: id "boleto", type "ticket".
    paymentNode.payment_method = { id: 'boleto', type: 'ticket' };
    paymentNode.expiration_time = toIsoDayDuration(
      input.payment.expiresInDays ?? 3,
    );
  }

  const body: Record<string, unknown> = {
    type: 'online',
    processing_mode: 'automatic',
    total_amount: amount,
    external_reference: input.code,
    payer: buildPayer(input.customer, input.shippingAddress),
    transactions: { payments: [paymentNode] },
  };
  if (input.description) body.description = input.description.slice(0, 256);
  const items = buildItems(input.items);
  if (items) body.items = items;

  // Idempotência: mesma order interna + método + TENTATIVA → mesma chave.
  // Um retry de rede não duplica a cobrança; uma nova tentativa do cliente
  // (novo token) ganha chave nova, senão o MP devolve
  // idempotency_key_already_used.
  const idempotencyKey = `${input.code}-${input.payment.method}-${input.attempt ?? 1}`;

  const { ok, status, data } = await mpRequestRaw<Record<string, any>>(
    'POST',
    '/v1/orders',
    body,
    idempotencyKey,
    input.deviceId,
  );

  if (ok) return normalizeOrder(data);

  // 402 (documentado): "order criada mas a transação falhou". O corpo é a
  // própria order (status failed + errors[]). NÃO é erro de integração —
  // é a recusa normal do cartão, devolvida como resultado para o checkout
  // persistir o motivo. Também aceitamos 4xx cujo corpo traga uma order
  // com status failed (variações de versão da API).
  const looksLikeFailedOrder =
    data && (data.id || data.status === 'failed' || data.transactions);
  if (status === 402 || (status < 500 && looksLikeFailedOrder && data.status)) {
    console.warn(
      '[MP] cartão recusado',
      status,
      input.code,
      data?.transactions?.payments?.[0]?.status_detail ||
        data?.status_detail ||
        data?.errors?.[0]?.code,
    );
    const normalized = normalizeOrder({ ...data, status: data.status || 'failed' });
    if (!normalized.failure) {
      normalized.failure = describeFailure(
        data?.errors?.[0]?.code,
        data?.errors?.[0]?.message,
      );
    }
    return normalized;
  }

  const message = extractErrorMessage(data, status);
  console.error(
    '[MP] request rejeitado',
    status,
    '/v1/orders',
    '\npayload:',
    JSON.stringify(maskForLog(body), null, 2),
    '\nresposta:',
    JSON.stringify(data, null, 2),
  );
  throw new MercadoPagoError(message, status, data);
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

  // A documentação manda usar o data.id em minúsculas quando alfanumérico,
  // mas na prática o tópico Order assina com o ID TAL COMO VEM (ULID
  // maiúsculo — ex.: ORD01...). Aceitamos qualquer uma das variantes,
  // ambas verificadas em tempo constante.
  const idVariants = params.dataId
    ? [...new Set([params.dataId, params.dataId.toLowerCase()])]
    : [null];

  const b = Buffer.from(v1);

  for (const idVariant of idVariants) {
    let manifest = '';
    if (idVariant) manifest += `id:${idVariant};`;
    if (params.xRequestId) manifest += `request-id:${params.xRequestId};`;
    manifest += `ts:${ts};`;

    const expected = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    const a = Buffer.from(expected);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      return true;
    }
  }

  // Diagnóstico (NÃO loga o secret): permite comparar os manifests que
  // montámos com o esperado pela documentação quando um 401 ocorrer.
  console.warn('[MP Webhook] assinatura inválida', {
    dataId: params.dataId,
    xRequestId: params.xRequestId,
    xSignature: params.xSignature,
    secretLen: secret.length,
  });
  return false;
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
