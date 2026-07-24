// 📄 src/app/api/payments/card/route.ts
// Checkout com cartão de crédito via Mercado Pago (Checkout Transparente).
// Recebe cardToken + paymentMethodId (bandeira) tokenizados no front com a
// Public Key e delega ao orquestrador processCheckout.
//
// v2 (SEGURANÇA): IP SEMPRE do header x-forwarded-for — o valor enviado no
// body é descartado (o spread coloca ip depois de ...body, sobrescrevendo).
// Antes era `body.ip || ip`, o que permitia contornar o velocity check do
// fraudProtection mandando um "ip" falso no POST. Mesma correção já
// aplicada na rota de PIX.

import { NextResponse } from 'next/server';
import { processCheckout } from '@/lib/services/checkout';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    '';
  const body = await request.json().catch(() => ({}));
  const result = await processCheckout('credit_card', { ...body, ip });
  return NextResponse.json(result.body, { status: result.status });
}
