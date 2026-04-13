import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/connect';
import User from '@/lib/models/User';

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

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Este email já está cadastrado' },
        { status: 409 },
      );
    }

    // Validate CPF format if provided
    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, '');
      if (cleanCpf.length !== 11) {
        return NextResponse.json(
          { success: false, error: 'CPF inválido' },
          { status: 400 },
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      cpf: cpf ? cpf.replace(/\D/g, '') : '',
      phone: phone || '',
      role: 'customer',
      isEmailVerified: false,
    });

    return NextResponse.json(
      {
        success: true,
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
