import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({
    quotes: [
      { id: 1, name: 'PAC', price: 25.90, deliveryDays: 8, company: 'Correios' },
      { id: 2, name: 'SEDEX', price: 45.90, deliveryDays: 3, company: 'Correios' },
    ],
    cep: body.cep,
  });
}
