import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 🚧 Modo manutenção — ativado pela env MAINTENANCE_MODE=true (Vercel).
// Todas as rotas públicas passam a redirecionar (307, temporário) para
// /em-construcao. Ficam acessíveis: painel admin, login do admin,
// API (o admin depende dela) e ficheiros estáticos. O POS fecha também.
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';

const MAINTENANCE_ALLOWED_PREFIXES = [
  '/em-construcao',
  '/admin',
  '/admin-login',
  '/api',
];

function hasSessionToken(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get('authjs.session-token') ||
      request.cookies.get('__Secure-authjs.session-token'),
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Modo manutenção — avaliado antes de tudo
  if (MAINTENANCE_MODE) {
    const allowed = MAINTENANCE_ALLOWED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    if (!allowed) {
      return NextResponse.redirect(new URL('/em-construcao', request.url), 307);
    }
  } else if (pathname === '/em-construcao') {
    // Fora da manutenção a página não deve existir publicamente
    return NextResponse.redirect(new URL('/', request.url), 307);
  }

  // Admin routes — check for auth cookie
  // (prefixo exato: /admin-login NÃO pode cair aqui, senão entra em loop)
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  if (isAdminRoute && !hasSessionToken(request)) {
    return NextResponse.redirect(new URL('/admin-login', request.url));
  }

  // Account routes — check for auth cookie
  if (
    (pathname.startsWith('/minha-conta') ||
      pathname.startsWith('/meus-pedidos') ||
      pathname.startsWith('/enderecos') ||
      pathname.startsWith('/avaliacoes')) &&
    !hasSessionToken(request)
  ) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Tudo exceto assets do Next e ficheiros estáticos (qualquer caminho com
  // extensão: favicon.ico, robots.txt, sitemap.xml, /images/*, etc.).
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
};
