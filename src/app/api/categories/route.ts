import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Category from '@/lib/models/Category';

// GET — list all categories
export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find()
      .sort({ level: 1, order: 1 })
      .lean();
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('GET categories error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar categorias' },
      { status: 500 },
    );
  }
}

// POST — create category
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const category = await Category.create(body);
    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    console.error('POST category error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar categoria' },
      { status: 500 },
    );
  }
}
