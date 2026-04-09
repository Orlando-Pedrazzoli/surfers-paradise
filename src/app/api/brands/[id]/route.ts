import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Brand from '@/lib/models/Brand';

// GET — single brand
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const brand = await Brand.findById(id).lean();

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Marca não encontrada' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, brand });
  } catch (error) {
    console.error('GET brand error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar marca' },
      { status: 500 },
    );
  }
}

// PUT — update brand
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const brand = await Brand.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Marca não encontrada' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, brand });
  } catch (error) {
    console.error('PUT brand error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar marca' },
      { status: 500 },
    );
  }
}

// DELETE — delete brand
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;

    const brand = await Brand.findByIdAndDelete(id);

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Marca não encontrada' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, message: 'Marca removida' });
  } catch (error) {
    console.error('DELETE brand error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao remover marca' },
      { status: 500 },
    );
  }
}
