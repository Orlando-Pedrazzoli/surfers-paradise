// 📄 src/app/api/otp/route.ts
// Verificação de e-mail por OTP (substitui o stub).
//
// POST { action: 'send',   email }
// POST { action: 'verify', email, code }
//
// ★ CLAIM DOS PEDIDOS GUEST: acontece AQUI, no verify — só depois de
//   provada a posse do e-mail. Fazer o claim no cadastro seria uma
//   vulnerabilidade: qualquer um poderia registrar-se com o e-mail de quem
//   comprou como guest e ver os pedidos (endereço, CPF, histórico).
//
// Respostas neutras no 'send': não revelam se o e-mail tem conta
// (anti-enumeração de usuários).

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import User from '@/lib/models/User';
import Order from '@/lib/models/Order';
import { createAndSendOtp, verifyOtp } from '@/lib/services/otp';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action as string;
    const email = String(body.email || '')
      .trim()
      .toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'E-mail inválido.' },
        { status: 400 },
      );
    }

    // ─── Enviar / reenviar código ───
    if (action === 'send') {
      const result = await createAndSendOtp(email);
      if (!result.ok) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            retryInSeconds: result.retryInSeconds,
          },
          { status: 429 },
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Código enviado. Verifique seu e-mail.',
      });
    }

    // ─── Verificar código ───
    if (action === 'verify') {
      const result = await verifyOtp(email, String(body.code || ''));
      if (!result.ok) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 },
        );
      }

      await connectDB();

      // Marca o e-mail como verificado (se houver conta)
      const user = await User.findOneAndUpdate(
        { email },
        { $set: { isEmailVerified: true } },
        { new: true },
      ).select('_id');

      // ★ Claim: vincula à conta os pedidos feitos como guest com este
      // e-mail. Seguro porque a posse do e-mail acabou de ser provada.
      let claimedOrders = 0;
      if (user) {
        const claim = await Order.updateMany(
          { guestEmail: email, user: null },
          { $set: { user: user._id, guestEmail: '' } },
        );
        claimedOrders = claim.modifiedCount || 0;
        if (claimedOrders > 0) {
          console.info(
            `[OTP] ${claimedOrders} pedido(s) guest vinculado(s) à conta ${email}.`,
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: 'E-mail verificado com sucesso!',
        claimedOrders,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Ação inválida. Use "send" ou "verify".' },
      { status: 400 },
    );
  } catch (error) {
    console.error('POST /api/otp error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar solicitação.' },
      { status: 500 },
    );
  }
}
