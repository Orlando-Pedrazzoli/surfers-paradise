// 📄 src/lib/services/checkout.ts
// Orquestra o checkout online: valida → cupom server-side → totais →
// antifraude → cria pedido pending → cria pedido na Pagar.me → atualiza status.
//
// v2: desconto (cupom + método) distribuído proporcionalmente nos itens
// enviados à Pagar.me — a Orders API V5 não tem campo de desconto e cobra
// sempre soma(items) + frete.
// v2: dispara sendOrderConfirmation quando o cartão é aprovado na hora.
// v3: cupom revalidado e RECALCULADO server-side contra o model Coupon —
// o couponDiscount enviado pelo cliente é ignorado (anti-tampering).
// v3: usedCount incrementado atomicamente após sucesso no gateway.

import { z } from 'zod';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';
import Coupon from '@/lib/models/Coupon';
import { company } from '@/lib/config/company';
import {
  createOrder as createPagarmeOrder,
  PagarmeError,
  type PagarmeAddressInput,
} from '@/lib/services/pagarme';
import { checkFraud } from '@/lib/services/fraudProtection';
import { sendOrderConfirmation } from '@/lib/services/email';

export type PaymentMethod = 'credit_card' | 'pix' | 'boleto';

const itemSchema = z.object({
  productId: z.string().optional(),
  sku: z.string().optional().default(''),
  name: z.string(),
  slug: z.string().optional().default(''),
  image: z.string().optional().default(''),
  variant: z.string().optional().default(''),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(), // reais, unitário CHEIO
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
  installments: z.number().int().positive().optional(),
  ip: z.string().optional(),
});

export interface CheckoutResult {
  status: number;
  body: Record<string, unknown>;
}

const round2 = (v: number) => Math.round(v * 100) / 100;
const toCents = (v: number) => Math.round(v * 100);

function mapAddress(a: z.infer<typeof addressSchema>): PagarmeAddressInput {
  return {
    zipCode: a.cep,
    street: a.street,
    number: a.number,
    complement: a.complement,
    neighborhood: a.neighborhood,
    city: a.city,
    state: a.state,
    country: 'BR',
  };
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

/**
 * Distribui o desconto total proporcionalmente entre as linhas do carrinho,
 * em CENTAVOS, garantindo que a soma feche exatamente com o valor esperado.
 * Cada linha vira um item Pagar.me com quantity 1 e amount = total da linha
 * já descontado (a quantidade vai no nome, ex: "Deck Frontal (x2)").
 */
function buildPagarmeItems(
  items: z.infer<typeof itemSchema>[],
  subtotal: number,
  targetTotalCents: number,
) {
  const lineTotalsCents = items.map(i => toCents(i.price * i.quantity));
  const subtotalCents = toCents(subtotal);

  let allocated = 0;
  return items.map((item, idx) => {
    const isLast = idx === items.length - 1;
    let cents: number;
    if (isLast) {
      cents = targetTotalCents - allocated; // remainder fecha a conta
    } else {
      cents = Math.round(
        (lineTotalsCents[idx] / subtotalCents) * targetTotalCents,
      );
      cents = Math.max(1, cents); // Pagar.me exige amount >= 1
      allocated += cents;
    }
    return {
      name: item.quantity > 1 ? `${item.name} (x${item.quantity})` : item.name,
      quantity: 1,
      amount: cents,
      code: item.sku || undefined,
    };
  });
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

  if (method === 'credit_card' && !input.cardToken) {
    return {
      status: 400,
      body: { error: 'cardToken é obrigatório para cartão.' },
    };
  }

  await connectDB();

  // 1. Totais 100% server-side (NUNCA confie no total do cliente)
  // ⚠️ HARDENING recomendado: revalidar i.price contra o Product no banco.
  const subtotal = input.items.reduce((s, i) => s + i.price * i.quantity, 0);

  // 1a. Cupom: revalidado e recalculado no banco — valor do cliente ignorado
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

  // 3. Cria o pedido pendente
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
    items: input.items.map(i => ({
      product: i.productId || undefined,
      sku: i.sku,
      name: i.name,
      slug: i.slug,
      image: i.image,
      variant: i.variant,
      quantity: i.quantity,
      price: i.price,
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

  // 4. Cria o pedido na Pagar.me
  // Itens com desconto distribuído: a soma dos amounts + frete = total exato.
  try {
    const payment =
      method === 'credit_card'
        ? {
            method: 'credit_card' as const,
            cardToken: input.cardToken!,
            installments,
          }
        : method === 'pix'
          ? { method: 'pix' as const, expiresIn: 3600 }
          : { method: 'boleto' as const, dueInDays: 3 };

    const pg = await createPagarmeOrder({
      code: order.orderNumber,
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        document: input.customer.document,
        phone: input.customer.phone,
      },
      billingAddress: mapAddress(input.shippingAddress),
      shippingAddress: mapAddress(input.shippingAddress),
      shippingAmount: toCents(input.shippingCost),
      items: buildPagarmeItems(input.items, subtotal, toCents(productsTotal)),
      payment,
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
    order.payment.pagarmeOrderId = pg.id;
    if (pg.charge?.id) order.payment.pagarmeChargeId = pg.charge.id;

    if (pg.pix) {
      order.payment.pixQrCode = pg.pix.qrCodeUrl; // imagem do QR
      order.payment.pixCopyPaste = pg.pix.qrCode; // copia-e-cola (EMV)
    }
    if (pg.boleto) {
      order.payment.boletoUrl = pg.boleto.url;
      order.payment.boletoBarcode = pg.boleto.line; // linha digitável
    }

    const gwStatus = pg.charge?.status || pg.status;
    if (gwStatus === 'paid') {
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
      order.status = 'confirmed';
    } else if (
      ['failed', 'not_authorized', 'with_error'].includes(gwStatus || '')
    ) {
      order.payment.status = 'failed';
    }

    await order.save();

    // 6. Pagamento aprovado na hora (cartão) → confirma por e-mail.
    // PIX/boleto pagos depois são confirmados pelo webhook.
    if (order.payment.status === 'paid') {
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
              qrCodeUrl: pg.pix.qrCodeUrl,
              expiresAt: pg.pix.expiresAt,
            }
          : undefined,
        boleto: pg.boleto
          ? {
              url: pg.boleto.url,
              pdf: pg.boleto.pdf,
              line: pg.boleto.line,
              barcode: pg.boleto.barcode,
              dueAt: pg.boleto.dueAt,
            }
          : undefined,
      },
    };
  } catch (err) {
    order.payment.status = 'failed';
    await order.save().catch(() => {});
    const message =
      err instanceof PagarmeError
        ? err.message
        : 'Erro ao processar pagamento.';
    console.error(
      '[Checkout] Pagar.me erro:',
      message,
      err instanceof PagarmeError ? err.details : err,
    );
    return {
      status: 502,
      body: { error: message, orderNumber: order.orderNumber },
    };
  }
}
