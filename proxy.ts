import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes — check for auth cookie
  if (pathname.startsWith('/admin')) {
    const token =
      request.cookies.get('authjs.session-token') ||
      request.cookies.get('__Secure-authjs.session-token');

    if (!token) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }

  // Account routes — check for auth cookie
  if (
    pathname.startsWith('/minha-conta') ||
    pathname.startsWith('/meus-pedidos') ||
    pathname.startsWith('/enderecos') ||
    pathname.startsWith('/avaliacoes')
  ) {
    const token =
      request.cookies.get('authjs.session-token') ||
      request.cookies.get('__Secure-authjs.session-token');

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/minha-conta/:path*',
    '/meus-pedidos/:path*',
    '/enderecos/:path*',
    '/avaliacoes/:path*',
  ],
};
