// 📄 src/app/api/payments/webhook/route.ts
// Recebe notificações do MERCADO PAGO (tópico "order" da API de Orders) e
// atualiza o status do pedido.
//
// Segurança: assinatura HMAC do header x-signature (ts + v1) validada em
// tempo constante com MP_WEBHOOK_SECRET — FAIL-CLOSED em produção
// (ver validateWebhookSignature em services/mercadopago.ts).
//
// Fonte de verdade: a notificação traz apenas o ID do recurso; o status
// REAL é buscado via GET /v1/orders/{id} — nunca confiamos no corpo da
// notificação para transições de estado.
//
// Idempotente: reenvio de evento de pedido já pago não reenvia e-mail;
// estoque usa claim atômico (processOrderStock/restoreOrderStock).
//
// Herda da versão Pagar.me: transições paid → estoque + e-mail;
// refund → restaura estoque; failed/expired → marca failed.

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';
import {
  validateWebhookSignature,
  parseWebhookEvent,
  getOrder,
  isPaidStatus,
  isFailedStatus,
  isRefundedStatus,
} from '@/lib/services/mercadopago';
import { sendOrderConfirmation } from '@/lib/services/email';
import { processOrderStock, restoreOrderStock } from '@/lib/services/inventory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Cold start + conexão fria ao Atlas + GET /v1/orders no MP podem passar o
// limite padrão da função na Vercel (o MP registava 502 e reenviava).
// 30s dá folga de sobra; o caminho quente responde em <2s.
export const maxDuration = 30;

export async function POST(request: Request) {
  const url = new URL(request.url);

  // 1. Parse do payload (o MP também manda data.id na query string)
  let payload: Record<string, any> = {};
  try {
    payload = await request.json();
  } catch {
    // corpo vazio é tolerado — alguns eventos chegam só com query params
  }
  const event = parseWebhookEvent(payload, url.searchParams);

  // 2. Autenticação (assinatura HMAC sobre data.id + x-request-id + ts)
  const authentic = validateWebhookSignature({
    xSignature: request.headers.get('x-signature'),
    xRequestId: request.headers.get('x-request-id'),
    dataId: event.dataId || null,
  });
  if (!authentic) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!event.dataId) {
    return NextResponse.json({ received: true, matched: false });
  }

  try {
    await connectDB();

    // 3. Busca o estado REAL na API do MP (fonte de verdade)
    let gw;
    try {
      gw = await getOrder(event.dataId);
    } catch (e) {
      console.error('[MP Webhook] falha ao consultar order:', event.dataId, e);
      // 500 → o MP reagenda o reenvio; não perdemos o evento
      return NextResponse.json({ error: 'gateway' }, { status: 500 });
    }

    // 4. Localiza o pedido local. Vínculo primário: mpOrderId/mpPaymentId.
    // FALLBACK: external_reference (= orderNumber) — cobre a corrida em que
    // a notificação chega ANTES de o checkout persistir o mpOrderId no
    // pedido (sem isto o webhook devolvia 200 matched:false e o MP não
    // reenviava, perdendo a confirmação).
    const lookups: Record<string, unknown>[] = [
      { 'payment.mpOrderId': gw.id },
      { 'payment.mpPaymentId': gw.payment?.id || '__none__' },
    ];
    if (gw.externalReference) {
      lookups.push({ orderNumber: gw.externalReference });
    }
    const order = await Order.findOne({ $or: lookups });

    if (order && !order.payment.mpOrderId) {
      // Vinculado pelo fallback — persiste o vínculo primário para os
      // próximos eventos e para o fallback ativo do /payments/status.
      order.payment.mpOrderId = gw.id;
      await order.save().catch(() => {});
    }

    if (!order) {
      console.warn('[MP Webhook] pedido não encontrado:', {
        action: event.action,
        mpOrderId: gw.id,
      });
      // Confirma recebimento para não gerar reenvios infinitos
      return NextResponse.json({ received: true, matched: false });
    }

    // 5. Aplica a transição (com idempotência)
    if (isPaidStatus(gw)) {
      if (order.payment.status === 'paid') {
        // Já processado (cartão aprovado no checkout, ou reenvio do MP).
        // E-mail NÃO é reenviado; estoque é reconferido (claim barato).
        processOrderStock(order._id).catch(() => {});
        return NextResponse.json({ received: true, idempotent: true });
      }
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
      if (order.status === 'pending') order.status = 'confirmed';
      if (gw.payment?.id) order.payment.mpPaymentId = gw.payment.id;

      await order.save();

      // 6. Estoque: decremento idempotente (claim atômico no inventory.ts)
      await processOrderStock(order._id);

      // 7. Confirmação por e-mail — é AQUI que o PIX pago é notificado
      // (o checkout só envia para cartão aprovado na hora). Fire-and-forget.
      const email = order.customerSnapshot?.email || order.guestEmail;
      if (email) {
        sendOrderConfirmation(email, order.orderNumber).catch(e =>
          console.error(
            '[MP Webhook] falha ao enviar confirmação:',
            order.orderNumber,
            e,
          ),
        );
      } else {
        console.error(
          '[MP Webhook] pedido pago sem e-mail de contato:',
          order.orderNumber,
        );
      }

      return NextResponse.json({ received: true });
    }

    if (isRefundedStatus(gw)) {
      const wasPaid = order.payment.status === 'paid';
      order.payment.status = 'refunded';
      await order.save();
      if (wasPaid || order.stockProcessed) {
        await restoreOrderStock(order._id);
      }
      return NextResponse.json({ received: true });
    }

    if (isFailedStatus(gw)) {
      if (order.payment.status !== 'paid') {
        order.payment.status = 'failed';
        if (['canceled', 'cancelled', 'expired'].includes(gw.status)) {
          order.status = 'cancelled';
        }
        await order.save();
      }
      return NextResponse.json({ received: true });
    }

    // created / action_required / processing → apenas confirma recebimento
    return NextResponse.json({ received: true, ignored: gw.status });
  } catch (err) {
    console.error('[MP Webhook] erro:', err);
    // 500 faz o MP reenviar (eventos transitórios não se perdem)
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
