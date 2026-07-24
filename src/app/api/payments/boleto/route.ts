// 📄 src/app/api/payments/boleto/route.ts
// Checkout com BOLETO bancário via Mercado Pago (API de Orders,
// payment_method { id: 'boleto', type: 'ticket' }, vencimento P3D).
// Reativado na v7 — o payer.address obrigatório vem do shippingAddress.
//
// IP SEMPRE do header x-forwarded-for — o valor enviado no body é
// descartado (o spread coloca ip depois de ...body, sobrescrevendo).
// Sem isto o velocity check do fraudProtection seria contornável.

import { NextResponse } from 'next/server';
import { processCheckout } from '@/lib/services/checkout';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    '';
  const body = await request.json().catch(() => ({}));
  const result = await processCheckout('boleto', { ...body, ip });
  return NextResponse.json(result.body, { status: result.status });
}
