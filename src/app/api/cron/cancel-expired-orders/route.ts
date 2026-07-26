// 📄 src/app/api/cron/cancel-expired-orders/route.ts
// Vercel Cron — varredura diária de pedidos online não pagos vencidos.
// Rede de segurança do sweep lazy (GET /api/orders + dashboard-stats):
// garante o cancelamento mesmo em dias em que nenhum admin abre o painel.
//
// SEGURANÇA: protegida por CRON_SECRET (env var). A Vercel injeta
// automaticamente o header "Authorization: Bearer <CRON_SECRET>" nas
// invocações de cron quando a env var existe no projeto. Sem o secret
// correto, a rota responde 401 — ninguém dispara varreduras por fora.
//
// SETUP (uma vez):
//   1. Vercel → Settings → Environment Variables → CRON_SECRET
//      (gerar valor forte: openssl rand -hex 32)
//   2. Deploy — o agendamento vem do vercel.json

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { cancelExpiredOrders } from '@/lib/services/orderExpiration';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // varredura em lote pode demorar mais que o default

export async function GET(request: NextRequest) {
  // Autenticação do cron
  const authHeader = request.headers.get('authorization');
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      { success: false, error: 'Não autorizado' },
      { status: 401 },
    );
  }

  try {
    await connectDB();
    const result = await cancelExpiredOrders();

    console.info(
      `[Cron] cancel-expired-orders: ${result.cancelled} cancelado(s), ` +
        `${result.restocked} com estoque devolvido, ${result.errors} erro(s).`,
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[Cron] cancel-expired-orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro na varredura de pedidos expirados' },
      { status: 500 },
    );
  }
}
