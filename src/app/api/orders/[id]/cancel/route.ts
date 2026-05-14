import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';

const _deps = [Product];
void _deps;

// ═══════════════════════════════════════════════════════════════
// POST — Cancelar pedido + devolver estoque (atomicamente)
// ═══════════════════════════════════════════════════════════════
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Devolver estoque de cada item
        for (const item of order.items) {
          if (item.product) {
            await Product.findByIdAndUpdate(
              item.product,
              {
                $inc: {
                  stock: item.quantity,
                  soldCount: -item.quantity,
                },
              },
              { session },
            );
          }
        }

        // Atualizar pedido
        order.status = 'cancelled';
        order.cancellationReason = body.reason || 'Cancelado pelo admin';
        order.cancelledAt = new Date();
        if (order.payment.status === 'paid') {
          order.payment.status = 'refunded';
        }
        await order.save({ session });
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json({
      success: true,
      message: 'Pedido cancelado e estoque devolvido',
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
