// 📄 src/app/api/orders/[id]/route.ts
// v2: e-mails de transição de status — shipped (com rastreio) e delivered
//     disparam SÓ quando o status realmente mudou (salvar 2x não reenvia).
// v2: coerência com o estoque — paymentStatus marcado 'paid' manualmente
//     pelo admin decrementa estoque (processOrderStock, idempotente) e envia
//     a confirmação; 'paid' → 'refunded' restaura o estoque.
// v2: shippedAt/deliveredAt automáticos na transição, se não enviados.
// v3: AUTENTICAÇÃO — GET exige admin OU dono do pedido (a área do cliente
//     usa esta rota); PATCH exige admin. Antes a rota estava pública:
//     qualquer pessoa com um ID podia ler PII e alterar status/pagamento.

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { OrderStatus, PaymentStatus } from '@/lib/types/order';
import { getSession } from '@/lib/auth/middleware';
import {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
} from '@/lib/services/email';
import { processOrderStock, restoreOrderStock } from '@/lib/services/inventory';

const _deps = [Product, User];
void _deps;

type SessionUser = { id?: string; role?: string } | undefined;

function sessionUser(session: Awaited<ReturnType<typeof getSession>>) {
  return session?.user as SessionUser;
}

// ═══════════════════════════════════════════════════════════════
// GET — Buscar pedido por ID
// ═══════════════════════════════════════════════════════════════
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Guard: precisa estar autenticado; admin vê qualquer pedido,
    // cliente vê apenas os próprios (área do cliente).
    const session = await getSession();
    const su = sessionUser(session);
    if (!su?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 },
      );
    }

    await connectDB();
    const { id } = await params;

    const order = await Order.findById(id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name slug images thumbnail sku')
      .lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Pedido não encontrado' },
        { status: 404 },
      );
    }

    // Dono: order.user pode vir populado ({_id,...}) ou como ObjectId
    const ownerId =
      order.user && typeof order.user === 'object' && '_id' in order.user
        ? String((order.user as { _id: unknown })._id)
        : order.user
          ? String(order.user)
          : null;

    if (su.role !== 'admin' && ownerId !== su.id) {
      // 404 (não 403) para não confirmar a existência do pedido a terceiros
      return NextResponse.json(
        { success: false, error: 'Pedido não encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('GET order error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao buscar pedido';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH — Atualizar pedido (status, pagamento, tracking, notes)
// ═══════════════════════════════════════════════════════════════
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Guard: PATCH é exclusivo do admin (muda status, pagamento, rastreio)
    const session = await getSession();
    const su = sessionUser(session);
    if (!su?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 },
      );
    }
    if (su.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 },
      );
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Pedido não encontrado' },
        { status: 404 },
      );
    }

    // Bloquear edição de pedido cancelado
    if (order.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Não é possível editar pedido cancelado' },
        { status: 400 },
      );
    }

    // Snapshot dos estados ANTES das mudanças — é a comparação com eles
    // que decide os efeitos colaterais (e-mail, estoque) após o save.
    const prevStatus = order.status;
    const prevPaymentStatus = order.payment.status;

    // Atualizações permitidas
    if (body.status !== undefined) {
      const validStatuses: OrderStatus[] = [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: 'Status inválido' },
          { status: 400 },
        );
      }
      // Para cancelar, usar o endpoint /cancel (faz restock)
      if (body.status === 'cancelled') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Use o endpoint /cancel para cancelar (faz restock automático)',
          },
          { status: 400 },
        );
      }
      order.status = body.status;
    }

    if (body.paymentStatus !== undefined) {
      const validPaymentStatuses: PaymentStatus[] = [
        'pending',
        'paid',
        'failed',
        'refunded',
      ];
      if (!validPaymentStatuses.includes(body.paymentStatus)) {
        return NextResponse.json(
          { success: false, error: 'Status de pagamento inválido' },
          { status: 400 },
        );
      }
      order.payment.status = body.paymentStatus;
      if (body.paymentStatus === 'paid' && !order.payment.paidAt) {
        order.payment.paidAt = new Date();
      }
    }

    if (body.trackingCode !== undefined && order.shipping) {
      order.shipping.trackingCode = body.trackingCode;
    }

    if (body.shippedAt !== undefined && order.shipping) {
      order.shipping.shippedAt = new Date(body.shippedAt);
    }

    if (body.deliveredAt !== undefined && order.shipping) {
      order.shipping.deliveredAt = new Date(body.deliveredAt);
    }

    // Timestamps automáticos na transição (se não enviados no body)
    if (
      order.status === 'shipped' &&
      prevStatus !== 'shipped' &&
      order.shipping &&
      !order.shipping.shippedAt
    ) {
      order.shipping.shippedAt = new Date();
    }
    if (
      order.status === 'delivered' &&
      prevStatus !== 'delivered' &&
      order.shipping &&
      !order.shipping.deliveredAt
    ) {
      order.shipping.deliveredAt = new Date();
    }

    if (body.notes !== undefined) {
      order.notes = body.notes;
    }

    await order.save();

    // ═══ Efeitos colaterais das TRANSIÇÕES (comparadas ao snapshot) ═══
    const customerEmail = order.customerSnapshot?.email || order.guestEmail;

    // Pagamento marcado como pago manualmente pelo admin → mesmo fluxo do
    // webhook: estoque (idempotente via claim) + e-mail de confirmação.
    if (order.payment.status === 'paid' && prevPaymentStatus !== 'paid') {
      await processOrderStock(order._id);
      if (customerEmail) {
        // AGUARDADO: fire-and-forget morre na Vercel após a resposta.
        await sendOrderConfirmation(customerEmail, order.orderNumber).catch(e =>
          console.error(
            '[Admin Order] falha ao enviar confirmação:',
            order.orderNumber,
            e,
          ),
        );
      }
    }

    // Estorno manual → devolve o estoque (claim reverso, idempotente)
    if (order.payment.status === 'refunded' && prevPaymentStatus === 'paid') {
      await restoreOrderStock(order._id);
    }

    // Status do pedido mudou para shipped/delivered → e-mail de transição
    // (só quando MUDOU — salvar o pedido de novo não reenvia)
    if (
      order.status !== prevStatus &&
      (order.status === 'shipped' || order.status === 'delivered') &&
      customerEmail
    ) {
      // AGUARDADO: fire-and-forget morre na Vercel após a resposta.
      await sendOrderStatusUpdate(
        customerEmail,
        order.orderNumber,
        order.status,
        order.shipping?.trackingCode,
      ).catch(e =>
        console.error(
          '[Admin Order] falha ao enviar status update:',
          order.orderNumber,
          e,
        ),
      );
    }

    return NextResponse.json({ success: true, order: order.toObject() });
  } catch (error) {
    console.error('PATCH order error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao atualizar pedido';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
