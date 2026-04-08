import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/minha-conta/:path*',
    '/meus-pedidos/:path*',
    '/enderecos/:path*',
    '/admin/:path*',
  ],
};
