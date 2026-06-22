// 📄 src/app/api/payments/status/route.ts
// Consulta de status para polling do front (PIX/boleto confirmam via webhook).

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  await connectDB();

  const order = await Order.findOne(
    orderNumber ? { orderNumber } : { _id: orderId },
  ).select('orderNumber status payment.status payment.method payment.paidAt');

  if (!order) {
    return NextResponse.json(
      { error: 'Pedido não encontrado.' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.payment.status,
    method: order.payment.method,
    paidAt: order.payment.paidAt ?? null,
  });
}
