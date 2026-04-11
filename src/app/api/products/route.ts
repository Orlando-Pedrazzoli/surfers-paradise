import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import Brand from '@/lib/models/Brand';

// Force model registration for populate
const _deps = [Category, Brand];
void _deps;

// GET — list products with pagination, filters, search
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const isActive = searchParams.get('isActive');
    const sort = searchParams.get('sort') || '-createdAt';
    const admin = searchParams.get('admin') === 'true';

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      filter.isActive = isActive === 'true';
    }

    // ═══ FAMILY SYSTEM ═══
    // Public listing: only show main variants (or products without family)
    // Admin listing: show all products
    if (!admin) {
      filter.isMainVariant = true;
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate('brand', 'name slug logo')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET products error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar produtos' },
      { status: 500 },
    );
  }
}

// POST — create product
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const product = await Product.create(body);
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error('POST product error:', error);
    const message =
      error instanceof Error && error.message.includes('E11000')
        ? 'Já existe um produto com este slug'
        : 'Erro ao criar produto';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
