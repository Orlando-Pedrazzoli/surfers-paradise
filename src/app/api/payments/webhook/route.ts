import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.text();
  console.log('[Webhook] Received:', body.substring(0, 100));
  return NextResponse.json({ received: true });
}
