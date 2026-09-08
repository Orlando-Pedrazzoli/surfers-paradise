// 📄 src/app/api/auth/change-password/route.ts
// GAP 4 — Alterar/definir senha na Minha Conta (sessão obrigatória).
//
// POST { currentPassword?, newPassword }
//
// • Conta COM senha: exige currentPassword correta (bcrypt.compare).
// • Conta Google-only (sem senha): DEFINE a primeira senha sem exigir a
//   atual — a sessão autenticada é a prova de identidade, coerente com a
//   decisão de conta híbrida do reset (GAP 3). Depois disso o login
//   credentials passa a funcionar (o authorize só lança 'use-google'
//   quando user.password está vazio).
// • Regra de senha idêntica ao register: mínimo 6, bcrypt custo 12.

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth/config';
import connectDB from '@/lib/db/connect';
import User from '@/lib/models/User';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: 'A nova senha deve ter pelo menos 6 caracteres.',
        },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('+password');
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 },
      );
    }

    if (user.password) {
      // Alteração: exige a senha atual
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Informe a senha atual.' },
          { status: 400 },
        );
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: 'Senha atual incorreta.' },
          { status: 400 },
        );
      }
    }
    // Sem senha (conta Google): define a primeira — sessão já autentica.

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Senha atualizada com sucesso.',
    });
  } catch (error) {
    console.error('change-password error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar a senha.' },
      { status: 500 },
    );
  }
}
