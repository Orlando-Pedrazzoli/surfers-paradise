import { auth } from '@/lib/auth/config';

export async function getSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Não autenticado');
  }
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== 'admin') {
    throw new Error('Acesso negado — apenas administradores');
  }
  return session;
}
