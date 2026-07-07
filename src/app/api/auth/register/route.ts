// 📄 src/app/api/auth/register/route.ts
// v2: CPF validado por dígitos verificadores (mesma regra do checkout).
// v2: dispara o OTP de verificação automaticamente após criar a conta —
//     o frontend redireciona para /verificar-email, onde o verify marca
//     isEmailVerified e faz o claim dos pedidos guest (ver /api/otp).

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/connect';
import User from '@/lib/models/User';
import { createAndSendOtp } from '@/lib/services/otp';

function isValidCpf(raw: string): boolean {
  const cpf = (raw || '').replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const factor of [10, 11]) {
    let sum = 0;
    for (let i = 0; i < factor - 1; i++) {
      sum += parseInt(cpf[i]) * (factor - i);
    }
    const digit = ((sum * 10) % 11) % 10;
    if (digit !== parseInt(cpf[factor - 1])) return false;
  }
  return true;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, email, password, cpf, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Nome, email e senha são obrigatórios' },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Este email já está cadastrado' },
        { status: 409 },
      );
    }

    // CPF: dígitos verificadores (não só comprimento)
    if (cpf && !isValidCpf(cpf)) {
      return NextResponse.json(
        { success: false, error: 'CPF inválido' },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      cpf: cpf ? cpf.replace(/\D/g, '') : '',
      phone: phone || '',
      role: 'customer',
      isEmailVerified: false,
    });

    // Dispara o OTP de verificação (fire-and-forget: se o e-mail falhar,
    // a conta existe e a página /verificar-email tem botão de reenvio).
    createAndSendOtp(normalizedEmail).catch(e =>
      console.error('[Register] falha ao enviar OTP:', normalizedEmail, e),
    );

    return NextResponse.json(
      {
        success: true,
        requiresVerification: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar conta' },
      { status: 500 },
    );
  }
}
