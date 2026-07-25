// 📄 src/lib/services/checkout.ts
// Orquestra o checkout online: valida → REVALIDA PREÇOS NO BANCO → cupom
// server-side → totais → antifraude → cria pedido pending → cria a order no
// MERCADO PAGO (API de Orders) → atualiza status.
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
// v2: desconto (cupom + método) distribuído proporcionalmente nos itens
// enviados à Pagar.me — a Orders API V5 não tem campo de desconto e cobra
// sempre soma(items) + frete.
// v2: dispara sendOrderConfirmation quando o cartão é aprovado na hora.
// v3: cupom revalidado e RECALCULADO server-side contra o model Coupon —
// o couponDiscount enviado pelo cliente é ignorado (anti-tampering).
// v3: usedCount incrementado atomicamente após sucesso no gateway.
// v4: PREÇOS revalidados contra o Product no banco — o price enviado pelo
// cliente é usado apenas para detectar carrinho desatualizado (409 com
// preços novos); o valor cobrado vem SEMPRE do banco. Anti-tampering.
// v4: validação de ESTOQUE e disponibilidade (isActive + isPublishedOnline)
// antes de criar o pedido. (Decremento idempotente na transição paid é
// feito à parte — ver webhook.)
// v4: buildPagarmeItems com guarda contra último item <= 0 centavos em
// descontos agressivos (redistribui dos itens anteriores).
// v5: decrementa estoque no caminho de cartão aprovado na hora via
// processOrderStock (idempotente — o webhook cobre falhas desta chamada).

import { z } from 'zod';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';
import Coupon from '@/lib/models/Coupon';
import Product from '@/lib/models/Product';
import { company } from '@/lib/config/company';
import {
  createOrder as createMpOrder,
  isPaidStatus,
  isFailedStatus,
  MercadoPagoError,
  type MpAddressInput,
} from '@/lib/services/mercadopago';
import { checkFraud } from '@/lib/services/fraudProtection';
import { sendOrderConfirmation } from '@/lib/services/email';
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
  // o desconto é recalculado server-side em resolveCoupon().
  couponDiscount: z.number().nonnegative().optional().default(0),
  cardToken: z.string().optional(),
  paymentMethodId: z.string().optional(), // bandeira MP (visa/master/...)
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
async function revalidateItems(
  items: CartItem[],
): Promise<
  | { ok: true; items: PricedItem[] }
  | { ok: false; status: number; body: Record<string, unknown> }
> {
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

/**
 * Revalida o cupom no banco e recalcula o desconto server-side.
 * Mesmas regras da rota /api/coupons/validate.
 * Retorna { discount } ou { error } com mensagem pro cliente.
 */
async function resolveCoupon(
  code: string,
  subtotal: number,
): Promise<
  { discount: number; error?: never } | { error: string; discount?: never }
> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { discount: 0 };

  const coupon = await Coupon.findOne({ code: normalized });
  if (!coupon) return { error: 'Cupom inválido' };
  if (!coupon.isActive) return { error: 'Cupom inativo' };

  const now = new Date();
  if (now < coupon.validFrom) return { error: 'Cupom ainda não está válido' };
  if (now > coupon.validUntil) return { error: 'Cupom expirado' };

  const usageLimit = coupon.usageLimit ?? 0;
  if (usageLimit > 0 && coupon.usedCount >= usageLimit) {
    return { error: 'Cupom esgotado' };
  }
  if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
    return {
      error: `Pedido mínimo de R$ ${coupon.minOrderValue.toFixed(2)} para usar este cupom`,
    };
  }

  let discount =
    coupon.type === 'percentage'
      ? (subtotal * coupon.value) / 100
      : coupon.value;
  if (coupon.maxDiscount && coupon.maxDiscount > 0) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.min(discount, subtotal);
  return { discount: round2(discount) };
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

  // 1b. Cupom: revalidado e recalculado no banco — valor do cliente ignorado
  const couponResult = await resolveCoupon(input.coupon, subtotal);
  if (couponResult.error) {
    return { status: 400, body: { error: couponResult.error } };
  }
  const couponDiscount = couponResult.discount ?? 0;

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

  // Parcelamento (só cartão): respeita máx. e parcela mínima
  let installments = 1;
  if (method === 'credit_card') {
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

  // 3. Cria o pedido pendente (com os preços do BANCO no snapshot)
  const order = await Order.create({
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
    coupon: input.coupon ? input.coupon.trim().toUpperCase() : '',
    total,
    shippingAddress: {
      ...input.shippingAddress,
      name: input.shippingAddress.name || input.customer.name,
    },
    payment: { method, status: 'pending', installments },
    shipping: input.shipping,
    status: 'pending',
    ip: input.ip || '',
  });

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
      payment,
      deviceId: input.deviceId,
    });

    // 4a. Consumo do cupom: incremento atômico após sucesso no gateway.
    // (Não incrementa em falha de gateway; pedido PIX abandonado consome —
    // trade-off aceito para loja pequena, evita corrida no limite de uso.)
    if (couponDiscount > 0 && input.coupon) {
      Coupon.updateOne(
        { code: input.coupon.trim().toUpperCase() },
        { $inc: { usedCount: 1 } },
      )
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

    if (isPaidStatus(pg)) {
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
      order.status = 'confirmed';
    } else if (isFailedStatus(pg)) {
      order.payment.status = 'failed';
    }

    await order.save();

    // 6. Pagamento aprovado na hora (cartão) → decrementa estoque e
    // confirma por e-mail. PIX/boleto pagos depois passam pelo webhook.
    // processOrderStock é idempotente (claim atômico): se esta chamada
    // falhar, o webhook order.paid que chega na sequência reprocessa.
    if (order.payment.status === 'paid') {
      await processOrderStock(order._id);

      const email = order.customerSnapshot?.email || order.guestEmail;
      if (email) {
        sendOrderConfirmation(email, order.orderNumber).catch(e =>
          console.error('[Checkout] falha ao enviar confirmação:', e),
        );
      }
    }

    const ok = order.payment.status !== 'failed';
    return {
      status: ok ? 200 : 402,
      body: {
        success: ok,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentStatus: order.payment.status,
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
    order.payment.status = 'failed';
    // Se o MP criou a order mas o pagamento falhou (ex.: cartão recusado),
    // o corpo de erro traz a order — vincula o ID para o webhook conseguir
    // casar eventuais notificações desta order falhada.
    if (err instanceof MercadoPagoError) {
      const failedOrderId = (err.details as Record<string, any>)?.data?.id;
      if (failedOrderId) order.payment.mpOrderId = String(failedOrderId);
    }
    await order.save().catch(() => {});

    // 402 = transação recusada pelo emissor/gateway (não é erro do site).
    // Devolve o mesmo contrato do fluxo normal de recusa: o PaymentForm
    // mostra "Pagamento não autorizado pelo emissor do cartão...".
    if (err instanceof MercadoPagoError && err.status === 402) {
      return {
        status: 402,
        body: {
          success: false,
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          paymentStatus: 'failed',
        },
      };
    }

    const message =
      err instanceof MercadoPagoError
        ? err.message
        : 'Erro ao processar pagamento.';
    console.error(
      '[Checkout] Mercado Pago erro:',
      message,
      err instanceof MercadoPagoError ? err.details : err,
    );
    return {
      status: 502,
      body: { error: message, orderNumber: order.orderNumber },
    };
  }
}
