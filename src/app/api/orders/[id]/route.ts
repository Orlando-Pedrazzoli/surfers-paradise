import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { OrderStatus, PaymentStatus } from '@/lib/types/order';

const _deps = [Product, User];
void _deps;

// ═══════════════════════════════════════════════════════════════
// GET — Buscar pedido por ID
// ═══════════════════════════════════════════════════════════════
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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

    if (body.notes !== undefined) {
      order.notes = body.notes;
    }

    await order.save();

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
