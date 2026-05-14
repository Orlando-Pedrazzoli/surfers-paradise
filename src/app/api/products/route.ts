import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import Brand from '@/lib/models/Brand';
import Supplier from '@/lib/models/Supplier';

const _deps = [Category, Brand, Supplier];
void _deps;

const LOW_STOCK_THRESHOLD = 3;

type ProductContext = 'online' | 'pos' | 'admin';

function sanitizeProductBody(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized = { ...body };
  const objectIdFields = ['category', 'subcategory', 'brand', 'supplier'];
  for (const field of objectIdFields) {
    if (sanitized[field] === '' || sanitized[field] === undefined) {
      if (field === 'subcategory' || field === 'supplier') {
        sanitized[field] = null;
      } else {
        delete sanitized[field];
      }
    }
  }
  return sanitized;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || '-createdAt';

    const category = searchParams.get('category') || '';
    const categorySlug = searchParams.get('categorySlug') || '';
    const brand = searchParams.get('brand') || '';
    const supplier = searchParams.get('supplier') || '';

    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const adminLegacy = searchParams.get('admin') === 'true';
    const contextParam = searchParams.get('context') as ProductContext | null;
    const context: ProductContext = adminLegacy
      ? 'admin'
      : (contextParam ?? 'online');

    const isActiveParam = searchParams.get('isActive');
    const isFeatured = searchParams.get('isFeatured');
    const isNewArrival = searchParams.get('isNewArrival');
    const isOnSale = searchParams.get('isOnSale');
    const isAvailableInStoreParam = searchParams.get('isAvailableInStore');
    const isPublishedOnlineParam = searchParams.get('isPublishedOnline');

    const completionStatus = searchParams.get('completionStatus');
    const lowStock = searchParams.get('lowStock') === 'true';
    const outOfStock = searchParams.get('outOfStock') === 'true';

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { gtin: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) filter.category = category;

    if (categorySlug) {
      const cat = await Category.findOne({ slug: categorySlug }).lean();
      if (cat) {
        if (cat.level === 0) {
          const subcats = await Category.find({ parent: cat._id })
            .select('_id')
            .lean();
          const allCatIds = [cat._id, ...subcats.map(s => s._id)];
          filter.category = { $in: allCatIds };
        } else {
          filter.subcategory = cat._id;
        }
      }
    }

    if (brand) filter.brand = brand;
    if (supplier) filter.supplier = supplier;

    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (minPrice) priceFilter.$gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
      filter.price = priceFilter;
    }

    if (isFeatured === 'true') filter.isFeatured = true;
    if (isNewArrival === 'true') filter.isNewArrival = true;
    if (isOnSale === 'true') filter.isOnSale = true;

    if (context === 'online') {
      filter.isActive = true;
      filter.isPublishedOnline = true;
      filter.isMainVariant = true;
    } else if (context === 'pos') {
      filter.isActive = true;
      filter.isAvailableInStore = true;
    } else if (context === 'admin') {
      if (isActiveParam === 'true') filter.isActive = true;
      if (isActiveParam === 'false') filter.isActive = false;
    }

    if (isAvailableInStoreParam === 'true') filter.isAvailableInStore = true;
    if (isAvailableInStoreParam === 'false') filter.isAvailableInStore = false;
    if (isPublishedOnlineParam === 'true') filter.isPublishedOnline = true;
    if (isPublishedOnlineParam === 'false') filter.isPublishedOnline = false;

    if (completionStatus) {
      filter.completionStatus = completionStatus;
    }

    if (lowStock) {
      filter.stock = { $gt: 0, $lte: LOW_STOCK_THRESHOLD };
    } else if (outOfStock) {
      filter.stock = 0;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .populate({
          path: 'subcategory',
          select: 'name slug',
          match: { _id: { $exists: true } },
        })
        .populate('brand', 'name slug logo')
        .populate({
          path: 'supplier',
          select: 'name slug',
          match: { _id: { $exists: true } },
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      meta: {
        context,
        lowStockThreshold: LOW_STOCK_THRESHOLD,
      },
    });
  } catch (error) {
    console.error('GET products error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Erro ao buscar produtos';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const rawBody = await request.json();
    const body = sanitizeProductBody(rawBody);

    if (body.isPublishedOnline === true) {
      const dimensions = body.dimensions as
        | { length?: number; width?: number; height?: number }
        | undefined;
      const minimumCheck =
        body.name &&
        body.sku &&
        (body.price as number) > 0 &&
        body.category &&
        body.brand &&
        typeof body.description === 'string' &&
        body.description.trim().length >= 20 &&
        Array.isArray(body.images) &&
        body.images.length > 0 &&
        (body.weight as number) > 0 &&
        (dimensions?.length ?? 0) > 0 &&
        (dimensions?.width ?? 0) > 0 &&
        (dimensions?.height ?? 0) > 0;

      if (!minimumCheck) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Produto incompleto não pode ser publicado online. Verifique: descrição (≥20 caracteres), imagens, peso e dimensões.',
          },
          { status: 400 },
        );
      }
    }

    const product = await Product.create(body);
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error('POST product error:', error);
    const message =
      error instanceof Error && error.message.includes('E11000')
        ? error.message.includes('sku')
          ? 'Já existe um produto com este SKU'
          : 'Já existe um produto com este slug'
        : error instanceof Error
          ? error.message
          : 'Erro ao criar produto';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
