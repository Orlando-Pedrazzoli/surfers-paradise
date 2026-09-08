// 📄 src/app/api/shipping/balance/add/route.ts
// GAP 1 — Recarga de saldo Melhor Envio via PIX (exclusivo admin).
//
// POST { value } → { success, paymentUrl }
// Limites do gateway yapay-transparente: mín R$ 5, máx R$ 10.000.
// O paymentUrl abre o QR Code PIX; após pagar, o admin clica em
// "Já paguei — atualizar saldo" no card (refetch do GET /balance).

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { addBalance } from '@/lib/services/melhorEnvio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIN_VALUE = 5;
const MAX_VALUE = 10_000;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const value = Number(body.value);

    if (!Number.isFinite(value) || value < MIN_VALUE || value > MAX_VALUE) {
      return NextResponse.json(
        {
          success: false,
          error: `Informe um valor entre R$ ${MIN_VALUE} e R$ ${MAX_VALUE.toLocaleString('pt-BR')}.`,
        },
        { status: 400 },
      );
    }

    const { paymentUrl } = await addBalance(value);
    if (!paymentUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            'A recarga foi iniciada, mas o link de pagamento não foi retornado. Conclua pelo painel do Melhor Envio.',
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, paymentUrl });
  } catch (error) {
    console.error('POST shipping/balance/add error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao iniciar a recarga de saldo.' },
      { status: 502 },
    );
  }
}
