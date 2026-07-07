// 📄 src/lib/auth/guards.ts
// Guards para rotas de API — devolvem NextResponse de erro em vez de lançar
// (lançar Error cai no catch da rota e vira 500; o correto é 401/403).
//
// USO (primeira linha de cada handler):
//
//   // Admin-only:
//   const guard = await requireAdminGuard();
//   if (guard.response) return guard.response;
//
//   // Autenticado (qualquer usuário logado):
//   const guard = await requireAuthGuard();
//   if (guard.response) return guard.response;
//   const userId = guard.userId; // para escopar queries ao dono

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

interface GuardResult {
  response: NextResponse | null;
  userId: string;
  role: string;
}

export async function requireAuthGuard(): Promise<GuardResult> {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 },
      ),
      userId: '',
      role: '',
    };
  }
  return { response: null, userId: user.id, role: user.role || '' };
}

export async function requireAdminGuard(): Promise<GuardResult> {
  const base = await requireAuthGuard();
  if (base.response) return base;
  if (base.role !== 'admin') {
    return {
      ...base,
      response: NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 },
      ),
    };
  }
  return base;
}
