import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import Brand from '@/lib/models/Brand';

// Force model registration for populate
const _deps = [Category, Brand];
void _deps;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await connectDB();
    const { slug } = await params;

    const product = await Product.findOne({ slug, isActive: true })
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .lean();

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 },
      );
    }

    // ═══ FAMILY SYSTEM ═══
    // Fetch family siblings (same productFamily, all active, exclude current)
    let familyProducts: (typeof product)[] = [];
    if (product.productFamily) {
      familyProducts = await Product.find({
        productFamily: product.productFamily,
        isActive: true,
      })
        .select(
          'name slug price compareAtPrice images thumbnail variantType color colorCode colorCode2 size isMainVariant stock',
        )
        .sort({ isMainVariant: -1, createdAt: 1 })
        .lean();
    }

    // Fetch related products (same category, exclude current and family members)
    const familyIds = familyProducts.map(fp => fp._id);
    const excludeIds = [product._id, ...familyIds];

    const related = await Product.find({
      category: product.category,
      _id: { $nin: excludeIds },
      isActive: true,
      isMainVariant: true,
    })
      .limit(8)
      .select(
        'name slug price compareAtPrice images thumbnail isOnSale isNewArrival isFeatured salePercentage productFamily variantType color colorCode colorCode2 size isMainVariant',
      )
      .lean();

    return NextResponse.json({
      success: true,
      product,
      familyProducts,
      related,
    });
  } catch (error) {
    console.error('GET product by slug error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar produto' },
      { status: 500 },
    );
  }
}
