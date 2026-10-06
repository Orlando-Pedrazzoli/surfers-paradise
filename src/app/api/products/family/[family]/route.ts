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

    // 🔧 06/10/2026: dados públicos e iguais para todos → cache no CDN.
    // Cada ProductCard chama este endpoint; sem cache eram ~1 700 invocações
    // de função por dia só aqui. Com s-maxage o CDN responde sem acordar a
    // função (o stock das variantes pode demorar até 2 min a refletir; o
    // checkout valida o stock no servidor).
    return NextResponse.json(
      { success: true, products },
      {
        headers: {
          'Cache-Control':
            'public, max-age=60, s-maxage=120, stale-while-revalidate=600',
        },
      },
    );
  } catch (error) {
    console.error('GET family products error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar família' },
      { status: 500 },
    );
  }
}
