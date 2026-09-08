// 📄 src/app/api/auth/reset-password/route.ts
// GAP 3 — "Esqueci minha senha" (e definição de senha para contas Google).
//
// POST { email, otp, newPassword }
//
// Fluxo: o cliente pede o código pela rota existente POST /api/otp
// { action: 'send' } (respostas neutras, cooldown de 60s) e envia aqui o
// código + nova senha. verifyOtp é de USO ÚNICO e respeita o limite de 5
// tentativas do serviço — errar o código aqui consome tentativa como em
// qualquer outro verify.
//
// DECISÃO (conta híbrida): contas criadas via Google SEM senha podem
// definir uma por este fluxo — o OTP prova a posse do e-mail, o mesmo
// nível de confiança do account linking (email_verified do Google). Depois
// disso a conta aceita os DOIS logins: o authorize só lança 'use-google'
// quando user.password está vazio, então nenhuma mudança no config.ts é
// necessária.
//
// Anti-enumeração: o envio do código é neutro (rota /api/otp). Aqui, o
// "e-mail sem conta" só é revelado APÓS um OTP válido — ou seja, a quem
// já provou ter acesso à caixa de entrada. Não é enumeração.
//
// Bônus: reset bem-sucedido marca isEmailVerified (a posse foi provada,
// mesmo critério do fluxo /verificar-email).

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/connect';
import User from '@/lib/models/User';
import { verifyOtp } from '@/lib/services/otp';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const otp = String(body.otp || '').trim();
    const newPassword = String(body.newPassword || '');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'E-mail inválido.' },
        { status: 400 },
      );
    }

    // Mesma regra do register (mínimo 6 caracteres)
    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: 'A senha deve ter pelo menos 6 caracteres.',
        },
        { status: 400 },
      );
    }

    await connectDB();

    // Uso único + máx. 5 tentativas + comparação em tempo constante
    const otpResult = await verifyOtp(email, otp);
    if (!otpResult.ok) {
      return NextResponse.json(
        { success: false, error: otpResult.error },
        { status: 400 },
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      // OTP válido = quem pergunta tem acesso à caixa de entrada.
      // Informar que não há conta não é enumeração.
      return NextResponse.json(
        {
          success: false,
          error:
            'Não encontramos uma conta com este e-mail. Você pode se cadastrar gratuitamente.',
        },
        { status: 404 },
      );
    }

    // Mesmo custo do register (bcrypt 12). Para contas Google-only isto
    // DEFINE a primeira senha — a conta vira híbrida (Google + senha).
    user.password = await bcrypt.hash(newPassword, 12);
    user.isEmailVerified = true;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso.',
    });
  } catch (error) {
    console.error('reset-password error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao redefinir a senha.' },
      { status: 500 },
    );
  }
}
