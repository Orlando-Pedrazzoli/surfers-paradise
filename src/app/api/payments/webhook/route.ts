// 📄 src/app/api/payments/webhook/route.ts
// Recebe notificações da Pagar.me V5 e atualiza o status do pedido.
// Segurança: Basic Auth (configurado no dashboard) validado em tempo constante,
// FAIL-CLOSED em produção (ver validateWebhookAuth em services/pagarme.ts).
// Idempotente: ignora eventos repetidos de pedido já pago.
//
// v2: envia e-mail de confirmação quando PIX/boleto vira "paid".
// v3: decrementa estoque na transição para paid (processOrderStock, claim
//     atômico idempotente) e restaura em refund (restoreOrderStock).
//     No branch idempotente também chama processOrderStock — cobre o caso
//     raro de o decremento do cartão instantâneo ter falhado no checkout
//     (a função é barata quando já processado: um findOneAndUpdate que não
//     casa filtro).

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';
import { validateWebhookAuth, parseWebhookEvent } from '@/lib/services/pagarme';
import { sendOrderConfirmation } from '@/lib/services/email';
import { processOrderStock, restoreOrderStock } from '@/lib/services/inventory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // 1. Autenticação
  if (!validateWebhookAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse do payload
  let payload: Record<string, any>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = parseWebhookEvent(payload);
  const data = payload?.data ?? {};

  try {
    await connectDB();

    // 3. Localiza o pedido (por orderId, chargeId ou orderNumber)
    const filters: Record<string, unknown>[] = [];
    if (data.id && String(data.id).startsWith('or_')) {
      filters.push({ 'payment.pagarmeOrderId': data.id });
    }
    if (data.id && String(data.id).startsWith('ch_')) {
      filters.push({ 'payment.pagarmeChargeId': data.id });
    }
    if (data.order?.id)
      filters.push({ 'payment.pagarmeOrderId': data.order.id });
    if (data.code) filters.push({ orderNumber: data.code });
    if (data.order?.code) filters.push({ orderNumber: data.order.code });

    if (filters.length === 0) {
      return NextResponse.json({ received: true, matched: false });
    }

    const order = await Order.findOne({ $or: filters });
    if (!order) {
      // Pedido desconhecido — confirma recebimento pra não gerar reenvios infinitos
      console.warn('[Pagar.me Webhook] pedido não encontrado:', {
        type: event.type,
        id: data.id,
        code: data.code || data.order?.code,
      });
      return NextResponse.json({ received: true, matched: false });
    }

    // 4. Classifica o evento
    const gwStatus = String(data.status || '').toLowerCase();
    const type = event.type || '';

    const isPaid =
      type === 'order.paid' || type === 'charge.paid' || gwStatus === 'paid';
    const isRefund = type.includes('refund') || gwStatus === 'refunded';
    const isFailed =
      type.includes('payment_failed') ||
      ['failed', 'not_authorized', 'with_error'].includes(gwStatus);
    const isCanceled = type.includes('canceled') || gwStatus === 'canceled';

    // 5. Aplica a transição (com idempotência)
    if (isPaid) {
      if (order.payment.status === 'paid') {
        // Já processado (cartão confirmado no checkout, ou reenvio da Pagar.me).
        // O e-mail NÃO é reenviado, mas o estoque é reconferido — cobre o caso
        // de o decremento ter falhado no momento do checkout. Barato quando já
        // processado (claim não casa e retorna direto).
        processOrderStock(order._id).catch(() => {});
        return NextResponse.json({ received: true, idempotent: true });
      }
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
      if (order.status === 'pending') order.status = 'confirmed';

      const chargeId =
        data.charges?.[0]?.id ||
        (String(data.id).startsWith('ch_') ? data.id : '');
      if (chargeId) order.payment.pagarmeChargeId = chargeId;

      await order.save();

      // 6. Estoque: decremento idempotente (claim atômico no inventory.ts).
      // Aguardamos de propósito — se falhar, loga mas NÃO falha o webhook.
      await processOrderStock(order._id);

      // 7. Confirmação por e-mail — é AQUI que PIX e boleto pagos são
      // notificados (o checkout só envia para cartão aprovado na hora).
      // Fire-and-forget: falha no e-mail não pode falhar o webhook, senão a
      // Pagar.me reenvia e tenta marcar como pago de novo.
      const email = order.customerSnapshot?.email || order.guestEmail;
      if (email) {
        sendOrderConfirmation(email, order.orderNumber).catch(e =>
          console.error(
            '[Pagar.me Webhook] falha ao enviar confirmação:',
            order.orderNumber,
            e,
          ),
        );
      } else {
        console.error(
          '[Pagar.me Webhook] pedido pago sem e-mail de contato:',
          order.orderNumber,
        );
      }

      return NextResponse.json({ received: true });
    }

    if (isRefund) {
      const wasPaid = order.payment.status === 'paid';
      order.payment.status = 'refunded';
      await order.save();
      // Devolve o estoque se ele tinha sido decrementado (claim reverso —
      // idempotente, reenvios de charge.refunded não restauram duas vezes)
      if (wasPaid || order.stockProcessed) {
        await restoreOrderStock(order._id);
      }
      return NextResponse.json({ received: true });
    }

    if (isFailed) {
      if (order.payment.status !== 'paid') order.payment.status = 'failed';
    } else if (isCanceled) {
      if (order.payment.status !== 'paid') {
        order.payment.status = 'failed';
        order.status = 'cancelled';
      }
    } else {
      // created / processing / etc → apenas confirma
      return NextResponse.json({ received: true, ignored: type });
    }

    await order.save();
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Pagar.me Webhook] erro:', err);
    // 500 faz a Pagar.me reenviar (eventos transitórios não se perdem)
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
