// 📄 src/app/api/addresses/[id]/route.ts
// v2: PUT com WHITELIST de campos — o { ...body } cru permitia mass
//     assignment (injetar `user` e mover o endereço para outra conta, ou
//     qualquer campo do schema). Agora só os campos editáveis passam.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import connectDB from '@/lib/db/connect';
import Address from '@/lib/models/Address';

const EDITABLE_FIELDS = [
  'name',
  'street',
  'number',
  'complement',
  'neighborhood',
  'city',
  'state',
  'phone',
] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 },
      );

    const { id } = await params;
    await connectDB();
    const body = await request.json();

    // Whitelist: apenas campos editáveis (nunca user, isDefault, _id...)
    const update: Record<string, string> = {};
    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) update[field] = body[field];
    }
    if (body.cep !== undefined) {
      update.cep = String(body.cep).replace(/\D/g, '');
    }

    const address = await Address.findOneAndUpdate(
      { _id: id, user: session.user.id },
      { $set: update },
      { new: true },
    );

    if (!address)
      return NextResponse.json(
        { success: false, error: 'Endereço não encontrado' },
        { status: 404 },
      );

    return NextResponse.json({ success: true, address });
  } catch (error) {
    console.error('PUT /api/addresses/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 },
      );

    const { id } = await params;
    await connectDB();

    const address = await Address.findOneAndDelete({
      _id: id,
      user: session.user.id,
    });
    if (!address)
      return NextResponse.json(
        { success: false, error: 'Endereço não encontrado' },
        { status: 404 },
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/addresses/[id] error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao remover' },
      { status: 500 },
    );
  }
}
