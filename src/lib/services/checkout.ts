// 📄 src/lib/services/checkout.ts
// Orquestra o checkout online: valida → REVALIDA PREÇOS NO BANCO → cupom
// server-side → totais → antifraude → cria (ou REAPROVEITA) pedido pending →
// cria a order no MERCADO PAGO (API de Orders) → atualiza status.
//
// v9 (revisão de aprovação de cartão):
// - MOTIVO DA RECUSA persistido no pedido (payment.failureCode/
//   failureMessage/failedAt) nos DOIS caminhos (resultado failed e
//   exceção) e devolvido ao cliente como mensagem amigável.
// - RETRY REAPROVEITA O PEDIDO: nova tentativa do mesmo comprador com o
//   mesmo carrinho/total dentro de 2h reutiliza o Order falhado em vez de
//   criar outro — o admin deixa de ver N pedidos por 1 cliente, e o
//   velocity check do antifraude deixa de punir o próprio retry.
//   payment.attempts conta as tentativas; a chave de idempotência do MP
//   inclui a tentativa.
// - Payload do MP enriquecido: items, description, payer.phone,
//   statement_descriptor (antifraude + reconhecimento na fatura).
// - DÉBITO: cardType 'debit_card' vindo do front (BIN lookup) é enviado ao
//   MP como tal, com parcela única; o pedido guarda method 'debit_card'.
// - Bandeira/últimos 4 dígitos e se o device ID foi enviado ficam no
//   pedido para diagnóstico.
//
// v8 (cupons restritos por categoria/marca):
// - resolveCoupon local APOSENTADO — a validação/cálculo do cupom agora é
//   feita por lib/services/coupon.ts (resolveCouponForItems), a MESMA fonte
//   usada por /api/coupons/validate. O desconto incide apenas sobre o
//   subtotal dos itens ELEGÍVEIS (categoria/marca do cupom); cupons sem
//   restrição continuam valendo para o carrinho todo.
// - Os PricedItems (preço-verdade do banco) alimentam o serviço, então o
//   anti-tampering do valor do cupom é mantido integralmente.
//
// v6 (migração Pagar.me → Mercado Pago):
// - Gateway trocado para services/mercadopago (API de Orders, Checkout
//   Transparente). O MP cobra total_amount diretamente, então a distribuição
//   proporcional de desconto por item (buildPagarmeItems) foi aposentada.
// - Cartão agora exige paymentMethodId (bandeira) além do cardToken —
//   tokenização feita no front com a Public Key do MP.
// - PIX: qr_code (copia-e-cola) + qr_code_base64 (imagem, salva como data
//   URI em pixQrCode para o <img> do PixPayment funcionar sem mudanças).
// v7: BOLETO reativado via API de Orders (payment_method id 'boleto',
//   type 'ticket', expiration_time P3D). payer.address é obrigatório para
//   boleto — mapeado do shippingAddress. Desconto boletoDiscountPercent
//   aplicado como no PIX.
//
// v2: dispara sendOrderConfirmation quando o cartão é aprovado na hora.
// v3: cupom revalidado e RECALCULADO server-side — o couponDiscount enviado
// pelo cliente é ignorado (anti-tampering).
// v3: usedCount incrementado atomicamente após sucesso no gateway.
// v4: PREÇOS revalidados contra o Product no banco — o price enviado pelo
// cliente é usado apenas para detectar carrinho desatualizado (409 com
// preços novos); o valor cobrado vem SEMPRE do banco. Anti-tampering.
// v4: validação de ESTOQUE e disponibilidade (isActive + isPublishedOnline)
// antes de criar o pedido. (Decremento idempotente na transição paid é
// feito à parte — ver webhook.)
// v5: decrementa estoque no caminho de cartão aprovado na hora via
// processOrderStock (idempotente — o webhook cobre falhas desta chamada).

import { z } from 'zod';
import type { HydratedDocument } from 'mongoose';
import type { IOrder } from '@/lib/types/order';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';
import Coupon from '@/lib/models/Coupon';
import Product from '@/lib/models/Product';
import { company } from '@/lib/config/company';
import {
  createOrder as createMpOrder,
  isPaidStatus,
  isFailedStatus,
  describeFailure,
  toStatementDescriptor,
  MercadoPagoError,
  type MpAddressInput,
  type MpFailure,
} from '@/lib/services/mercadopago';
import { resolveCouponForItems } from '@/lib/services/coupon';
import { checkFraud } from '@/lib/services/fraudProtection';
import { sendOrderPaidEmails } from '@/lib/services/email';
import { processOrderStock } from '@/lib/services/inventory';

export type PaymentMethod = 'credit_card' | 'pix' | 'boleto';

const itemSchema = z.object({
  productId: z.string().optional(),
  sku: z.string().optional().default(''),
  name: z.string(),
  slug: z.string().optional().default(''),
  image: z.string().optional().default(''),
  variant: z.string().optional().default(''),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(), // reais — usado SÓ para detectar carrinho stale
});

const addressSchema = z.object({
  name: z.string().optional().default(''),
  street: z.string(),
  number: z.string(),
  complement: z.string().optional().default(''),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  cep: z.string(),
  phone: z.string().optional().default(''),
  cpf: z.string().optional().default(''),
});

const baseSchema = z.object({
  userId: z.string().optional(),
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
    document: z.string(), // CPF
    phone: z.string().optional().default(''),
  }),
  shippingAddress: addressSchema,
  items: z.array(itemSchema).min(1),
  shippingCost: z.number().nonnegative().default(0),
  shipping: z
    .object({
      method: z.string().optional().default(''),
      carrier: z.string().optional().default(''),
      estimatedDays: z.number().optional().default(0),
      melhorEnvioId: z.string().optional().default(''),
    })
    .optional(),
  coupon: z.string().optional().default(''),
  // Aceito por compatibilidade com o frontend, mas IGNORADO:
  // o desconto é recalculado server-side via resolveCouponForItems().
  couponDiscount: z.number().nonnegative().optional().default(0),
  cardToken: z.string().optional(),
  paymentMethodId: z.string().optional(), // bandeira MP (visa/master/debvisa/...)
  // 'credit_card' | 'debit_card' — resolvido pelo BIN no front.
  cardType: z.enum(['credit_card', 'debit_card']).optional(),
  cardBrand: z.string().max(40).optional(), // nome de exibição (Visa, Elo…)
  cardLast4: z.string().regex(/^\d{4}$/).optional(),
  installments: z.number().int().positive().optional(),
  ip: z.string().optional(),
  // Device fingerprint do MP (window.MP_DEVICE_SESSION_ID via security.js).
  // Repassado ao gateway no header X-meli-session-id — melhora aprovação.
  deviceId: z.string().optional(),
});

export interface CheckoutResult {
  status: number;
  body: Record<string, unknown>;
}

const round2 = (v: number) => Math.round(v * 100) / 100;

/** Vencimento do boleto em dias ("P3D" no gateway; usado tb no dueAt da UI). */
const BOLETO_DUE_DAYS = 3;

/** Expiração do PIX em segundos (mesmo valor enviado ao gateway e à UI). */
const PIX_EXPIRES_SECONDS = 3600;

// Marcador de retirada na loja — manter em sincronia com PICKUP_CARRIER
// em src/app/(checkout)/checkout/page.tsx (GAP 8)
const PICKUP_CARRIER = 'Retirada na Loja';

/** Janela em que uma nova tentativa reaproveita o pedido falhado. */
const RETRY_REUSE_WINDOW_MS = 2 * 60 * 60 * 1000;

/** Descritor que aparece na fatura do cartão (≤ 22 chars). */
const STATEMENT_DESCRIPTOR = toStatementDescriptor(company.name);

/** URL absoluta da imagem do item (o MP ignora caminhos relativos). */
function absoluteImageUrl(image?: string): string | undefined {
  if (!image) return undefined;
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith('/')) return `${company.url}${image}`;
  return undefined;
}

/** Grava o motivo da recusa no pedido (não salva — o chamador salva). */
type OrderDoc = HydratedDocument<IOrder>;

function applyFailure(order: OrderDoc, failure: MpFailure) {
  order.payment.status = 'failed';
  order.payment.failureCode = failure.code;
  order.payment.failureMessage = failure.message;
  order.payment.failedAt = new Date();
}

type CartItem = z.infer<typeof itemSchema>;

/** Item do carrinho com o preço-verdade do banco aplicado. */
type PricedItem = CartItem & { unitPrice: number };

function mapAddress(a: z.infer<typeof addressSchema>): MpAddressInput {
  return {
    zipCode: a.cep,
    street: a.street,
    number: a.number,
    complement: a.complement,
    neighborhood: a.neighborhood,
    city: a.city,
    state: a.state,
  };
}

/**
 * Preço efetivo cobrado por unidade.
 * Regra atual do catálogo: `price` É o preço de venda final;
 * `compareAtPrice` é o "de" riscado e `isOnSale`/`salePercentage` são
 * flags de exibição. Se essa regra mudar, ajuste APENAS aqui.
 */
function getEffectivePrice(product: { price: number }): number {
  return product.price;
}

/** Resultado da revalidação server-side dos itens do carrinho. */
type RevalidateResult =
  | { ok: true; items: PricedItem[] }
  | { ok: false; status: number; body: Record<string, unknown> };

/**
 * Revalida cada item do carrinho contra o Product no banco:
 * - produto precisa existir, estar ativo e publicado online;
 * - estoque precisa cobrir a quantidade;
 * - o preço cobrado vem do banco (getEffectivePrice).
 *
 * Se algum preço do cliente divergir do banco (> 1 centavo), retorna
 * staleCart com os preços atualizados — o frontend deve recarregar o
 * carrinho e o cliente reconfirmar. NUNCA cobramos silenciosamente um
 * valor diferente do que o cliente viu (nem a mais, nem a menos).
 */
async function revalidateItems(items: CartItem[]): Promise<RevalidateResult> {
  // Busca em lote: por _id quando houver, senão por SKU
  const ids = items.map(i => i.productId).filter(Boolean) as string[];
  const skus = items.filter(i => !i.productId && i.sku).map(i => i.sku);

  const query: Record<string, unknown>[] = [];
  if (ids.length) query.push({ _id: { $in: ids } });
  if (skus.length) query.push({ sku: { $in: skus } });
  if (!query.length) {
    return {
      ok: false,
      status: 400,
      body: { error: 'Itens do carrinho sem identificação de produto.' },
    };
  }

  let products: any[];
  try {
    products = await Product.find({ $or: query })
      .select(
        '_id sku name price compareAtPrice stock isActive isPublishedOnline',
      )
      .lean();
  } catch {
    // ObjectId inválido no productId → cast error do Mongoose
    return {
      ok: false,
      status: 400,
      body: { error: 'Identificador de produto inválido no carrinho.' },
    };
  }

  const byId = new Map(products.map(p => [String(p._id), p]));
  const bySku = new Map(products.map(p => [p.sku, p]));

  const priced: PricedItem[] = [];
  const updatedPrices: { productId?: string; sku?: string; price: number }[] =
    [];
  let stale = false;

  for (const item of items) {
    const product =
      (item.productId && byId.get(item.productId)) ||
      (item.sku && bySku.get(item.sku)) ||
      null;

    if (!product) {
      return {
        ok: false,
        status: 400,
        body: {
          error: `Produto "${item.name}" não está mais disponível.`,
          item: { productId: item.productId, sku: item.sku },
        },
      };
    }

    if (!product.isActive || !product.isPublishedOnline) {
      return {
        ok: false,
        status: 400,
        body: {
          error: `Produto "${product.name}" não está mais disponível para venda online.`,
          item: { productId: String(product._id), sku: product.sku },
        },
      };
    }

    if ((product.stock ?? 0) < item.quantity) {
      return {
        ok: false,
        status: 400,
        body: {
          error:
            (product.stock ?? 0) > 0
              ? `Estoque insuficiente para "${product.name}" (disponível: ${product.stock}).`
              : `"${product.name}" está esgotado.`,
          item: { productId: String(product._id), sku: product.sku },
          availableStock: product.stock ?? 0,
        },
      };
    }

    const unitPrice = round2(getEffectivePrice(product));
    if (Math.abs(unitPrice - item.price) > 0.01) {
      stale = true;
    }
    updatedPrices.push({
      productId: String(product._id),
      sku: product.sku,
      price: unitPrice,
    });
    priced.push({ ...item, unitPrice });
  }

  if (stale) {
    return {
      ok: false,
      status: 409,
      body: {
        error:
          'Os preços de alguns itens foram atualizados. Revise o carrinho e confirme novamente.',
        code: 'PRICES_CHANGED',
        updatedPrices,
      },
    };
  }

  return { ok: true, items: priced };
}

export async function processCheckout(
  method: PaymentMethod,
  raw: unknown,
): Promise<CheckoutResult> {
  const parsed = baseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: 400,
      body: { error: 'Dados inválidos', issues: parsed.error.flatten() },
    };
  }
  const input = parsed.data;

  // GAP 8 — RETIRADA NA LOJA: coerência server-side. O front marca a
  // retirada com shipping.carrier === 'Retirada na Loja' (PICKUP_CARRIER
  // em (checkout)/checkout/page.tsx — manter em sincronia). O Zod
  // nonnegative() bloqueia frete negativo, mas nada impedia um POST manual
  // com carrier de retirada e shippingCost > 0 (ou dados de transportadora).
  // Aqui o servidor FORÇA frete 0 e limpa os campos de envio.
  if (input.shipping?.carrier === PICKUP_CARRIER) {
    input.shippingCost = 0;
    input.shipping = {
      method: input.shipping.method || 'Retirada na Loja Física',
      carrier: PICKUP_CARRIER,
      estimatedDays: 0,
      melhorEnvioId: '',
    };
  }

  if (
    method === 'credit_card' &&
    (!input.cardToken || !input.paymentMethodId)
  ) {
    return {
      status: 400,
      body: {
        error: 'cardToken e paymentMethodId são obrigatórios para cartão.',
      },
    };
  }

  await connectDB();

  // 1. Revalidação server-side dos itens: existência, disponibilidade,
  // estoque e PREÇO-VERDADE do banco. O price do cliente é ignorado para
  // cobrança (anti-tampering) — divergência devolve 409 pro carrinho
  // recarregar.
  const revalidated = await revalidateItems(input.items);
  if (!revalidated.ok) {
    return { status: revalidated.status, body: revalidated.body };
  }
  const items = revalidated.items;

  // 1a. Totais 100% server-side, sobre os preços do banco
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  // 1b. Cupom: revalidado e recalculado no banco pelo serviço partilhado
  // (mesma lógica do /api/coupons/validate). Suporta restrição por
  // categoria/marca — o desconto incide apenas nos itens elegíveis.
  // O couponDiscount do cliente é ignorado (anti-tampering).
  let couponDiscount = 0;
  const couponCode = input.coupon.trim().toUpperCase();
  if (couponCode) {
    const couponResult = await resolveCouponForItems(
      couponCode,
      items.map(i => ({
        productId: i.productId,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    );
    if (!couponResult.ok) {
      return { status: 400, body: { error: couponResult.message } };
    }
    couponDiscount = couponResult.discount;
  }

  let methodDiscount = 0;
  if (method === 'pix') {
    methodDiscount =
      (subtotal - couponDiscount) * (company.payment.pixDiscountPercent / 100);
  } else if (method === 'boleto') {
    methodDiscount =
      (subtotal - couponDiscount) *
      (company.payment.boletoDiscountPercent / 100);
  }

  const totalDiscount = round2(couponDiscount + methodDiscount);
  const productsTotal = round2(subtotal - totalDiscount); // itens após desconto
  const total = round2(productsTotal + input.shippingCost);
  if (total <= 0 || productsTotal <= 0) {
    return { status: 400, body: { error: 'Total inválido.' } };
  }

  // Tipo do cartão (débito não parcela e é registado como 'debit_card').
  const cardType = method === 'credit_card' ? input.cardType || 'credit_card' : undefined;

  // Parcelamento (só crédito): respeita máx. e parcela mínima
  let installments = 1;
  if (method === 'credit_card' && cardType === 'credit_card') {
    const { maxInstallments, minInstallmentValue } = company.payment;
    installments = Math.max(
      1,
      Math.min(input.installments ?? 1, maxInstallments),
    );
    while (installments > 1 && total / installments < minInstallmentValue)
      installments--;
  }

  // 2. Antifraude (camada da aplicação)
  const fraud = await checkFraud({
    email: input.customer.email,
    cpf: input.customer.document,
    ip: input.ip,
    amount: total,
  });
  if (!fraud.passed) {
    return {
      status: 403,
      body: {
        error: 'Pagamento não autorizado (verificação de segurança).',
        reasons: fraud.reasons,
      },
    };
  }

  // 3. Cria o pedido pendente — ou REAPROVEITA o pedido falhado de uma
  // tentativa anterior do mesmo comprador (mesmo e-mail, mesmo total, cartão,
  // dentro da janela). Evita N pedidos "failed" por cliente no admin e evita
  // que o velocity check do antifraude puna o próprio retry.
  let order: OrderDoc | null = null;
  let attempt = 1;

  if (method === 'credit_card') {
    const since = new Date(Date.now() - RETRY_REUSE_WINDOW_MS);
    const reusable = await Order.findOne({
      channel: 'online',
      createdAt: { $gte: since },
      'payment.status': 'failed',
      'payment.method': { $in: ['credit_card', 'debit_card'] },
      stockProcessed: { $ne: true },
      status: 'pending',
      total,
      $or: [
        { 'customerSnapshot.email': input.customer.email },
        { guestEmail: input.customer.email },
      ],
    }).sort({ createdAt: -1 });

    if (reusable) {
      order = reusable;
      attempt = (order.payment.attempts || 1) + 1;
      // Snapshot atualizado (o cliente pode ter corrigido endereço/telefone)
      order.customerSnapshot = {
        name: input.customer.name,
        cpf: input.customer.document,
        phone: input.customer.phone,
        email: input.customer.email,
      };
      order.set(
        'items',
        items.map(i => ({
          product: i.productId || undefined,
          sku: i.sku,
          name: i.name,
          slug: i.slug,
          image: i.image,
          variant: i.variant,
          quantity: i.quantity,
          price: i.unitPrice,
        })),
      );
      order.subtotal = round2(subtotal);
      order.shippingCost = input.shippingCost;
      order.discount = totalDiscount;
      order.coupon = couponCode;
      order.shippingAddress = {
        ...input.shippingAddress,
        name: input.shippingAddress.name || input.customer.name,
      };
      order.shipping = input.shipping;
      order.ip = input.ip || '';
      order.payment.method = cardType || 'credit_card';
      order.payment.status = 'pending';
      order.payment.installments = installments;
      order.payment.attempts = attempt;
      order.payment.mpOrderId = '';
      order.payment.mpPaymentId = '';
      await order.save();
    }
  }

  if (!order) {
    order = await Order.create({
      channel: 'online',
      user: input.userId || null,
      guestEmail: input.userId ? '' : input.customer.email,
      customerSnapshot: {
        name: input.customer.name,
        cpf: input.customer.document,
        phone: input.customer.phone,
        email: input.customer.email,
      },
      items: items.map(i => ({
        product: i.productId || undefined,
        sku: i.sku,
        name: i.name,
        slug: i.slug,
        image: i.image,
        variant: i.variant,
        quantity: i.quantity,
        price: i.unitPrice,
      })),
      subtotal: round2(subtotal),
      shippingCost: input.shippingCost,
      discount: totalDiscount,
      coupon: couponCode,
      total,
      shippingAddress: {
        ...input.shippingAddress,
        name: input.shippingAddress.name || input.customer.name,
      },
      payment: {
        method: method === 'credit_card' ? cardType || 'credit_card' : method,
        status: 'pending',
        installments,
        attempts: 1,
      },
      shipping: input.shipping,
      status: 'pending',
      ip: input.ip || '',
    });
  }

  // Dados de diagnóstico do cartão (não sensíveis)
  if (method === 'credit_card') {
    order.payment.cardBrand = input.cardBrand || input.paymentMethodId || '';
    order.payment.cardLast4 = input.cardLast4 || '';
    order.payment.deviceIdSent = !!input.deviceId;
    if (!input.deviceId) {
      console.warn('[Checkout] cartão sem device ID (security.js) —', order.orderNumber);
    }
  }

  // 4. Cria a order no Mercado Pago (API de Orders).
  // O MP cobra total_amount diretamente — sem distribuição de desconto por
  // item. O total já vem 100% calculado server-side acima.
  try {
    const payment =
      method === 'credit_card'
        ? {
            method: 'credit_card' as const,
            cardToken: input.cardToken!,
            paymentMethodId: input.paymentMethodId!,
            cardType,
            installments,
          }
        : method === 'pix'
          ? { method: 'pix' as const, expiresInSeconds: PIX_EXPIRES_SECONDS }
          : { method: 'boleto' as const, expiresInDays: BOLETO_DUE_DAYS };

    const pg = await createMpOrder({
      code: order.orderNumber,
      totalAmount: total,
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        document: input.customer.document,
        phone: input.customer.phone,
      },
      shippingAddress: mapAddress(input.shippingAddress),
      items: items.map(i => ({
        name: i.variant ? `${i.name} - ${i.variant}` : i.name,
        quantity: i.quantity,
        amount: i.unitPrice,
        sku: i.sku || undefined,
        pictureUrl: absoluteImageUrl(i.image),
      })),
      description: `Pedido ${order.orderNumber} - ${company.name}`,
      statementDescriptor: STATEMENT_DESCRIPTOR,
      payment,
      deviceId: input.deviceId,
      attempt,
    });

    // 4a. Consumo do cupom: incremento atômico após sucesso no gateway.
    // (Não incrementa em falha de gateway; pedido PIX abandonado consome —
    // trade-off aceito para loja pequena, evita corrida no limite de uso.)
    if (couponDiscount > 0 && couponCode) {
      Coupon.updateOne({ code: couponCode }, { $inc: { usedCount: 1 } })
        .exec()
        .catch(e => console.error('[Checkout] falha ao incrementar cupom:', e));
    }

    // 5. Atualiza pedido com o retorno do gateway
    order.payment.mpOrderId = pg.id;
    if (pg.payment?.id) order.payment.mpPaymentId = pg.payment.id;

    if (pg.pix) {
      // imagem: data URI base64 (o <img src> do PixPayment renderiza direto)
      order.payment.pixQrCode = pg.pix.qrCodeBase64
        ? `data:image/png;base64,${pg.pix.qrCodeBase64}`
        : pg.pix.ticketUrl;
      order.payment.pixCopyPaste = pg.pix.qrCode; // copia-e-cola (EMV)
    }

    if (pg.boleto) {
      order.payment.boletoUrl = pg.boleto.ticketUrl;
      // Linha digitável é o que o cliente usa para pagar (o barcode EAN
      // fica disponível no ticket_url para leitura ótica).
      order.payment.boletoBarcode = pg.boleto.digitableLine;
    }

    let failure: MpFailure | undefined;
    if (isPaidStatus(pg)) {
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
      order.status = 'confirmed';
      order.payment.failureCode = '';
      order.payment.failureMessage = '';
    } else if (isFailedStatus(pg)) {
      failure = pg.failure || describeFailure(pg.payment?.statusDetail || pg.statusDetail);
      applyFailure(order, failure);
      console.warn(
        '[Checkout] cartão recusado',
        order.orderNumber,
        `tentativa ${attempt}`,
        failure.code,
        `deviceId=${!!input.deviceId}`,
      );
    }

    await order.save();

    // 6. Pagamento aprovado na hora (cartão) → decrementa estoque e
    // confirma por e-mail. PIX/boleto pagos depois passam pelo webhook.
    // processOrderStock é idempotente (claim atômico): se esta chamada
    // falhar, o webhook order.paid que chega na sequência reprocessa.
    if (order.payment.status === 'paid') {
      await processOrderStock(order._id);

      // AGUARDADO (await): fire-and-forget morre na Vercel após a resposta.
      // Notifica CLIENTE + ADMIN; nunca lança.
      const email = order.customerSnapshot?.email || order.guestEmail;
      await sendOrderPaidEmails(email, order.orderNumber);
    }

    const ok = order.payment.status !== 'failed';
    return {
      status: ok ? 200 : 402,
      body: {
        success: ok,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentStatus: order.payment.status,
        failureCode: failure?.code,
        failureMessage: failure?.customerMessage,
        retryable: failure?.retryable,
        attempts: attempt,
        total,
        discount: totalDiscount,
        installments,
        pix: pg.pix
          ? {
              qrCode: pg.pix.qrCode,
              qrCodeUrl: order.payment.pixQrCode,
              // Ativa o countdown + estado "expirado" do PixPayment
              // (sem isto o front ficava em polling infinito).
              expiresAt: new Date(
                Date.now() + PIX_EXPIRES_SECONDS * 1000,
              ).toISOString(),
            }
          : undefined,
        boleto: pg.boleto
          ? {
              url: pg.boleto.ticketUrl,
              line: pg.boleto.digitableLine,
              barcode: pg.boleto.barcodeContent,
              dueAt: new Date(
                Date.now() + BOLETO_DUE_DAYS * 24 * 60 * 60 * 1000,
              ).toISOString(),
            }
          : undefined,
      },
    };
  } catch (err) {
    // Erro de INTEGRAÇÃO/infra (400 payload inválido, 401 token, 5xx, rede).
    // A recusa normal do cartão (402) já não lança — é tratada acima.
    const details =
      err instanceof MercadoPagoError
        ? (err.details as
            | {
                id?: string;
                message?: string;
                data?: { id?: string };
                errors?: Array<{ code?: string; message?: string }>;
              }
            | undefined)
        : undefined;
    const failedOrderId = details?.id || details?.data?.id;
    if (failedOrderId) order.payment.mpOrderId = String(failedOrderId);

    const code =
      details?.errors?.[0]?.code ||
      (err instanceof MercadoPagoError ? `http_${err.status}` : 'exception');
    const mpMessage =
      details?.errors?.[0]?.message ||
      details?.message ||
      (err instanceof Error ? err.message : 'Erro ao processar pagamento.');

    applyFailure(order, {
      code: String(code),
      message: `Erro na integração com o Mercado Pago (${code}): ${mpMessage}`,
      customerMessage: '',
      retryable: true,
    });
    await order.save().catch(() => {});

    console.error(
      '[Checkout] Mercado Pago erro:',
      order.orderNumber,
      mpMessage,
      details ?? err,
    );
    return {
      status: 502,
      body: {
        success: false,
        error:
          'Não foi possível processar o pagamento agora. Tente novamente em instantes ou pague com PIX.',
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentStatus: 'failed',
        failureCode: String(code),
        retryable: true,
      },
    };
  }
}
