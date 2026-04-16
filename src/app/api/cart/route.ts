import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ items: [], total: 0 });
}

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
