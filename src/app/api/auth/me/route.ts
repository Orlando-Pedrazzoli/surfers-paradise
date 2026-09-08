// 📄 src/app/api/auth/me/route.ts
// v2 (GAP 4): GET agora devolve hasPassword — a Minha Conta usa para
//     decidir entre "Alterar senha" (exige a atual) e "Definir senha"
//     (contas Google-only, sem senha). O hash NUNCA sai da API.
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import connectDB from '@/lib/db/connect';
import User from '@/lib/models/User';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 },
      );

    await connectDB();
    const user = await User.findById(session.user.id)
      .select('-password')
      .lean();
    if (!user)
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 },
      );

    // hasPassword sem expor o hash (o select acima já o exclui)
    const hasPassword = !!(await User.exists({
      _id: session.user.id,
      password: { $exists: true, $nin: [null, ''] },
    }));

    return NextResponse.json({ success: true, user, hasPassword });
  } catch (error) {
    console.error('GET /api/auth/me error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 },
      );

    await connectDB();
    const body = await request.json();
    const { name, cpf, phone } = body;

    const updated = await User.findByIdAndUpdate(
      session.user.id,
      {
        name: name?.trim(),
        cpf: cpf?.replace(/\D/g, '') || '',
        phone: phone || '',
      },
      { new: true },
    ).select('-password');

    if (!updated)
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 },
      );

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('PUT /api/auth/me error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar' },
      { status: 500 },
    );
  }
}
