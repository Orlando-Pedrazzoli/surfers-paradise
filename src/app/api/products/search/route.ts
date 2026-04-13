import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import Brand from '@/lib/models/Brand';

const _deps = [Category, Brand];
void _deps;

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || '-createdAt';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    if (!q.trim()) {
      return NextResponse.json({
        success: true,
        products: [],
        pagination: { page, limit, total: 0, pages: 0 },
      });
    }

    const filter: Record<string, unknown> = {
      isActive: true,
      isMainVariant: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ],
    };

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice)
        (filter.price as Record<string, number>).$gte = parseFloat(minPrice);
      if (maxPrice)
        (filter.price as Record<string, number>).$lte = parseFloat(maxPrice);
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
      query: q,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro na busca' },
      { status: 500 },
    );
  }
}
