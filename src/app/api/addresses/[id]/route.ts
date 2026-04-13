import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import connectDB from '@/lib/db/connect';
import Address from '@/lib/models/Address';

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

    const address = await Address.findOneAndUpdate(
      { _id: id, user: session.user.id },
      { ...body, cep: body.cep?.replace(/\D/g, '') || '' },
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
