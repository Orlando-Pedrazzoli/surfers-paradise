import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date'); // YYYY-MM-DD
    const channel = searchParams.get('channel'); // 'pos' | 'online' | null = ambos

    // Determinar intervalo do dia
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Filtro base
    const baseFilter: Record<string, unknown> = {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled'] },
    };
    if (channel) baseFilter.channel = channel;

    // Buscar todas as ordens do dia
    const orders = await Order.find(baseFilter).lean();

    // ═══════════════════════════════════════════════════════
    // AGREGAÇÕES
    // ═══════════════════════════════════════════════════════

    // 1. Totais gerais
    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const totalDiscount = orders.reduce((s, o) => s + (o.discount || 0), 0);
    const totalCost = orders.reduce(
      (s, o) =>
        s +
        (o.items || []).reduce(
          (is, i) => is + (i.costPrice || 0) * (i.quantity || 0),
          0,
        ),
      0,
    );
    const totalItems = orders.reduce(
      (s, o) =>
        s + (o.items || []).reduce((is, i) => is + (i.quantity || 0), 0),
      0,
    );
    const grossMargin = totalRevenue - totalCost;
    const marginPercent =
      totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
    const avgTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

    // 2. Por canal
    const byChannel = {
      pos: {
        count: 0,
        revenue: 0,
      },
      online: {
        count: 0,
        revenue: 0,
      },
    };
    for (const o of orders) {
      const ch = (o.channel as 'pos' | 'online') || 'online';
      byChannel[ch].count += 1;
      byChannel[ch].revenue += o.total || 0;
    }

    // 3. Por método de pagamento
    const byPaymentMethod: {
      [key: string]: { count: number; revenue: number };
    } = {
      cash: { count: 0, revenue: 0 },
      pix: { count: 0, revenue: 0 },
      debit_card: { count: 0, revenue: 0 },
      credit_card: { count: 0, revenue: 0 },
      boleto: { count: 0, revenue: 0 },
    };
    let totalCashReceived = 0;
    let totalCashChange = 0;

    for (const o of orders) {
      const method = o.payment?.method;
      if (method && byPaymentMethod[method]) {
        byPaymentMethod[method].count += 1;
        byPaymentMethod[method].revenue += o.total || 0;
      }
      if (method === 'cash') {
        totalCashReceived += o.payment?.cashReceived || 0;
        totalCashChange += o.payment?.cashChange || 0;
      }
    }

    // 4. Top produtos do dia
    const productMap: {
      [key: string]: {
        name: string;
        sku: string;
        quantity: number;
        revenue: number;
      };
    } = {};

    for (const o of orders) {
      for (const item of o.items || []) {
        const key = item.product?.toString() || item.sku || item.name;
        if (!productMap[key]) {
          productMap[key] = {
            name: item.name,
            sku: item.sku || '',
            quantity: 0,
            revenue: 0,
          };
        }
        productMap[key].quantity += item.quantity || 0;
        productMap[key].revenue += (item.price || 0) * (item.quantity || 0);
      }
    }

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // 5. Pedidos cancelados do dia (informativo)
    const cancelledFilter: Record<string, unknown> = {
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: 'cancelled',
    };
    if (channel) cancelledFilter.channel = channel;
    const cancelledCount = await Order.countDocuments(cancelledFilter);

    return NextResponse.json({
      success: true,
      report: {
        date: startOfDay.toISOString(),
        summary: {
          totalRevenue,
          totalDiscount,
          totalCost,
          grossMargin,
          marginPercent,
          totalItems,
          orderCount: orders.length,
          avgTicket,
          cancelledCount,
        },
        cash: {
          received: totalCashReceived,
          change: totalCashChange,
          net: totalCashReceived - totalCashChange,
        },
        byChannel,
        byPaymentMethod,
        topProducts,
      },
    });
  } catch (error) {
    console.error('GET cash-closing error:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Erro ao gerar fechamento de caixa';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
