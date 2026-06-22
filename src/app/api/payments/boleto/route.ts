// 📄 src/app/api/payments/boleto/route.ts
import { NextResponse } from 'next/server';
import { processCheckout } from '@/lib/services/checkout';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const body = await request.json().catch(() => ({}));
  const result = await processCheckout('boleto', {
    ...body,
    ip: body.ip || ip,
  });
  return NextResponse.json(result.body, { status: result.status });
}
