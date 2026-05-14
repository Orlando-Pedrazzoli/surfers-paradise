import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import Category from '@/lib/models/Category';
import Brand from '@/lib/models/Brand';
import Supplier from '@/lib/models/Supplier';

const LOW_STOCK_THRESHOLD = 3;

// Force model registration
const _deps = [Product, Order, User, Category, Brand, Supplier];
void _deps;

export async function GET() {
  try {
    await connectDB();

    // Início do dia (00:00) e início do mês
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );

    // 7 dias atrás (para o gráfico)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      // Contadores básicos
      productCount,
      orderCount,
      userCount,
      categoryCount,
      brandCount,
      supplierCount,
      // Alertas
      lowStockCount,
      outOfStockCount,
      pendingOrdersCount,
      readyToPublishCount,
      // Vendas hoje (online + balcão futuramente)
      todayOrders,
      // Vendas este mês
      monthOrders,
      // Vendas mês anterior
      prevMonthOrders,
      // Vendas últimos 7 dias (para gráfico)
      last7DaysOrders,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Category.countDocuments(),
      Brand.countDocuments(),
      Supplier.countDocuments({ isActive: true }),
      Product.countDocuments({
        isActive: true,
        stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD },
      }),
      Product.countDocuments({
        isActive: true,
        stock: 0,
      }),
      Order.countDocuments({ status: 'pending' }),
      Product.countDocuments({
        isActive: true,
        completionStatus: 'complete',
        isPublishedOnline: false,
      }),
      Order.find({
        createdAt: { $gte: startOfToday },
        status: { $nin: ['cancelled'] },
      })
        .select('total')
        .lean(),
      Order.find({
        createdAt: { $gte: startOfMonth },
        status: { $nin: ['cancelled'] },
      })
        .select('total')
        .lean(),
      Order.find({
        createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
        status: { $nin: ['cancelled'] },
      })
        .select('total')
        .lean(),
      Order.find({
        createdAt: { $gte: sevenDaysAgo },
        status: { $nin: ['cancelled'] },
      })
        .select('total createdAt')
        .lean(),
    ]);

    // Cálculo de totais
    const todayRevenue = todayOrders.reduce(
      (sum, o) => sum + (o.total || 0),
      0,
    );
    const monthRevenue = monthOrders.reduce(
      (sum, o) => sum + (o.total || 0),
      0,
    );
    const prevMonthRevenue = prevMonthOrders.reduce(
      (sum, o) => sum + (o.total || 0),
      0,
    );

    // Variação percentual mês vs mês anterior
    let monthVsPrevPercent = 0;
    if (prevMonthRevenue > 0) {
      monthVsPrevPercent =
        ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;
    }

    // Agrupar vendas por dia (últimos 7 dias)
    const chartData: { date: string; total: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = last7DaysOrders.filter(o => {
        const od = new Date(o.createdAt);
        return od >= day && od <= dayEnd;
      });

      chartData.push({
        date: day.toISOString().slice(0, 10),
        total: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
        orders: dayOrders.length,
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        alerts: {
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
          pendingOrders: pendingOrdersCount,
          readyToPublish: readyToPublishCount,
        },
        today: {
          revenue: todayRevenue,
          ordersCount: todayOrders.length,
        },
        month: {
          revenue: monthRevenue,
          ordersCount: monthOrders.length,
          vsPrevPercent: monthVsPrevPercent,
        },
        catalog: {
          products: productCount,
          brands: brandCount,
          categories: categoryCount,
          suppliers: supplierCount,
        },
        customers: {
          total: userCount,
        },
        chart: chartData,
      },
    });
  } catch (error) {
    console.error('GET dashboard-stats error:', error);
    const message =
      error instanceof Error ? error.message : 'Erro ao buscar estatísticas';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
