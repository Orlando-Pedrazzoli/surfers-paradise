import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from'); // YYYY-MM-DD
    const toParam = searchParams.get('to'); // YYYY-MM-DD
    const channel = searchParams.get('channel'); // 'pos' | 'online' | null

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros from e to obrigatórios' },
        { status: 400 },
      );
    }

    const startDate = new Date(fromParam);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(toParam);
    endDate.setHours(23, 59, 59, 999);

    const baseFilter: Record<string, unknown> = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ['cancelled'] },
    };
    if (channel) baseFilter.channel = channel;

    const orders = await Order.find(baseFilter).lean();

    // ═══════════════════════════════════════════════════
    // AGREGAÇÕES GERAIS
    // ═══════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════
    // SÉRIE TEMPORAL — Vendas por dia
    // ═══════════════════════════════════════════════════
    const dailyMap: { [key: string]: { revenue: number; count: number } } = {};

    // Inicializa todos os dias do range com zero
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const key = cursor.toISOString().slice(0, 10); // YYYY-MM-DD
      dailyMap[key] = { revenue: 0, count: 0 };
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const o of orders) {
      const date = new Date(o.createdAt);
      const key = date.toISOString().slice(0, 10);
      if (dailyMap[key]) {
        dailyMap[key].revenue += o.total || 0;
        dailyMap[key].count += 1;
      }
    }

    const dailySeries = Object.entries(dailyMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ═══════════════════════════════════════════════════
    // POR CANAL
    // ═══════════════════════════════════════════════════
    const byChannel = {
      pos: { count: 0, revenue: 0 },
      online: { count: 0, revenue: 0 },
    };
    for (const o of orders) {
      const ch = (o.channel as 'pos' | 'online') || 'online';
      byChannel[ch].count += 1;
      byChannel[ch].revenue += o.total || 0;
    }

    // ═══════════════════════════════════════════════════
    // POR FORMA DE PAGAMENTO
    // ═══════════════════════════════════════════════════
    const byPaymentMethod: {
      [key: string]: { count: number; revenue: number };
    } = {
      cash: { count: 0, revenue: 0 },
      pix: { count: 0, revenue: 0 },
      debit_card: { count: 0, revenue: 0 },
      credit_card: { count: 0, revenue: 0 },
      boleto: { count: 0, revenue: 0 },
    };
    for (const o of orders) {
      const method = o.payment?.method;
      if (method && byPaymentMethod[method]) {
        byPaymentMethod[method].count += 1;
        byPaymentMethod[method].revenue += o.total || 0;
      }
    }

    // ═══════════════════════════════════════════════════
    // TOP PRODUTOS
    // ═══════════════════════════════════════════════════
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
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    // ═══════════════════════════════════════════════════
    // TOP CLIENTES
    // ═══════════════════════════════════════════════════
    const customerMap: {
      [key: string]: {
        name: string;
        cpf: string;
        count: number;
        revenue: number;
      };
    } = {};

    for (const o of orders) {
      const name = o.customerSnapshot?.name || 'Consumidor';
      const cpf = o.customerSnapshot?.cpf || '';
      const key = cpf || name;

      if (key === 'Consumidor') continue; // Pula vendas anônimas

      if (!customerMap[key]) {
        customerMap[key] = {
          name,
          cpf,
          count: 0,
          revenue: 0,
        };
      }
      customerMap[key].count += 1;
      customerMap[key].revenue += o.total || 0;
    }

    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // ═══════════════════════════════════════════════════
    // CANCELADOS (informativo)
    // ═══════════════════════════════════════════════════
    const cancelledFilter: Record<string, unknown> = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'cancelled',
    };
    if (channel) cancelledFilter.channel = channel;
    const cancelledCount = await Order.countDocuments(cancelledFilter);

    return NextResponse.json({
      success: true,
      report: {
        period: {
          from: startDate.toISOString(),
          to: endDate.toISOString(),
          days: dailySeries.length,
        },
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
        dailySeries,
        byChannel,
        byPaymentMethod,
        topProducts,
        topCustomers,
      },
    });
  } catch (error) {
    console.error('GET reports error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao gerar relatório';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
