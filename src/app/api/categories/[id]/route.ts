import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Category from '@/lib/models/Category';

// GET — single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const category = await Category.findById(id).lean();

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('GET category error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar categoria' },
      { status: 500 },
    );
  }
}

// PUT — update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const category = await Category.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('PUT category error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar categoria' },
      { status: 500 },
    );
  }
}

// DELETE — delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, message: 'Categoria removida' });
  } catch (error) {
    console.error('DELETE category error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao remover categoria' },
      { status: 500 },
    );
  }
}
