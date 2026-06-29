import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Category from '@/lib/models/Category';
import Brand from '@/lib/models/Brand';

// Sempre fresco: garante que categorias criadas/editadas no admin
// aparecem de imediato na navbar e no ShopByCategory (sem cache estático).
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();
    const [categories, brands] = await Promise.all([
      Category.find({ isActive: true })
        .sort({ order: 1, name: 1 })
        .select('name slug parent level image megaImage')
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
