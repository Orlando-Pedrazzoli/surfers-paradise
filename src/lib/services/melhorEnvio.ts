// src/lib/services/melhorEnvio.ts
// Integração Melhor Envio API v2
// Docs: https://docs.melhorenvio.com.br

const IS_SANDBOX = process.env.MELHOR_ENVIO_SANDBOX === 'true';

const BASE_URL = IS_SANDBOX
  ? 'https://sandbox.melhorenvio.com.br/api/v2'
  : 'https://melhorenvio.com.br/api/v2';

const TOKEN = process.env.MELHOR_ENVIO_TOKEN;
const USER_AGENT =
  process.env.MELHOR_ENVIO_USER_AGENT ||
  'SurfersParadise (lojasurfersparadiseoficial@gmail.com)';
const FROM_CEP = (process.env.MELHOR_ENVIO_FROM_CEP || '').replace(/\D/g, '');

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export interface ShippingQuote {
  id: number;
  name: string;
  price: number;
  deliveryDays: number;
  company: string;
  companyLogo?: string;
}

export interface ShippingParams {
  cepOrigem?: string; // opcional: default MELHOR_ENVIO_FROM_CEP
  cepDestino: string;
  weight: number; // kg
  height: number; // cm
  width: number; // cm
  length: number; // cm
  insuranceValue?: number; // valor declarado (R$)
}

export interface LabelRecipient {
  name: string;
  phone: string;
  email: string;
  document: string; // CPF (só números)
  address: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state_abbr: string; // ex: 'SP'
  postal_code: string;
}

export interface LabelPackage {
  weight: number;
  height: number;
  width: number;
  length: number;
}

export interface CreateLabelParams {
  serviceId: number; // id do serviço cotado (ex: 1 = PAC, 2 = SEDEX)
  recipient: LabelRecipient;
  packageData: LabelPackage;
  insuranceValue: number;
  orderNumber: string; // nosso número de pedido (tag)
}

export interface TrackingInfo {
  status: string;
  trackingCode: string | null;
  meTrackingUrl: string | null;
  postedAt: string | null;
  deliveredAt: string | null;
}

interface MelhorEnvioError {
  message?: string;
  errors?: Record<string, string[]>;
}

// ─────────────────────────────────────────────
// Helper de requisição
// ─────────────────────────────────────────────

async function meRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  if (!TOKEN) {
    throw new Error('MELHOR_ENVIO_TOKEN não configurado');
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      'User-Agent': USER_AGENT,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = data as MelhorEnvioError | null;
    const details = err?.errors
      ? Object.values(err.errors).flat().join('; ')
      : '';
    throw new Error(
      `Melhor Envio [${res.status}] ${err?.message || 'Erro na requisição'}${
        details ? ` — ${details}` : ''
      }`,
    );
  }

  return data as T;
}

function cleanCep(cep: string): string {
  return cep.replace(/\D/g, '');
}

// ─────────────────────────────────────────────
// Cotação de frete
// ─────────────────────────────────────────────

interface MECalculateResponse {
  id: number;
  name: string;
  price?: string;
  custom_price?: string;
  delivery_time?: number;
  custom_delivery_time?: number;
  company: { id: number; name: string; picture: string };
  error?: string;
}

export async function calculateShipping(
  params: ShippingParams,
): Promise<ShippingQuote[]> {
  const origem = cleanCep(params.cepOrigem || FROM_CEP);
  const destino = cleanCep(params.cepDestino);

  if (!origem || origem.length !== 8) {
    throw new Error('CEP de origem inválido ou não configurado');
  }
  if (!destino || destino.length !== 8) {
    throw new Error('CEP de destino inválido');
  }

  const body = {
    from: { postal_code: origem },
    to: { postal_code: destino },
    package: {
      weight: params.weight,
      height: params.height,
      width: params.width,
      length: params.length,
    },
    options: {
      insurance_value: params.insuranceValue ?? 0,
      receipt: false,
      own_hand: false,
    },
  };

  const results = await meRequest<MECalculateResponse[]>(
    '/me/shipment/calculate',
    { method: 'POST', body },
  );

  return results
    .filter(r => !r.error && (r.price || r.custom_price))
    .map(r => ({
      id: r.id,
      name: r.name,
      price: parseFloat(r.custom_price || r.price || '0'),
      deliveryDays: r.custom_delivery_time || r.delivery_time || 0,
      company: r.company.name,
      companyLogo: r.company.picture,
    }))
    .sort((a, b) => a.price - b.price);
}

// ─────────────────────────────────────────────
// Fluxo de etiqueta: carrinho → checkout → generate → print
// ─────────────────────────────────────────────

interface MECartResponse {
  id: string; // uuid do envio no Melhor Envio
  protocol: string;
  price: string;
}

/**
 * Cria a etiqueta completa: adiciona ao carrinho, paga com saldo,
 * gera e retorna a URL do PDF para impressão.
 * Retorna o uuid do envio (guardar no Order) e a URL da etiqueta.
 */
export async function createShippingLabel(
  params: CreateLabelParams,
): Promise<{ shipmentId: string; labelUrl: string; protocol: string }> {
  // 1. Adicionar ao carrinho
  const cartItem = await meRequest<MECartResponse>('/me/cart', {
    method: 'POST',
    body: {
      service: params.serviceId,
      from: { postal_code: FROM_CEP },
      to: {
        name: params.recipient.name,
        phone: params.recipient.phone,
        email: params.recipient.email,
        document: params.recipient.document.replace(/\D/g, ''),
        address: params.recipient.address,
        number: params.recipient.number,
        complement: params.recipient.complement || '',
        district: params.recipient.district,
        city: params.recipient.city,
        state_abbr: params.recipient.state_abbr,
        country_id: 'BR',
        postal_code: cleanCep(params.recipient.postal_code),
      },
      volumes: [
        {
          weight: params.packageData.weight,
          height: params.packageData.height,
          width: params.packageData.width,
          length: params.packageData.length,
        },
      ],
      options: {
        insurance_value: params.insuranceValue,
        receipt: false,
        own_hand: false,
        non_commercial: true, // sem NF vinculada; mudar p/ false + invoice quando emitirem NF-e
        tags: [{ tag: params.orderNumber }],
      },
    },
  });

  // 2. Checkout (paga com saldo da carteira)
  await meRequest('/me/shipment/checkout', {
    method: 'POST',
    body: { orders: [cartItem.id] },
  });

  // 3. Gerar etiqueta
  await meRequest('/me/shipment/generate', {
    method: 'POST',
    body: { orders: [cartItem.id] },
  });

  // 4. Obter URL de impressão (PDF)
  const printRes = await meRequest<{ url: string }>('/me/shipment/print', {
    method: 'POST',
    body: { mode: 'private', orders: [cartItem.id] },
  });

  return {
    shipmentId: cartItem.id,
    labelUrl: printRes.url,
    protocol: cartItem.protocol,
  };
}

/**
 * Compat: mantém assinatura antiga usada pelas rotas.
 * Retorna apenas a URL da etiqueta de um envio já criado.
 */
export async function generateLabel(
  shipmentId: string,
): Promise<string | null> {
  try {
    await meRequest('/me/shipment/generate', {
      method: 'POST',
      body: { orders: [shipmentId] },
    });
    const printRes = await meRequest<{ url: string }>('/me/shipment/print', {
      method: 'POST',
      body: { mode: 'private', orders: [shipmentId] },
    });
    return printRes.url;
  } catch (err) {
    console.error('[MelhorEnvio] generateLabel:', err);
    return null;
  }
}

// ─────────────────────────────────────────────
// Rastreamento
// ─────────────────────────────────────────────

interface METrackingResponse {
  [shipmentId: string]: {
    status: string;
    tracking: string | null;
    melhorenvio_tracking: string | null;
    posted_at: string | null;
    delivered_at: string | null;
  };
}

export async function trackShipment(
  shipmentId: string,
): Promise<TrackingInfo | null> {
  try {
    const res = await meRequest<METrackingResponse>('/me/shipment/tracking', {
      method: 'POST',
      body: { orders: [shipmentId] },
    });
    const info = res[shipmentId];
    if (!info) return null;
    return {
      status: info.status,
      trackingCode: info.tracking,
      meTrackingUrl: info.melhorenvio_tracking
        ? `https://app.melhorrastreio.com.br/app/melhorenvio/${info.melhorenvio_tracking}`
        : null,
      postedAt: info.posted_at,
      deliveredAt: info.delivered_at,
    };
  } catch (err) {
    console.error('[MelhorEnvio] trackShipment:', err);
    return null;
  }
}

// ─────────────────────────────────────────────
// Cancelamento (devolve saldo se não postada)
// ─────────────────────────────────────────────

export async function cancelShipment(
  shipmentId: string,
  reason = 'Cancelamento solicitado pela loja',
): Promise<boolean> {
  try {
    await meRequest('/me/shipment/cancel', {
      method: 'POST',
      body: {
        order: { id: shipmentId, reason_id: '2', description: reason },
      },
    });
    return true;
  } catch (err) {
    console.error('[MelhorEnvio] cancelShipment:', err);
    return false;
  }
}
