// 📄 src/app/api/payments/card/route.ts
// Checkout com cartão de crédito via Mercado Pago (Checkout Transparente).
// Recebe cardToken + paymentMethodId (bandeira) tokenizados no front com a
// Public Key e delega ao orquestrador processCheckout.

import { NextResponse } from 'next/server';
import { processCheckout } from '@/lib/services/checkout';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const body = await request.json().catch(() => ({}));
  const result = await processCheckout('credit_card', {
    ...body,
    ip: body.ip || ip,
  });
  return NextResponse.json(result.body, { status: result.status });
}
