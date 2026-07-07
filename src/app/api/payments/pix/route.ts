// 📄 src/app/api/payments/pix/route.ts
// v2: IP SEMPRE do header x-forwarded-for — o valor enviado no body é
// descartado (o spread coloca ip depois de ...body, sobrescrevendo).
// Sem isto o velocity check do fraudProtection era contornável mandando
// um "ip" falso no POST.

import { NextResponse } from 'next/server';
import { processCheckout } from '@/lib/services/checkout';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    '';
  const body = await request.json().catch(() => ({}));
  const result = await processCheckout('pix', { ...body, ip });
  return NextResponse.json(result.body, { status: result.status });
}
