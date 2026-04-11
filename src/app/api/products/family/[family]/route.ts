import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Product from '@/lib/models/Product';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ family: string }> },
) {
  try {
    await connectDB();
    const { family } = await params;

    if (!family) {
      return NextResponse.json(
        { success: false, error: 'Family slug required' },
        { status: 400 },
      );
    }

    const products = await Product.find({
      productFamily: family,
      isActive: true,
    })
      .select(
        'name slug price compareAtPrice images thumbnail variantType color colorCode colorCode2 size isMainVariant stock',
      )
      .sort({ isMainVariant: -1, createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('GET family products error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar família' },
      { status: 500 },
    );
  }
}
