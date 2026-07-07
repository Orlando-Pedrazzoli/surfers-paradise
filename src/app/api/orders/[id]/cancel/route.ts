// 📄 src/app/api/orders/[id]/cancel/route.ts
// v2: AUTENTICAÇÃO — admin-only (qualquer um podia cancelar pedidos alheios).
// v2: restock via restoreOrderStock (claim idempotente no stockProcessed).
//     Corrige DOIS bugs do restock incondicional anterior:
//     1. Cancelar pedido online PENDING (PIX nunca pago → estoque nunca
//        decrementado) INFLAVA o estoque com unidades que não saíram.
//     2. O flag não era zerado — um charge.refunded da Pagar.me chegando
//        depois restauraria o estoque DE NOVO (devolução dupla).
//     Agora: só devolve se o estoque foi de fato decrementado, uma única
//     vez, de qualquer caminho (webhook, admin, cancel).
// v2: e-mail de cancelamento para pedidos online com contato.

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { requireAdminGuard } from '@/lib/auth/guards';
import { restoreOrderStock } from '@/lib/services/inventory';
import { sendOrderStatusUpdate } from '@/lib/services/email';

const _deps = [Product];
void _deps;

// ═══════════════════════════════════════════════════════════════
// POST — Cancelar pedido + devolver estoque (se decrementado)
// ═══════════════════════════════════════════════════════════════
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const guard = await requireAdminGuard();
    if (guard.response) return guard.response;

    await connectDB();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Pedido não encontrado' },
        { status: 404 },
      );
    }

    if (order.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Pedido já está cancelado' },
        { status: 400 },
      );
    }

    if (order.status === 'shipped' || order.status === 'delivered') {
      if (order.channel === 'online') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Pedido já foi enviado/entregue. Cancelamento online não permitido nesta fase — use devolução.',
          },
          { status: 400 },
        );
      }
      // Para POS, permite cancelar venda já finalizada (uso comum: erro do operador)
    }

    // 1. Devolve o estoque APENAS se ele foi decrementado (claim reverso
    //    idempotente — pedido pending nunca decrementou, então não devolve;
    //    reenvio de refund depois deste cancel também não devolve de novo).
    const restock = await restoreOrderStock(order._id);

    // 2. Atualiza o pedido
    order.status = 'cancelled';
    order.cancellationReason = body.reason || 'Cancelado pelo admin';
    order.cancelledAt = new Date();
    if (order.payment.status === 'paid') {
      order.payment.status = 'refunded';
    }
    await order.save();

    // 3. Notifica o cliente (só online; balcão não tem por quê)
    const customerEmail = order.customerSnapshot?.email || order.guestEmail;
    if (order.channel === 'online' && customerEmail) {
      sendOrderStatusUpdate(
        customerEmail,
        order.orderNumber,
        'cancelled',
      ).catch(e =>
        console.error(
          '[Cancel Order] falha ao enviar e-mail:',
          order.orderNumber,
          e,
        ),
      );
    }

    return NextResponse.json({
      success: true,
      message: restock.processed
        ? 'Pedido cancelado e estoque devolvido'
        : 'Pedido cancelado (estoque não havia sido decrementado)',
      order: order.toObject(),
    });
  } catch (error) {
    console.error('POST cancel order error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao cancelar pedido';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
