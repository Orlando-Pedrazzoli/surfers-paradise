import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import connectDB from '@/lib/db/connect';
import Address from '@/lib/models/Address';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 },
      );

    await connectDB();
    const addresses = await Address.find({ user: session.user.id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, addresses });
  } catch (error) {
    console.error('GET /api/addresses error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 },
      );

    await connectDB();
    const body = await request.json();
    const {
      name,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      cep,
      phone,
    } = body;

    if (
      !name ||
      !street ||
      !number ||
      !neighborhood ||
      !city ||
      !state ||
      !cep
    ) {
      return NextResponse.json(
        { success: false, error: 'Preencha os campos obrigatórios' },
        { status: 400 },
      );
    }

    // If this is the first address, make it default
    const count = await Address.countDocuments({ user: session.user.id });

    const address = await Address.create({
      user: session.user.id,
      name: name.trim(),
      street,
      number,
      complement: complement || '',
      neighborhood,
      city,
      state,
      cep: cep.replace(/\D/g, ''),
      phone: phone || '',
      isDefault: count === 0,
    });

    return NextResponse.json({ success: true, address }, { status: 201 });
  } catch (error) {
    console.error('POST /api/addresses error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar endereço' },
      { status: 500 },
    );
  }
}
