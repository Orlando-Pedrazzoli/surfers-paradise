// 📄 src/app/api/shipping/balance/route.ts
// GAP 1 — Saldo da carteira Melhor Envio (exclusivo admin).
//
// GET → { success, balance, reserved, debts }
// Consumido pelo card <MelhorEnvioBalance /> no admin de pedidos: alerta
// vermelho abaixo de R$ 20 e refresh após cada compra de etiqueta.

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getBalance } from '@/lib/services/melhorEnvio';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const wallet = await getBalance();
    return NextResponse.json({ success: true, ...wallet });
  } catch (error) {
    console.error('GET shipping/balance error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao consultar o saldo do Melhor Envio.' },
      { status: 502 },
    );
  }
}
