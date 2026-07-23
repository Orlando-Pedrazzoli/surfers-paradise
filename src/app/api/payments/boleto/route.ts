// 📄 src/app/api/payments/boleto/route.ts
// Boleto DESATIVADO na migração para o Mercado Pago.
// Para reativar: payment_method { id: 'bolbradesco', type: 'ticket' } na
// API de Orders + reexibir a aba no PaymentForm.

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Boleto temporariamente indisponível.' },
    { status: 410 },
  );
}
