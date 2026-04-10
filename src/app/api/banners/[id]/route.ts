import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Banner from '@/lib/models/Banner';

// GET — single banner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const banner = await Banner.findById(id).lean();

    if (!banner) {
      return NextResponse.json(
        { success: false, error: 'Banner não encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error('GET banner error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar banner' },
      { status: 500 },
    );
  }
}

// PUT — update banner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const banner = await Banner.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!banner) {
      return NextResponse.json(
        { success: false, error: 'Banner não encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error('PUT banner error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar banner' },
      { status: 500 },
    );
  }
}

// DELETE — delete banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;

    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return NextResponse.json(
        { success: false, error: 'Banner não encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, message: 'Banner removido' });
  } catch (error) {
    console.error('DELETE banner error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao remover banner' },
      { status: 500 },
    );
  }
}
