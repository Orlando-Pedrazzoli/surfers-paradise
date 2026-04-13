import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Category from '@/lib/models/Category';
import Brand from '@/lib/models/Brand';

export async function GET() {
  try {
    await connectDB();

    const [categories, brands] = await Promise.all([
      Category.find({ isActive: true })
        .sort({ order: 1, name: 1 })
        .select('name slug parent level')
        .lean(),
      Brand.find({ isActive: true })
        .sort({ name: 1 })
        .select('name slug logo')
        .lean(),
    ]);

    return NextResponse.json({ success: true, categories, brands });
  } catch (error) {
    console.error('Catalog error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar catálogo' },
      { status: 500 },
    );
  }
}
