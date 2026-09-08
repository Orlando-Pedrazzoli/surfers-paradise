// 📄 src/app/api/shipping/label/pdf/[orderId]/route.ts
// GAP 2 — Proxy do PDF da etiqueta Melhor Envio (exclusivo admin).
//
// GET → application/pdf inline (Cache-Control: no-store)
//
// Por que proxy: as URLs do /print EXPIRAM (nunca são persistidas) e o
// visualizador embutido no painel precisa de um blob same-origin para o
// <iframe> + impressão. A rota re-solicita uma URL fresca ao ME, baixa o
// PDF server-side e o repassa. A geração do ME é ASSÍNCRONA: se o corpo
// ainda não for PDF (content-type divergente), devolve 503 amigável para
// o admin tentar de novo em segundos.

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import connectDB from '@/lib/db/connect';
import Order from '@/lib/models/Order';
import { getLabelPrintUrl } from '@/lib/services/melhorEnvio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    await connectDB();
    const { orderId } = await params;

    const order = await Order.findById(orderId)
      .select('orderNumber shipping.melhorEnvioId')
      .lean();
    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 },
      );
    }

    const shipmentId = order.shipping?.melhorEnvioId;
    if (!shipmentId) {
      return NextResponse.json(
        { error: 'Este pedido ainda não tem etiqueta gerada.' },
        { status: 404 },
      );
    }

    // URL sempre fresca — as URLs do /print expiram
    const printUrl = await getLabelPrintUrl(shipmentId, 'public');
    if (!printUrl) {
      return NextResponse.json(
        { error: 'Não foi possível obter a etiqueta no Melhor Envio.' },
        { status: 502 },
      );
    }

    const pdfRes = await fetch(printUrl, { cache: 'no-store' });
    const contentType = pdfRes.headers.get('content-type') || '';

    // Geração assíncrona do ME: enquanto não pronta, a URL responde HTML
    if (!pdfRes.ok || !contentType.includes('pdf')) {
      return NextResponse.json(
        {
          error:
            'A etiqueta ainda está sendo gerada pelo Melhor Envio — tente novamente em alguns segundos.',
        },
        { status: 503 },
      );
    }

    const pdf = await pdfRes.arrayBuffer();
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="etiqueta-${order.orderNumber}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('GET shipping/label/pdf error:', error);
    return NextResponse.json(
      { error: 'Erro ao obter o PDF da etiqueta.' },
      { status: 500 },
    );
  }
}
