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

    // Remove default from all user addresses
    await Address.updateMany({ user: session.user.id }, { isDefault: false });

    // Set the selected as default
    const address = await Address.findOneAndUpdate(
      { _id: id, user: session.user.id },
      { isDefault: true },
      { new: true },
    );

    if (!address)
      return NextResponse.json(
        { success: false, error: 'Endereço não encontrado' },
        { status: 404 },
      );

    return NextResponse.json({ success: true, address });
  } catch (error) {
    console.error('PUT /api/addresses/[id]/default error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao definir padrão' },
      { status: 500 },
    );
  }
}
