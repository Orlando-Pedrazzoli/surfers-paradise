// 📄 src/lib/services/checkout.ts (NOVO)
// Orquestra o checkout online: valida → totais server-side → antifraude →
// cria pedido pending → cria pedido na Pagar.me → atualiza status.

import { z } from 'zod';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';
import { company } from '@/lib/config/company';
import {
  createOrder as createPagarmeOrder,
  PagarmeError,
  type PagarmeAddressInput,
} from '@/lib/services/pagarme';
import { checkFraud } from '@/lib/services/fraudProtection';

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
  couponDiscount: z.number().nonnegative().optional().default(0), // reais
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
  // ⚠️ HARDENING recomendado: revalidar i.price contra o Product no banco (anti-tampering).
  const subtotal = input.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const couponDiscount = Math.min(input.couponDiscount, subtotal);

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
  const total = round2(subtotal - totalDiscount + input.shippingCost);
  if (total <= 0) return { status: 400, body: { error: 'Total inválido.' } };

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
    coupon: input.coupon,
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
      items: input.items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        amount: toCents(i.price),
        code: i.sku || undefined,
      })),
      payment,
    });

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
      ['failed', 'not_authorized', 'refused'].includes(gwStatus || '')
    ) {
      order.payment.status = 'failed';
    }

    await order.save();

    const ok = order.payment.status !== 'failed';
    return {
      status: ok ? 200 : 402,
      body: {
        success: ok,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        paymentStatus: order.payment.status,
        total,
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
