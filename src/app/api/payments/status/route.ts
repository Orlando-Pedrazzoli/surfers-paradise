// 📄 src/app/api/payments/status/route.ts
// Consulta de status para polling do front (PIX/boleto confirmam via webhook).
//
// v2: valida ObjectId antes do findOne (orderId malformado devolvia 500).
// v2: FALLBACK ATIVO à Pagar.me com throttle — se o pedido está pending há
//     mais de 30s desde a última verificação, consulta getOrder() direto no
//     gateway. Se lá constar paid, aplica a mesma transição do webhook
//     (status + estoque idempotente + e-mail). Isso garante que o cliente
//     que pagou o PIX vê a confirmação MESMO se o webhook estiver fora do
//     ar ou mal configurado. O polling do front (a cada ~5s) continua
//     barato: o gateway é consultado no máximo a cada 30s por pedido.

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';
import { getOrder } from '@/lib/services/pagarme';
import { processOrderStock } from '@/lib/services/inventory';
import { sendOrderConfirmation } from '@/lib/services/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GATEWAY_CHECK_THROTTLE_MS = 30_000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get('orderNumber');
  const orderId = searchParams.get('orderId');

  if (!orderNumber && !orderId) {
    return NextResponse.json(
      { error: 'Informe orderNumber ou orderId.' },
      { status: 400 },
    );
  }

  if (orderId && !mongoose.isValidObjectId(orderId)) {
    return NextResponse.json({ error: 'orderId inválido.' }, { status: 400 });
  }

  await connectDB();

  const order = await Order.findOne(
    orderNumber ? { orderNumber } : { _id: orderId },
  );

  if (!order) {
    return NextResponse.json(
      { error: 'Pedido não encontrado.' },
      { status: 404 },
    );
  }

  // ── Fallback ativo: pending + PIX/boleto + throttle vencido → pergunta
  // direto à Pagar.me (rede de segurança para webhook fora do ar)
  // (const extraída para o narrowing do TS funcionar na chamada do getOrder)
  const pagarmeOrderId = order.payment.pagarmeOrderId;
  const isPollable =
    order.payment.status === 'pending' &&
    !!pagarmeOrderId &&
    ['pix', 'boleto'].includes(order.payment.method);

  const sinceLastCheck = Date.now() - new Date(order.updatedAt).getTime();

  if (
    isPollable &&
    pagarmeOrderId &&
    sinceLastCheck > GATEWAY_CHECK_THROTTLE_MS
  ) {
    try {
      const pg = await getOrder(pagarmeOrderId);
      const gwStatus = pg.charge?.status || pg.status;

      if (gwStatus === 'paid') {
        // Mesma transição do webhook — se o webhook chegar depois, o branch
        // idempotente dele não duplica e-mail nem estoque.
        order.payment.status = 'paid';
        order.payment.paidAt = new Date();
        if (order.status === 'pending') order.status = 'confirmed';
        await order.save();

        await processOrderStock(order._id);

        const email = order.customerSnapshot?.email || order.guestEmail;
        if (email) {
          sendOrderConfirmation(email, order.orderNumber).catch(e =>
            console.error(
              '[Payment Status] falha ao enviar confirmação:',
              order.orderNumber,
              e,
            ),
          );
        }
        console.info(
          '[Payment Status] pedido confirmado via fallback (webhook não chegou):',
          order.orderNumber,
        );
      } else if (['failed', 'canceled'].includes(gwStatus || '')) {
        order.payment.status = 'failed';
        if (gwStatus === 'canceled') order.status = 'cancelled';
        await order.save();
      } else {
        // Continua pendente — toca updatedAt para rearmar o throttle
        await Order.updateOne(
          { _id: order._id },
          { $currentDate: { updatedAt: true } },
        );
      }
    } catch (err) {
      // Gateway indisponível não pode quebrar o polling — segue com o banco
      console.error(
        '[Payment Status] fallback Pagar.me falhou:',
        order.orderNumber,
        err,
      );
    }
  }

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.payment.status,
    method: order.payment.method,
    paidAt: order.payment.paidAt ?? null,
  });
}
